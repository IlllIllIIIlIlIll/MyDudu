
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const API_URL = 'https://mydudu-api.onrender.com';

async function main() {
    console.log(`🚀 Testing Production API at ${API_URL}...`);

    try {
        // 1. Get valid Child
        const child = await prisma.child.findFirst();
        if (!child) {
            console.error('❌ No children found in DB to test with.');
            return;
        }
        console.log(`found child: ${child.fullName} (${child.childUuid})`);

        // 2. Get valid Device (optional but good for testing)
        const device = await prisma.device.findFirst();
        const deviceUuid = device?.deviceUuid;
        console.log(`found device: ${device?.name} (${deviceUuid})`);

        // 3. Construct Payload
        const payload = {
            childUuid: child.childUuid,
            deviceUuid: deviceUuid
        };

        // 4. Send Request
        console.log('📡 Sending POST /clinical/start ...');
        const response = await fetch(`${API_URL}/clinical/start`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        console.log(`Response Status: ${response.status} ${response.statusText}`);

        if (response.ok) {
            const data = await response.json();
            console.log('✅ Success! Response:', JSON.stringify(data, null, 2));
        } else {
            const text = await response.text();
            console.error('❌ Failed. Response Body:', text);
        }

    } catch (e) {
        console.error('❌ Script Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
