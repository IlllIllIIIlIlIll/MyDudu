import 'dotenv/config';
import { PrismaClient, UserRole, UserStatus, DeviceStatus, ExamOutcome, SessionStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding pemeriksaan dummy data (non-destructive)...');

  const district = await prisma.district.upsert({
    where: { code: 'DUM' },
    update: {},
    create: { name: 'Dummy District', code: 'DUM' },
  });

  const village = await prisma.village.upsert({
    where: { code: 'DUM-V1' },
    update: {},
    create: { districtId: district.id, name: 'Dummy Village', code: 'DUM-V1' },
  });

  const posyandu = await prisma.posyandu.upsert({
    where: { id: 99001 },
    update: {},
    create: {
      id: 99001,
      villageId: village.id,
      name: 'Posyandu Dummy Pemeriksaan',
      address: 'Jl. Dummy No. 1',
    },
  });

  const operator = await prisma.user.upsert({
    where: { email: 'operator.pemeriksaan.dummy@mydudu.local' },
    update: { role: UserRole.POSYANDU, status: UserStatus.ACTIVE, villageId: village.id },
    create: {
      fullName: 'Operator Pemeriksaan Dummy',
      email: 'operator.pemeriksaan.dummy@mydudu.local',
      phoneNumber: '089900000001',
      role: UserRole.POSYANDU,
      status: UserStatus.ACTIVE,
      villageId: village.id,
    },
  });

  const parentUser = await prisma.user.upsert({
    where: { email: 'orangtua.pemeriksaan.dummy@mydudu.local' },
    update: { role: UserRole.PARENT, status: UserStatus.ACTIVE, villageId: village.id },
    create: {
      fullName: 'Ibu Sesi Dummy',
      email: 'orangtua.pemeriksaan.dummy@mydudu.local',
      phoneNumber: '089900000002',
      role: UserRole.PARENT,
      status: UserStatus.ACTIVE,
      villageId: village.id,
    },
  });

  const parent = await prisma.parent.upsert({
    where: { parentId: parentUser.id },
    update: { villageId: village.id },
    create: {
      parentId: parentUser.id,
      villageId: village.id,
    },
  });

  const child = await prisma.child.upsert({
    where: { id: 99001 },
    update: { parentId: parent.id },
    create: {
      id: 99001,
      parentId: parent.id,
      fullName: 'Anak Dummy Satu',
      birthDate: new Date('2024-06-15'),
      gender: 'M',
      bloodType: 'O',
    },
  });

  const device = await prisma.device.upsert({
    where: { deviceUuid: 'DUMMY-PEMERIKSAAN-001' },
    update: { name: 'Dummy Device Pemeriksaan', posyanduId: posyandu.id, status: DeviceStatus.AVAILABLE },
    create: {
      deviceUuid: 'DUMMY-PEMERIKSAAN-001',
      name: 'Dummy Device Pemeriksaan',
      posyanduId: posyandu.id,
      status: DeviceStatus.AVAILABLE,
    },
  });

  await prisma.session.upsert({
    where: { sessionUuid: 'dummy-pemeriksaan-pending-001' },
    update: {
      childId: child.id,
      deviceId: device.id,
      operatorId: operator.id,
      recordedAt: new Date(Date.now() - 15 * 60 * 1000),
      status: SessionStatus.IN_PROGRESS,
      examOutcome: ExamOutcome.PENDING,
      diagnosisCode: null,
      diagnosisText: null,
      weight: 12.5,
      height: 88.2,
      temperature: 36.9,
      heartRate: 102,
      measurementCompleted: true,
      measurementCompletedAt: new Date(Date.now() - 15 * 60 * 1000),
    },
    create: {
      sessionUuid: 'dummy-pemeriksaan-pending-001',
      childId: child.id,
      deviceId: device.id,
      operatorId: operator.id,
      recordedAt: new Date(Date.now() - 15 * 60 * 1000),
      status: SessionStatus.IN_PROGRESS,
      examOutcome: ExamOutcome.PENDING,
      weight: 12.5,
      height: 88.2,
      temperature: 36.9,
      heartRate: 102,
      measurementCompleted: true,
      measurementCompletedAt: new Date(Date.now() - 15 * 60 * 1000),
    },
  });

  const budiUsers = await prisma.user.count({
    where: { fullName: { contains: 'Budi', mode: 'insensitive' } },
  });

  console.log(`Seed complete. Budi-like user count in DB: ${budiUsers}`);
  if (budiUsers > 0) {
    console.warn('Warning: Found user rows containing "Budi". This script does not delete existing data.');
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
