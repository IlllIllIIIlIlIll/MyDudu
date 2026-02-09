import { Module, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

@Module({
    exports: ['FIREBASE_ADMIN'],
    providers: [
      {
        provide: 'FIREBASE_ADMIN',
        useFactory: () => {
          if (admin.apps.length === 0) {
            const serviceAccountPath =
              process.env.FIREBASE_CREDENTIALS_PATH ||
              path.join(process.cwd(), 'service-account.json');
  
            try {
              let serviceAccount;
  
              // Production (Render)
              if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
                const buffer = Buffer.from(
                  process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
                  'base64'
                );
                serviceAccount = JSON.parse(buffer.toString('utf-8'));
              }
              // Local dev fallback
              else if (fs.existsSync(serviceAccountPath)) {
                serviceAccount = JSON.parse(
                  fs.readFileSync(serviceAccountPath, 'utf8')
                );
              }
  
              if (!serviceAccount) {
                if (process.env.NODE_ENV === 'production') {
                  throw new Error(
                    'FIREBASE_SERVICE_ACCOUNT_BASE64 missing. Firebase Admin cannot initialize.'
                  );
                } else {
                  console.warn(
                    'Firebase Admin running WITHOUT credentials (DEV ONLY)'
                  );
                  return admin;
                }
              }
  
              admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                projectId: serviceAccount.project_id,
              });

              // Debug: confirm backend project (must match frontend firebaseConfig.projectId)
              console.log('FIREBASE ADMIN PROJECT:', serviceAccount.project_id);
            } catch (error) {
              console.error('Firebase Admin initialization FAILED:', error);
              throw error;
            }
          }
  
          return admin;
        },
      },
    ],
  })
  export class FirebaseAdminModule {}
  