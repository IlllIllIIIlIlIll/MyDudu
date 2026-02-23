import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function backup() {
    console.log('Starting automated database backup before seeding...');

    const backupDir = path.join(__dirname, '..', 'backups');
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const currentBackupDir = path.join(backupDir, `backup_${timestamp}`);
    fs.mkdirSync(currentBackupDir);

    try {
        // List of all tables from the Prisma schema
        const models = [
            'user', 'parent', 'child', 'device', 'session',
            'sessionQuizStep', 'village', 'district', 'schedule',
            'notification', 'auditLog', 'incident', 'nutritionStatus'
        ];

        for (const model of models) {
            if (prisma[model]) {
                const data = await (prisma[model] as any).findMany();
                fs.writeFileSync(
                    path.join(currentBackupDir, `${model}.json`),
                    JSON.stringify(data, null, 2)
                );
                console.log(`Backed up ${data.length} records from ${model}.`);
            }
        }

        console.log(`\n✅ Backup successfully saved to: ${currentBackupDir}\n`);
    } catch (e) {
        console.error('❌ Backup failed! Aborting seed process.', e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

backup();
