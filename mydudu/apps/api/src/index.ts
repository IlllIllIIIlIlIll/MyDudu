// apps/api/src/index.ts
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import express from 'express';
import * as functions from 'firebase-functions';

// 1. Buat instance Express server secara manual
const server = express();

// 2. Fungsi untuk inisialisasi NestJS (hanya sekali)
const createNestServer = async (expressInstance: express.Express) => {
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressInstance),
  );
  
  // Setup CORS agar bisa diakses Frontend
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Global Prefix (Opsional, agar URL jadi /api/v1/...)
  // app.setGlobalPrefix('api'); 

  await app.init();
};

// 3. Export function "api" yang akan dikenali Firebase
// Menggunakan onRequest dari firebase-functions
export const api = functions.https.onRequest(async (request, response) => {
  // Init NestJS jika belum siap
  await createNestServer(server);
  // Teruskan request/response dari Firebase ke server Express/NestJS
  server(request, response);
});