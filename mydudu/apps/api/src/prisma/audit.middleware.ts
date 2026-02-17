import { Prisma } from '@prisma/client';

const AUDITED_MODELS = ['Child', 'Session'];

// Helper to compare objects and return changed fields
function getChanges(oldObj: any, newObj: any): Record<string, { oldValue: any, newValue: any }> {
    const changes: Record<string, { oldValue: any, newValue: any }> = {};

    if (!oldObj || !newObj) return changes;

    const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);

    for (const key of allKeys) {
        // Skip internal fields or large objects
        if (['updatedAt', 'snapshotNodes'].includes(key)) continue;

        const val1 = oldObj[key];
        const val2 = newObj[key];

        // Simple equality check (works for primitives and Date objects via valueOf)
        if (JSON.stringify(val1) !== JSON.stringify(val2)) {
            changes[key] = { oldValue: val1, newValue: val2 };
        }
    }

    return changes;
}

export function auditMiddleware(prisma: any, userId?: number, ipAddress?: string): Prisma.Middleware {
    return async (params, next) => {
        if (!params.model || !AUDITED_MODELS.includes(params.model)) {
            return next(params);
        }

        // Capture BEFORE state for updates
        let before: any = null;
        if (params.action === 'update' || params.action === 'delete' || params.action === 'updateMany') {
            try {
                // We can only reliably audit single-record updates where ID is known or unique filter
                if (params.args.where) {
                    before = await prisma[params.model.toLowerCase()].findFirst({
                        where: params.args.where,
                    });
                }
            } catch (e) {
                console.warn(`[Audit] Failed to fetch before-state for ${params.model}`, e);
            }
        }

        const result = await next(params);

        // Capture AFTER state and log changes
        try {
            if (params.action === 'create') {
                // Log creation
                await prisma[`${params.model.toLowerCase()}UpdateLog`].create({
                    data: {
                        [`${params.model.toLowerCase()}Id`]: result.id,
                        userId,
                        action: 'CREATE',
                        fieldName: 'ALL',
                        newValue: JSON.stringify(result),
                        ipAddress,
                    },
                });
            } else if (params.action === 'update' && before) {
                // Log updates
                const changes = getChanges(before, result);

                // Check if soft-delete happened
                if (changes['deletedAt'] && !before.deletedAt && result.deletedAt) {
                    await prisma[`${params.model.toLowerCase()}UpdateLog`].create({
                        data: {
                            [`${params.model.toLowerCase()}Id`]: result.id,
                            userId,
                            action: 'SOFT_DELETE',
                            fieldName: 'deletedAt',
                            oldValue: null,
                            newValue: result.deletedAt.toISOString(),
                            ipAddress,
                        },
                    });
                }

                // Log other field changes
                for (const [field, { oldValue, newValue }] of Object.entries(changes)) {
                    if (field === 'deletedAt') continue; // Handled above

                    await prisma[`${params.model.toLowerCase()}UpdateLog`].create({
                        data: {
                            [`${params.model.toLowerCase()}Id`]: result.id,
                            userId,
                            action: 'UPDATE',
                            fieldName: field,
                            oldValue: oldValue ? JSON.stringify(oldValue) : null,
                            newValue: newValue ? JSON.stringify(newValue) : null,
                            ipAddress,
                        },
                    });
                }
            }
        } catch (e) {
            console.error(`[Audit] Failed to log audit entry for ${params.model}`, e);
            // Don't block the main operation if audit fails, but log error
        }

        return result;
    };
}
