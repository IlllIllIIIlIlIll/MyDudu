import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
    private readonly algorithm = 'aes-256-gcm';
    private readonly key: Buffer;

    constructor() {
        const keyString = process.env.ENCRYPTION_KEY;
        if (!keyString) {
            console.warn('⚠️ ENCRYPTION_KEY not set. Using fallback key (NOT SECURE FOR PRODUCTION)');
            this.key = crypto.createHash('sha256').update('fallback-secret-key').digest();
        } else {
            this.key = Buffer.from(keyString, 'hex');
        }
    }

    encrypt(text: string): string {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

        const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
        const authTag = cipher.getAuthTag();

        return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
    }

    decrypt(encryptedData: string): string {
        const [ivHex, authTagHex, encryptedHex] = encryptedData.split(':');

        if (!ivHex || !authTagHex || !encryptedHex) {
            throw new Error('Invalid encrypted data format');
        }

        const decipher = crypto.createDecipheriv(
            this.algorithm,
            this.key,
            Buffer.from(ivHex, 'hex')
        );

        decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

        const decrypted = Buffer.concat([
            decipher.update(Buffer.from(encryptedHex, 'hex')),
            decipher.final()
        ]);

        return decrypted.toString('utf8');
    }
}
