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

        return this.authService.syncUser(token);
    }
    @Post('verify-phone')
    async verifyPhone(@Body('phoneNumber') phoneNumber: string) {
        if (!phoneNumber) {
            throw new UnauthorizedException('Phone number is required');
        }
        return this.authService.verifyPhone(phoneNumber);
    }
}
