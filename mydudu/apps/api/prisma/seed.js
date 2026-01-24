const { PrismaClient } = require('@prisma/client');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
    console.log("🚀 Starting Seed...");

    // 1. ADMINS
    const admins = [
        { email: 'dudu.innovillage@gmail.com', name: 'Dudu Admin', role: 'ADMIN' },
        { email: 'izza.diasputra10@gmail.com', name: 'Favian', role: 'PUSKESMAS' }, // Role PUSKESMAS as per history
    ];
    for (const email of admins) {
        try {
            await prisma.user.upsert({
                where: { email },
                update: { role: 'ADMIN', status: 'ACTIVE' },
                create: {
                    email,
                    fullName: 'Admin User',
                    role: 'ADMIN',
                    status: 'ACTIVE',
                    passwordHash: 'seeded',
                },
            });
            console.log(`✅ Upsert Success: ${email}`);
        } catch (e) {
            console.error(`❌ Upsert Error ${email}:`, e.message);
        }
    }

    // 2. DISTRICTS
    const districts = [
        { code: "36.03.01", name: "Balaraja" },
        { code: "36.03.18", name: "Cikupa" },
        { code: "36.03.23", name: "Cisauk" },
        { code: "36.03.05", name: "Cisoka" },
        { code: "36.03.17", name: "Curug" },
        { code: "36.03.32", name: "Gunung Kaler" },
        { code: "36.03.04", name: "Jambe" },
        { code: "36.03.02", name: "Jayanti" },
        { code: "36.03.28", name: "Kelapa Dua" },
        { code: "36.03.09", name: "Kemiri" },
        { code: "36.03.06", name: "Kresek" },
        { code: "36.03.07", name: "Kronjo" },
        { code: "36.03.14", name: "Kosambi" },
        { code: "36.03.20", name: "Legok" },
        { code: "36.03.08", name: "Mauk" },
        { code: "36.03.33", name: "Mekarbaru" },
        { code: "36.03.22", name: "Pagedangan" },
        { code: "36.03.15", name: "Pakuhaji" },
        { code: "36.03.19", name: "Panongan" },
        { code: "36.03.12", name: "Pasar Kemis" },
        { code: "36.03.11", name: "Rajeg" },
        { code: "36.03.16", name: "Sepatan" },
        { code: "36.03.30", name: "Sepatan Timur" },
        { code: "36.03.29", name: "Sindang Jaya" },
        { code: "36.03.31", name: "Solear" },
        { code: "36.03.10", name: "Sukadiri" },
        { code: "36.03.27", name: "Sukamulya" },
        { code: "36.03.13", name: "Teluknaga" },
        { code: "36.03.03", name: "Tigaraksa" }
    ];

    console.log("\n🚀 Seeding Districts...");
    for (const district of districts) {
        try {
            await prisma.district.upsert({
                where: { code: district.code },
                update: { name: district.name },
                create: { code: district.code, name: district.name }
            });
        } catch (e) {
            console.error(`❌ Error seeding district ${district.name}:`, e.message);
        }
    }
    console.log(`✅ ${districts.length} Districts processed.`);

    // 3. VILLAGES
    const villageData = {
        "36.03.15": [ // Pakuhaji
            { code: "36.03.15.2002", name: "Paku Alam" },
            { code: "36.03.15.2003", name: "Bunisari" },
            { code: "36.03.15.2004", name: "Rawaboni (Rawa Boni)" },
            { code: "36.03.15.2005", name: "Buaran Mangga" },
            { code: "36.03.15.2006", name: "Buaran Bambu" },
            { code: "36.03.15.2007", name: "Kalibaru" },
            { code: "36.03.15.2008", name: "Kohod" },
            { code: "36.03.15.2009", name: "Kramat" },
            { code: "36.03.15.2010", name: "Sukawali" },
            { code: "36.03.15.2011", name: "Surya Bahari" },
            { code: "36.03.15.2012", name: "Kiara Payung" },
            { code: "36.03.15.2013", name: "Laksana" },
            { code: "36.03.15.2014", name: "Gaga" }
        ],
        "36.03.30": [ // Sepatan Timur
            { code: "36.03.30.2001", name: "Kedaung Barat" },
            { code: "36.03.30.2002", name: "Lebak Wangi" },
            { code: "36.03.30.2003", name: "Jati Mulya" },
            { code: "36.03.30.2004", name: "Sangiang" },
            { code: "36.03.30.2005", name: "Gempol Sari" },
            { code: "36.03.30.2006", name: "Kampung Kelor" },
            { code: "36.03.30.2007", name: "Pondok Kelor" },
            { code: "36.03.30.2008", name: "Tanah Merah" }
        ],
        "36.03.13": [ // Teluknaga
            { code: "36.03.13.2001", name: "Teluknaga" },
            { code: "36.03.13.2002", name: "Bojong Renged" },
            { code: "36.03.13.2003", name: "Babakan Asem" },
            { code: "36.03.13.2004", name: "Keboncau" },
            { code: "36.03.13.2005", name: "Pangkalan" },
            { code: "36.03.13.2006", name: "Kampung Melayu Timur" },
            { code: "36.03.13.2007", name: "Kampung Melayu Barat" },
            { code: "36.03.13.2008", name: "Muara" },
            { code: "36.03.13.2009", name: "Lemo" },
            { code: "36.03.13.2010", name: "Tanjung Pasir" },
            { code: "36.03.13.2011", name: "Tegal Angus" },
            { code: "36.03.13.2012", name: "Tanjung Burung" },
            { code: "36.03.13.2013", name: "Kampung Besar" }
        ]
    };

    console.log("\n🚀 Seeding Villages...");
    for (const [districtCode, villages] of Object.entries(villageData)) {
        try {
            const district = await prisma.district.findUnique({ where: { code: districtCode } });
            if (!district) {
                console.warn(`⚠️ District ${districtCode} not found. Skipping.`);
                continue;
            }
            for (const v of villages) {
                await prisma.village.upsert({
                    where: { code: v.code },
                    update: { name: v.name, districtId: district.id },
                    create: { code: v.code, name: v.name, districtId: district.id }
                });
            }
            console.log(`✅ Upserted ${villages.length} villages for ${district.name}`);
        } catch (e) {
            console.error(`❌ Error seeding villages for ${districtCode}:`, e.message);
        }
    }

    // 4. POSYANDUS
    const posyanduData = {
        "36.03.15.2005": [ // Buaran Mangga
            { name: "Burma 1", address: "Sekitar SDN Buaran Mangga 01 dan 03, Desa Buaran Mangga, Kecamatan Pakuhaji, Kabupaten Tangerang" },
            { name: "Burma 2", address: "Jl. Buaran Mangga Raya, RT 02 RW 03, dekat Mushola Al-Ikhlas, Desa Buaran Mangga, Kecamatan Pakuhaji, Kabupaten Tangerang" },
            { name: "Burma 3", address: "Jl. Kampung Buaran Mangga, RT 03 RW 04, dekat Balai Warga Buaran Mangga, Desa Buaran Mangga, Kecamatan Pakuhaji, Kabupaten Tangerang" },
            { name: "Burma 4", address: "Jl. Buaran Mangga Utara, RT 01 RW 05, dekat Pos RW 05, Desa Buaran Mangga, Kecamatan Pakuhaji, Kabupaten Tangerang" },
            { name: "Burma 5", address: "Jl. Buaran Mangga Selatan, RT 04 RW 02, dekat PAUD Buaran Mangga, Desa Buaran Mangga, Kecamatan Pakuhaji, Kabupaten Tangerang" }
        ],
        "36.03.15.2008": [ // Kohod
            { name: "Sukun 1", address: "Jl. Kampung Kohod, RT 01 RW 02, dekat Balai Desa Kohod, Kecamatan Pakuhaji, Kabupaten Tangerang" },
            { name: "Sukun 2", address: "Jl. Kohod Tengah, RT 02 RW 03, dekat Mushola Al-Hidayah, Kecamatan Pakuhaji, Kabupaten Tangerang" },
            { name: "Sukun 3", address: "Jl. Kohod Utara, RT 03 RW 04, dekat Pos RW 04 Desa Kohod, Kecamatan Pakuhaji, Kabupaten Tangerang" },
            { name: "Sukun 4", address: "Jl. Kohod Selatan, RT 01 RW 05, dekat PAUD/TK Kohod, Kecamatan Pakuhaji, Kabupaten Tangerang" }
        ]
    };

    console.log("\n🚀 Seeding Posyandus...");
    for (const [villageCode, posyandus] of Object.entries(posyanduData)) {
        try {
            const village = await prisma.village.findUnique({ where: { code: villageCode } });
            if (!village) {
                console.warn(`⚠️ Village ${villageCode} NOT FOUND for Posyandu seeding.`);
                continue;
            }

            for (const p of posyandus) {
                // Upsert logic for Posyandu
                const existing = await prisma.posyandu.findFirst({
                    where: { name: p.name, villageId: village.id }
                });

                if (existing) {
                    await prisma.posyandu.update({
                        where: { id: existing.id },
                        data: { address: p.address }
                    });
                } else {
                    await prisma.posyandu.create({
                        data: { name: p.name, address: p.address, villageId: village.id }
                    });
                }
            }
            console.log(`✅ Upserted ${posyandus.length} posyandus for ${village.name}`);
        } catch (e) {
            console.error(`❌ Error seeding posyandus for village ${villageCode}:`, e);
        }
    }

    // 5. DEVICES (Buaran Mangga)
    try {
        console.log("\n🚀 Seeding Devices...");
        // Find Burma 1 in Buaran Mangga
        const targetPosyandu = await prisma.posyandu.findFirst({
            where: {
                name: "Burma 1",
                village: { name: "Buaran Mangga" }
            }
        });

        if (targetPosyandu) {
            const device = await prisma.device.upsert({
                where: { deviceUuid: "DEV-BUARAN-001" },
                update: {
                    posyanduId: targetPosyandu.id
                    // No location field anymore
                },
                create: {
                    deviceUuid: "DEV-BUARAN-001",
                    name: "MyDudu_BuaranMangga_01",
                    posyanduId: targetPosyandu.id,
                    status: "OFFLINE",
                    batteryLevel: 100
                }
            });
            console.log(`✅ Upserted Device: ${device.name} (${device.deviceUuid}) at ${targetPosyandu.name}`);
        } else {
            console.warn("⚠️ 'Burma 1' Posyandu not found. Skipping Device creation.");
        }
    } catch (e) {
        console.error("❌ Error seeding device:", e);
    }

    // Verify
    const finalAdmins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
    console.log(`\nFinal Check: ${finalAdmins.length} Admins found.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
