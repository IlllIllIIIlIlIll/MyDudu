import { Controller, Post, Headers, UnauthorizedException } from '@nestjs/common';
import { AuthService } from 'src/auth/auth.service';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('sync')
    async syncUser(@Headers('authorization') authorization: string) {
        if (!authorization) throw new UnauthorizedException('No token provided');

        // Authorization: Bearer <token>
        const token = authorization.split(' ')[1];
        return this.authService.syncUser(token);
    }
}
