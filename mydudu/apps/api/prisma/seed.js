const { PrismaClient, UserRole, UserStatus, NutritionCategory, DeviceStatus, NotifType, NotifStatus } = require('@prisma/client');
const argon2 = require('argon2');

const prisma = new PrismaClient();

async function main() {
    console.log('Start seeding...');

    // 1. Optional destructive clean up (explicit opt-in only)
    if (process.env.ALLOW_DESTRUCTIVE_SEED === '1') {
        await prisma.notification.deleteMany();
        await prisma.auditLog.deleteMany();
        await prisma.incident.deleteMany();
        await prisma.nutritionStatus.deleteMany();
        await prisma.session.deleteMany();
        await prisma.child.deleteMany();
        await prisma.device.deleteMany();
        await prisma.parent.deleteMany();
        await prisma.user.deleteMany();
        await prisma.posyandu.deleteMany();
        await prisma.village.deleteMany();
        await prisma.district.deleteMany();
        console.log('Destructive cleanup completed (ALLOW_DESTRUCTIVE_SEED=1).');
    } else {
        console.log('Destructive cleanup skipped (set ALLOW_DESTRUCTIVE_SEED=1 to enable).');
    }

    // 2. Locations (Kabupaten Tangerang Restoration)
    const locations = {
        "Balaraja": ["Cangkudu", "Gembong", "Saga", "Sentul", "Sentul Jaya", "Sukamurni", "Talagasari", "Tobat"],
        "Cikupa": ["Bitung Jaya", "Bojong", "Budi Mulya", "Cibadak", "Cikupa", "Dukuh", "Pasir Gadung", "Pasir Jaya", "Sukadamai", "Sukanagara", "Talaga", "Talagasari"],
        "Cisauk": ["Cibogo", "Dangdang", "Mekar Wangi", "Sampora", "Suradita"],
        "Cisoka": ["Bojong Loa", "Carenang", "Caringin", "Cempaka", "Cibugel", "Cisoka", "Jeungjing", "Karang Harja", "Selapajang", "Sukatani"],
        "Curug": ["Cukanggalih", "Curug Wetan", "Kadu", "Kadu Jaya"],
        "Gunung Kaler": ["Cibetok", "Cipaeh", "Gunung Kaler", "Kandawati", "Kedung", "Onyam", "Rancagede", "Sidoko", "Tamiang"],
        "Jambe": ["Ancol Pasir", "Daru", "Jambe", "Kutruk", "Mekarsari", "Pasir Barat", "Ranca Buaya", "Sukamanah", "Taban"],
        "Pakuhaji": ["Desa Kiara Payung", "Buaran Bambu", "Buaran Mangga", "Bunisari", "Gaga", "Kalibaru", "Kohod", "Kramat", "Laksana", "Paku Alam", "Pakuhaji", "Rawa Boni", "Sukawali", "Surya Bahari"],
        "Jayanti": ["Cikande", "Dangdeur", "Jayanti", "Pabuaran", "Pangkat", "Pasir Gintung", "Pasir Muncang", "Sumur Bandung"],
        "Kelapa Dua": ["Bencongan", "Bencongan Indah", "Bojong Nangka", "Curug Sangereng", "Kelapa Dua", "Pakulonan Barat"],
        "Kemiri": ["Karang Anyar", "Kemiri", "Klebet", "Legok Suka Maju", "Lontar", "Patramanggala", "Ranca Labuh"],
        "Kosambi": ["Belimbing", "Cengklong", "Dadap", "Jatimulya", "Kosambi Barat", "Kosambi Timur", "Rawa Burung", "Rawa Rengas", "Salembaran Jati", "Salembaran Jaya"],
        "Kresek": ["Jengkol", "Kemuning", "Koper", "Kresek", "Pasir Ampo", "Patrasana", "Rancede", "Renged", "Talok"],
        "Kronjo": ["Bakung", "Blukbuk", "Cirumpak", "Kronjo", "Muncung", "Pagedangan Ilir", "Pagenjahan", "Pasilian", "Pasir", "Waliwis"],
        "Legok": ["Babakan", "Babat", "Bojong Kamal", "Caringin", "Ciangir", "Cirarab", "Kamuning", "Legok", "Palasari", "Rancagong", "Serdang Wetan"],
        "Mauk": ["Banyu Asin", "Gunung Sari", "Jatiwaringin", "Kedung Dalem", "Ketapang", "Marga Mulya", "Mauk Barat", "Mauk Timur", "Sasak", "Tegal Kunir Kidul", "Tegal Kunir Lor", "Tanjung Anom"],
        "Mekar Baru": ["Cijeruk", "Gandaria", "Jenggot", "Koda", "Mekar Baru", "Waliwis"],
        "Pagedangan": ["Cicalengka", "Cihuni", "Cijantra", "Jatake", "Kadu Sirung", "Karang Tengah", "Lengkong Kulon", "Malang Nengah", "Medang", "Pagedangan", "Situ Gadung"],
        "Panongan": ["Ciakar", "Mekar Bakti", "Mekar Jaya", "Panongan", "Peusar", "Ranca Iyuh", "Ranca Kalapa", "Serdang Kulon"],
        "Pasar Kemis": ["Gelam Jaya", "Kuta Baru", "Kuta Bumi", "Kuta Jaya", "Pangadegan", "Pasar Kemis", "Sindang Sari", "Suka Asih", "Suka Mantri"],
        "Rajeg": ["Daon", "Jambu Karya", "Lembang Sari", "Mekar Sari", "Pangarengan", "Rajeg", "Rajeg Mulya", "Ranca Bango", "Sukamanah", "Sukasari", "Tanjakan", "Tanjakan Mekar"],
        "Sepatan": ["Karet", "Kayu Agung", "Kayu Bongkok", "Mekar Jaya", "Pisangan Jaya", "Pondok Jaya", "Sarakan", "Sepatan"],
        "Sepatan Timur": ["Gempol Sari", "Jati Mulya", "Kampung Kelor", "Kedaung Barat", "Lebak Wangi", "Pondok Kelor", "Sangiang", "Tanah Merah"],
        "Sindang Jaya": ["Badak Anom", "Sindang Asih", "Sindang Jaya", "Sindang Panon", "Sindang Sono", "Suka Harja", "Wanakerta"],
        "Solear": ["Cikareo", "Cikasungka", "Cikuya", "Munjul", "Pasanggrahan", "Solear"],
        "Sukadiri": ["Buaran Jati", "Gintung", "Karang Serang", "Kosambi", "Mekar Kondang", "Pekayon", "Rawa Kidang", "Sukadiri"],
        "Sukamulya": ["Benda", "Bunar", "Buniayu", "Kaliasin", "Kubang", "Merak", "Parahu", "Sukamulya"],
        "Teluknaga": ["Babakan Asem", "Bojong Renged", "Kampung Besar", "Kampung Melayu Barat", "Kampung Melayu Timur", "Kebon Cau", "Lemo", "Muara", "Pangkalan", "Tanjung Burung", "Tanjung Pasir", "Tegal Angus", "Teluknaga"],
        "Tigaraksa": ["Bantar Panjang", "Cileles", "Cisereh", "Kadu Agung", "Margasari", "Matagara", "Pasir Bolang", "Pasir Nangka", "Pematang", "Petro", "Sodong", "Tapos", "Tigaraksa"]
    };

    let districtPakuhajiId = null;
    let posyanduId = null;

    for (const [districtName, villages] of Object.entries(locations)) {
        const district = await prisma.district.upsert({
            where: { code: districtName.substring(0, 3).toUpperCase() },
            update: {},
            create: {
                name: districtName,
                code: districtName.substring(0, 3).toUpperCase(),
            },
        });

        if (districtName === 'Pakuhaji') {
            districtPakuhajiId = district.id;
        }

        for (const [index, villageName] of villages.entries()) {
            const village = await prisma.village.upsert({
                where: { code: `${district.code}-V${index}` },
                update: {},
                create: {
                    name: villageName,
                    code: `${district.code}-V${index}`,
                    districtId: district.id,
                },
            });

            // Create at least one Posyandu per village
            const p = await prisma.posyandu.upsert({
                where: { id: (district.id * 100) + index }, // Simple deterministic ID generation attempt, or let DB handle it if we remove ID.
                // Actually, let's just findFirst or create.
                update: {},
                create: {
                    name: `Posyandu ${villageName}`,
                    address: `Jl. ${villageName} No. 1`,
                    villageId: village.id,
                },
            });

            if (villageName === 'Desa Kiara Payung') {
                posyanduId = p.id;
            }
        }
    }

    // 3. Users

    // IT Admin
    const admin = await prisma.user.upsert({
        where: { email: 'dudu.innovillage@gmail.com' },
        update: {
            role: 'ADMIN',
            fullName: 'Madungdung',
            status: 'ACTIVE'
        },
        create: {
            fullName: 'Madungdung',
            email: 'dudu.innovillage@gmail.com',
            role: 'ADMIN',
            status: 'ACTIVE',
        },
    });
    console.log('Created Admin: Madungdung');

    // Puskesmas User (Pakuhaji)
    await prisma.user.upsert({
        where: { email: 'izza.diasputra10@gmail.com' },
        update: {
            role: 'PUSKESMAS',
            fullName: 'Favian',
            status: 'ACTIVE',
            districtId: districtPakuhajiId
        },
        create: {
            fullName: 'Favian',
            email: 'izza.diasputra10@gmail.com',
            role: 'PUSKESMAS',
            districtId: districtPakuhajiId,
            status: 'ACTIVE',
        },
    });
    console.log('Created Puskesmas: Favian');

    // Posyandu User (Buaran Mangga)
    const buaranMangga = await prisma.village.findFirst({
        where: { name: 'Buaran Mangga' }
    });

    if (buaranMangga) {
        // Create User
        await prisma.user.upsert({
            where: { email: 'favbalhan@gmail.com' },
            update: {
                role: 'POSYANDU',
                fullName: 'Abir Nurchiyah',
                status: 'ACTIVE',
                villageId: buaranMangga.id
            },
            create: {
                fullName: 'Abir Nurchiyah',
                email: 'favbalhan@gmail.com',
                role: 'POSYANDU',
                villageId: buaranMangga.id,
                status: 'ACTIVE',
            },
        });
        console.log('Created Posyandu User: Abir Nurchiyah');

        // Create Devices for Buaran Mangga
        // Find the Posyandu entity first
        const posyanduBuaran = await prisma.posyandu.findFirst({
            where: { villageId: buaranMangga.id }
        });

        if (posyanduBuaran) {
            for (let i = 1; i <= 5; i++) {
                const deviceName = `Burma ${i.toString().padStart(2, '0')}`;
                const deviceUuid = `BURMA-${i.toString().padStart(3, '0')}`;

                await prisma.device.upsert({
                    where: { deviceUuid: deviceUuid },
                    update: {
                        posyanduId: posyanduBuaran.id
                    },
                    create: {
                        deviceUuid: deviceUuid,
                        name: deviceName,
                        posyanduId: posyanduBuaran.id,
                        status: 'AVAILABLE',
                    },
                });
            }
            console.log('Created 5 Burma devices for Posyandu Buaran Mangga');
        } else {
            console.warn('Posyandu Buaran Mangga not found, skipping devices.');
        }
    } else {
        console.warn('Village Buaran Mangga not found!');
    }

    // 4. Devices (Linked to the generated posyanduId for Pakuhaji/Kiara Payung if avail, else just first one)
    if (!posyanduId) {
        // Fallback if not found logic (should be found)
        const anyPosyandu = await prisma.posyandu.findFirst();
        posyanduId = anyPosyandu.id;
    }

    const devices = [];
    for (let i = 1; i <= 5; i++) {
        const device = await prisma.device.upsert({
            where: { deviceUuid: `DEV-${i.toString().padStart(3, '0')}` },
            update: {},
            create: {
                deviceUuid: `DEV-${i.toString().padStart(3, '0')}`,
                name: `Dudu Scale ${i}`,
                posyanduId: posyanduId,
                status: 'INACTIVE',
            },
        });
        devices.push(device);
    }

    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
