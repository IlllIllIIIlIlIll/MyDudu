import { Prisma } from '@prisma/client';

const PROTECTED_MODELS = ['Child', 'Session', 'SessionQuizStep', 'NutritionStatus'];

export function softDeleteMiddleware(): Prisma.Middleware {
    return async (params, next) => {
        // Block hard deletes on protected models
        if (PROTECTED_MODELS.includes(params.model || '') &&
            (params.action === 'delete' || params.action === 'deleteMany')) {
            throw new Error(
                `Hard delete forbidden on ${params.model}. Use soft delete: update({ deletedAt: new Date() })`
            );
        }

        // Auto-filter soft-deleted records
        if (params.model && (params.action === 'findMany' || params.action === 'findFirst' || params.action === 'findUnique')) {
            // Change findUnique to findFirst to allow filtering by non-unique deletedAt field
            if (params.action === 'findUnique') {
                params.action = 'findFirst';
            }

            if (params.args.where) {
                if (params.args.where.deletedAt === undefined) {
                    // Only exclude if deletedAt is not explicitly queried
                    params.args.where['deletedAt'] = null;
                }
            } else {
                params.args.where = { deletedAt: null };
            }
        }

        return next(params);
    };
}
