const { PrismaClient } = require('./node_modules/@prisma/client');
const { NestFactory } = require('./node_modules/@nestjs/core');
const { AppModule } = require('./dist/app.module');

async function main() {
    console.log("Starting Nest context...");
    const app = await NestFactory.createApplicationContext(AppModule);
    const deviceService = app.get('DeviceService');

    try {
        console.log("Invoking manual entry...");
        const result = await deviceService.processManualEntry({
            parentId: 1,
            childId: 1,
            deviceId: 1,
            motherName: "Test",
            childName: "Test",
            weight: 12.5,
            height: 90.0,
            temperature: 36.5,
            heartRate: 90,
            noiseLevel: 45
        }, 1);
        console.log("Success:", result);
    } catch (e) {
        console.error("Caught expected error:");
        console.error(e);
    } finally {
        await app.close();
    }
}

main().catch(console.error);
