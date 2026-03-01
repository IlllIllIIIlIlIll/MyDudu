import { Controller, Post, Headers, UnauthorizedException, Body } from '@nestjs/common';
import { AuthService } from 'src/auth/auth.service';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('sync')
    async syncUser(@Headers('authorization') authorization: string) {
        if (!authorization) {
            throw new UnauthorizedException('No token provided');
        }

        const [type, token] = authorization.split(' ');

        if (type !== 'Bearer' || !token) {
            throw new UnauthorizedException('Invalid authorization header format');
        }

        // Debug: normal Firebase ID token is ~1200 chars; if < 100, token is broken
        console.log('TOKEN LENGTH:', token?.length ?? 0);

        return this.authService.syncUser(token);
    }
    @Post('verify-nik')
    async verifyNik(@Body('credentials') credentials: string) {
        if (!credentials || credentials.length !== 24) {
            throw new UnauthorizedException('Format kredensial tidak valid (harus 24 karakter)');
        }

        const nik = credentials.substring(0, 16);
        const dobRaw = credentials.substring(16, 24);

        // DDMMYYYY -> YYYY-MM-DD
        const birthDateStr = `${dobRaw.substring(4, 8)}-${dobRaw.substring(2, 4)}-${dobRaw.substring(0, 2)}`;

        return this.authService.verifyNik(nik, new Date(birthDateStr));
    }
}
