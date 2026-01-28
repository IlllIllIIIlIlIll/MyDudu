import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

// Trigger rebuild 1
async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    // Enable CORS
    app.enableCors({
        origin: true,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
    });
    // Patch BigInt serialization
    (BigInt.prototype as any).toJSON = function () {
        return this.toString();
    };

    await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
    console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
