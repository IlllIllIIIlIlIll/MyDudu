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
                // Only initialize if not already initialized
                if (admin.apps.length === 0) {
                    // Check for GOOGLE_APPLICATION_CREDENTIALS or use explicit path
                    const serviceAccountPath = process.env.FIREBASE_CREDENTIALS_PATH || path.join(process.cwd(), 'service-account.json');

                    try {
                        let serviceAccount;

                        // Priority 1: Base64 Env Var (Render/Production)
                        if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
                            const buffer = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64');
                            serviceAccount = JSON.parse(buffer.toString('utf-8'));
                        }
                        // Priority 2: File Path (Local Dev)
                        else if (fs.existsSync(serviceAccountPath)) {
                            serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
                        }

                        if (serviceAccount) {
                            admin.initializeApp({
                                credential: admin.credential.cert(serviceAccount),
                            });
                            console.log('Firebase Admin Initialized successfully');
                        } else {
                            console.warn(`Service account not found. Checked env var FIREBASE_SERVICE_ACCOUNT_BASE64 and path: ${serviceAccountPath}`);
                            if (process.env.NODE_ENV !== 'production') {
                                console.warn('Running in dev mode without valid credentials.');
                            }
                        }
                    } catch (error) {
                        console.warn('Failed to initialize Firebase Admin. Auth features may not work.', error.message);
                    }
                }
                return admin;
            },
        },
    ],
})
export class FirebaseAdminModule { }
