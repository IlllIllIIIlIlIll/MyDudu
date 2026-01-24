
const { fileURLToPath } = require('url');

async function test() {
    const urlBase = 'http://localhost:3000/users';

    console.log('\n--- Fetching All Users (Checking Posyandu Structure) ---');
    try {
        const res = await fetch(urlBase);
        const data = await res.json();

        console.log(`Found ${data.length} users.`);

        data.forEach(u => {
            console.log(`User: ${u.email} [${u.role}]`);
            console.log('Posyandu Field:', JSON.stringify(u.posyandu, null, 2));
            console.log('District Field:', JSON.stringify(u.district, null, 2));
            console.log('---');
        });

    } catch (e) {
        console.error('Fetch Error:', e);
    }
}

test();
