import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting session cleanup...');

    try {
        // Execute deletions in a transaction to ensure atomicity
        await prisma.$transaction([
            // 1. Delete dependent records that have ON DELETE RESTRICT
            prisma.sessionQuizStep.deleteMany({}),
            prisma.nutritionStatus.deleteMany({}),
            prisma.sessionUpdateLog.deleteMany({}),

            // 2. Delete Session records
            // Note: validationRecords, reports, and geotags have ON DELETE CASCADE, 
            // so they should be automatically deleted by the database when sessions are deleted.
            // However, if the text search (Fuzzy search) or other logs reference them, we might need to be careful.
            // Based on schema analysis, ValidationRecord, Report, Geotag are Cascaded.
            prisma.session.deleteMany({}),
        ]);

        console.log('Successfully deleted all sessions and related records.');
    } catch (error) {
        console.error('Error cleaning up sessions:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
