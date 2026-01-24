
const { fileURLToPath } = require('url');

async function test() {
    const urlBase = 'http://localhost:3000/users';

    // 1. Create User
    const uniqueId = Date.now();
    const createBody = {
        fullName: 'Test User ' + uniqueId,
        email: `test.${uniqueId}@puskesmas.id`,
        district: 'Cilandak',
    };

    console.log('--- 1. Creating User ---');
    let userId = null;
    try {
        const res = await fetch(`${urlBase}/puskesmas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(createBody)
        });
        console.log('Create Status:', res.status);
        const data = await res.json();
        console.log('Created User:', data);
        userId = data.id;
    } catch (e) {
        console.error('Create Error:', e);
        return;
    }

    if (!userId) {
        console.log('Failed to create user, stopping.');
        return;
    }

    // 2. Get All Check
    console.log('\n--- 2. Fetching All Users ---');
    try {
        const res = await fetch(urlBase);
        const data = await res.json();
        const createdUser = data.find(u => u.id === userId);
        console.log('Found Created User in List:', createdUser);
        if (createdUser && createdUser.district) {
            console.log('District verification: PASS');
        } else {
            console.log('District verification: FAIL (District missing in response)');
        }
    } catch (e) {
        console.error('Fetch Error:', e);
    }

    // 3. Update User
    console.log('\n--- 3. Updating User ---');
    try {
        const updateBody = {
            fullName: 'Updated Name ' + uniqueId,
            district: 'Tebet' // Assuming Tebet exists, or use another known one. If not, it might fail or ignore.
        };
        const res = await fetch(`${urlBase}/${userId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateBody)
        });
        console.log('Update Status:', res.status);
        const data = await res.json();
        console.log('Updated User:', data);
    } catch (e) {
        console.error('Update Error:', e);
    }

    // 4. Delete User
    console.log('\n--- 4. Deleting User ---');
    try {
        const res = await fetch(`${urlBase}/${userId}`, {
            method: 'DELETE'
        });
        console.log('Delete Status:', res.status);
        const data = await res.json();
        console.log('Delete Response:', data);
    } catch (e) {
        console.error('Delete Error:', e);
    }
}

test();
