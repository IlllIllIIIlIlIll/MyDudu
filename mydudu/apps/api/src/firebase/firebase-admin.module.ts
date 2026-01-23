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
                        if (fs.existsSync(serviceAccountPath)) {
                            const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
                            admin.initializeApp({
                                credential: admin.credential.cert(serviceAccount),
                            });
                            console.log('Firebase Admin Initialized successfully');
                        } else {
                            console.warn(`Service account file not found at: ${serviceAccountPath}`);
                            // Fallback for development if file missing, allows app to start but auth fails
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
