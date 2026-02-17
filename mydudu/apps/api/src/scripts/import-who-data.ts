import { PrismaClient, WhoGender, WhoGrowthIndicator } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as path from 'path';

const prisma = new PrismaClient();

/**
 * WHO Growth Standards Data Import Script
 * 
 * Imports WHO growth reference data from XLSX files into the database.
 * This is READ-ONLY reference data used for growth analysis calculations.
 * 
 * Files to import:
 * - wfa-boys/girls-zscore-expanded-tables.xlsx (Weight for Age)
 * - wfh-boys/girls-zscore-expanded-tables.xlsx (Weight for Height)
 * - wfl-boys/girls-zscore-expanded-table.xlsx (Weight for Length)
 * - lhfa-boys/girls-zscore-expanded-tables.xlsx (Length/Height for Age)
 * - bfa-boys/girls-zscore-expanded-tables.xlsx (BMI for Age)
 */

interface WhoDataRow {
    indicator: WhoGrowthIndicator;
    gender: WhoGender;
    ageDays?: number;
    lengthHeightCm?: number;
    L: number;
    M: number;
    S: number;
    SD4neg?: number;
    SD3neg?: number;
    SD2neg?: number;
    SD1neg?: number;
    SD0: number;
    SD1?: number;
    SD2?: number;
    SD3?: number;
    SD4?: number;
}

function parseXlsxFile(
    filePath: string,
    indicator: WhoGrowthIndicator,
    gender: WhoGender,
    useAgeDays: boolean
): WhoDataRow[] {
    console.log(`📖 Reading ${path.basename(filePath)}...`);

    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data: any[] = XLSX.utils.sheet_to_json(worksheet);

    console.log(`   Found ${data.length} rows`);

    return data.map((row: any) => {
        const parsed: WhoDataRow = {
            indicator,
            gender,
            L: parseFloat(row.L || row.l),
            M: parseFloat(row.M || row.m),
            S: parseFloat(row.S || row.s),
            SD0: parseFloat(row.SD0 || row.M || row.m),
            SD4neg: row['SD4neg'] ? parseFloat(row['SD4neg']) : undefined,
            SD3neg: row['SD3neg'] ? parseFloat(row['SD3neg']) : undefined,
            SD2neg: row['SD2neg'] ? parseFloat(row['SD2neg']) : undefined,
            SD1neg: row['SD1neg'] ? parseFloat(row['SD1neg']) : undefined,
            SD1: row.SD1 ? parseFloat(row.SD1) : undefined,
            SD2: row.SD2 ? parseFloat(row.SD2) : undefined,
            SD3: row.SD3 ? parseFloat(row.SD3) : undefined,
            SD4: row.SD4 ? parseFloat(row.SD4) : undefined,
        };

        if (useAgeDays) {
            // For age-based indicators (WFA, LHFA, BFA)
            parsed.ageDays = parseInt(row.Day || row.Days || row.Age);
        } else {
            // For length/height-based indicators (WFH, WFL)
            parsed.lengthHeightCm = parseFloat(row.Length || row.Height);
        }

        return parsed;
    });
}

async function importWhoData() {
    console.log('🚀 Starting WHO Growth Standards Import\n');

    // Go up 5 levels from src/scripts/import-who-data.ts to reach project root
    // src/scripts -> src -> api -> apps -> mydudu -> MyDudu (Root)
    const rootDir = path.join(__dirname, '..', '..', '..', '..', '..');
    console.log(`📂 Resolved project root: ${rootDir}`);

    const files = [
        // Weight for Age (0-1856 days / 0-5 years)
        { file: 'wfa-boys-zscore-expanded-tables.xlsx', indicator: WhoGrowthIndicator.WEIGHT_FOR_AGE, gender: WhoGender.M, useAgeDays: true },
        { file: 'wfa-girls-zscore-expanded-tables.xlsx', indicator: WhoGrowthIndicator.WEIGHT_FOR_AGE, gender: WhoGender.F, useAgeDays: true },

        // Weight for Height (65-120 cm)
        { file: 'wfh-boys-zscore-expanded-tables.xlsx', indicator: WhoGrowthIndicator.WEIGHT_FOR_HEIGHT, gender: WhoGender.M, useAgeDays: false },
        { file: 'wfh-girls-zscore-expanded-tables.xlsx', indicator: WhoGrowthIndicator.WEIGHT_FOR_HEIGHT, gender: WhoGender.F, useAgeDays: false },

        // Weight for Length (45-110 cm)
        { file: 'wfl-boys-zscore-expanded-table.xlsx', indicator: WhoGrowthIndicator.WEIGHT_FOR_LENGTH, gender: WhoGender.M, useAgeDays: false },
        { file: 'wfl-girls-zscore-expanded-table.xlsx', indicator: WhoGrowthIndicator.WEIGHT_FOR_LENGTH, gender: WhoGender.F, useAgeDays: false },

        // Length/Height for Age (0-1856 days / 0-5 years)
        { file: 'lhfa-boys-zscore-expanded-tables.xlsx', indicator: WhoGrowthIndicator.LENGTH_HEIGHT_FOR_AGE, gender: WhoGender.M, useAgeDays: true },
        { file: 'lhfa-girls-zscore-expanded-tables.xlsx', indicator: WhoGrowthIndicator.LENGTH_HEIGHT_FOR_AGE, gender: WhoGender.F, useAgeDays: true },

        // BMI for Age (0-1856 days / 0-5 years)
        { file: 'bfa-boys-zscore-expanded-tables.xlsx', indicator: WhoGrowthIndicator.BMI_FOR_AGE, gender: WhoGender.M, useAgeDays: true },
        { file: 'bfa-girls-zscore-expanded-tables.xlsx', indicator: WhoGrowthIndicator.BMI_FOR_AGE, gender: WhoGender.F, useAgeDays: true },
    ];

    let totalRecords = 0;

    for (const { file, indicator, gender, useAgeDays } of files) {
        const filePath = path.join(rootDir, file);

        try {
            const rows = parseXlsxFile(filePath, indicator, gender, useAgeDays);

            console.log(`💾 Importing ${rows.length} records for ${indicator} (${gender})...`);

            // Batch insert for performance
            const batchSize = 500;
            for (let i = 0; i < rows.length; i += batchSize) {
                const batch = rows.slice(i, i + batchSize);

                await prisma.whoGrowthStandard.createMany({
                    data: batch.map(row => ({
                        indicator: row.indicator,
                        gender: row.gender,
                        ageDays: row.ageDays,
                        lengthHeightCm: row.lengthHeightCm,
                        l: row.L,
                        m: row.M,
                        s: row.S,
                        sd4Neg: row.SD4neg,
                        sd3Neg: row.SD3neg,
                        sd2Neg: row.SD2neg,
                        sd1Neg: row.SD1neg,
                        sd0: row.SD0,
                        sd1: row.SD1,
                        sd2: row.SD2,
                        sd3: row.SD3,
                        sd4: row.SD4,
                    })),
                    skipDuplicates: true, // Skip if already exists
                });
            }

            totalRecords += rows.length;
            console.log(`   ✅ Imported ${rows.length} records\n`);

        } catch (error) {
            console.error(`   ❌ Error importing ${file}:`, error.message);
            throw error;
        }
    }

    console.log(`\n✅ Import complete! Total records: ${totalRecords}`);

    // Verify data
    const count = await prisma.whoGrowthStandard.count();
    console.log(`📊 Database now contains ${count} WHO growth standard records`);
}

async function main() {
    try {
        // Check if data already exists
        const existingCount = await prisma.whoGrowthStandard.count();

        if (existingCount > 0) {
            console.log(`⚠️  Database already contains ${existingCount} WHO growth standard records`);
            console.log('   Do you want to clear and re-import? (This will DELETE existing data)');
            console.log('   Set FORCE_REIMPORT=1 to proceed\n');

            if (process.env.FORCE_REIMPORT !== '1') {
                console.log('❌ Import cancelled. Existing data preserved.');
                process.exit(0);
            }

            console.log('🗑️  Deleting existing WHO growth standards...');
            await prisma.whoGrowthStandard.deleteMany({});
            console.log('   ✅ Deleted\n');
        }

        await importWhoData();

    } catch (error) {
        console.error('❌ Import failed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
