
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🧪 Testing WHO Growth Standards Lock...');

    try {
        console.log('🔄 Attempting to insert into fake WHO record...');
        // We need to use raw query because we might not have the model typed in client if we didn't generate yet 
        // or just use valid model if available. The schema has `WhoGrowthStandard`.

        await prisma.whoGrowthStandard.create({
            data: {
                type: 'WFA',
                gender: 'M',
                ageDays: 99999,
                l: 1, m: 0, s: 0,
                sd3neg: 0, sd2neg: 0, sd1neg: 0, sd0: 0, sd1: 0, sd2: 0, sd3: 0
            }
        });
        console.error('❌ FAILED: Insertion into who_growth_standards SUCCEEDED but should have been blocked!');
    } catch (e: any) {
        if (e.message.includes('prevent_who_standards_modification')) {
            console.log('✅ PASSED: Blocked by trigger as expected.');
        } else {
            // Maybe unique constraint or something else?
            console.log(`⚠️ Blocked by error: ${e.message}`);
            if (e.meta && e.meta.message && e.meta.message.includes('trigger')) {
                console.log('✅ PASSED: Blocked by trigger.');
            }
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
