import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(@Inject('FIREBASE_ADMIN') private readonly firebaseAdmin: typeof admin) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const token = this.extractTokenFromHeader(request);

        if (!token) {
            throw new UnauthorizedException('No token provided');
        }

        try {
            const decodedToken = await this.firebaseAdmin.auth().verifyIdToken(token);

            // Temporary restriction: Only allow @gmail.com
            if (!decodedToken.email?.endsWith('@gmail.com')) {
                throw new UnauthorizedException('Only @gmail.com accounts are allowed at this time');
            }

            request['user'] = decodedToken;
        } catch (error) {
            console.error('Token verification failed:', error);
            throw new UnauthorizedException(error.message || 'Invalid token');
        }
        return true;
    }

    private extractTokenFromHeader(request: any): string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }
}
