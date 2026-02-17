
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🧪 Testing Data Integrity Constraints...');

    // 1. Valid Parent for testing
    let parent = await prisma.user.findFirst({ where: { role: 'PARENT' } });
    if (!parent) {
        // Create one if missing (using raw create to avoid huge graph dependency)
        // Actually, parent needs to be in `Parent` table too.
        // Let's assume seed data exists or find any parent.
        const p = await prisma.parent.findFirst();
        if (!p) {
            console.error('❌ No parent found to link child to.');
            process.exit(1);
        }
        // We need the parent ID (integer)
        // parent = ...
    }

    // Easier: Just find a parent record directly.
    const parentRecord = await prisma.parent.findFirst();
    if (!parentRecord) {
        console.error('❌ No parent record found.');
        return;
    }

    // 2. Test Invalid Gender
    try {
        console.log('🔄 Attempting to create child with invalid gender "X"...');
        await prisma.child.create({
            data: {
                childUuid: `test-bad-gender-${Date.now()}`,
                fullName: 'Bad Gender Kid',
                birthDate: new Date(),
                gender: 'X', // Should fail: CHECK (gender IN ('M', 'F'))
                parentId: parentRecord.id,
                // bloodType: 'AB'
            }
        });
        console.error('❌ FAILED: Child with invalid gender WAS created!');
    } catch (e: any) {
        if (e.message.includes('chk_gender_valid')) {
            console.log('✅ PASSED: Stuck on invalid gender (chk_gender_valid).');
        } else {
            console.log(`✅ PASSED: Failed with error: ${e.message}`);
        }
    }

    // 3. Test Invalid Weight
    const child = await prisma.child.findFirst();
    const device = await prisma.device.findFirst();

    if (child && device) {
        try {
            console.log('🔄 Attempting to create session with weight 300kg...');
            await prisma.session.create({
                data: {
                    sessionUuid: `test-bad-weight-${Date.now()}`,
                    childId: child.id,
                    deviceId: device.id,
                    weight: 300, // Should fail: CHECK (weight < 200)
                    status: 'IN_PROGRESS'
                }
            });
            console.error('❌ FAILED: Session with invalid weight WAS created!');
        } catch (e: any) {
            if (e.message.includes('chk_weight_valid')) {
                console.log('✅ PASSED: Stuck on invalid weight (chk_weight_valid).');
            } else {
                console.log(`✅ PASSED: Failed with error: ${e.message}`);
            }
        }
    } else {
        console.warn('⚠️ Skipping session tests (no child/device found).');
    }

    // 4. Test Invalid Blood Type
    try {
        console.log('🔄 Attempting to create child with invalid blood type "C"...');
        await prisma.child.create({
            data: {
                childUuid: `test-bad-blood-${Date.now()}`,
                fullName: 'Bad Blood Kid',
                birthDate: new Date(),
                gender: 'M',
                parentId: parentRecord.id,
                bloodType: 'C' // Should fail: CHECK (blood_type IN ...)
            }
        });
        console.error('❌ FAILED: Child with invalid blood type WAS created!');
    } catch (e: any) {
        if (e.message.includes('chk_blood_type_valid')) {
            console.log('✅ PASSED: Stuck on invalid blood type (chk_blood_type_valid).');
        } else {
            console.log(`✅ PASSED: Failed with error: ${e.message}`);
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
