import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        @Inject('FIREBASE_ADMIN') private readonly firebaseAdmin: typeof admin,
        private readonly prisma: PrismaService,
    ) { }

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

            // Attach the Firebase decoded token first
            request['user'] = decodedToken;

            // Look up the DB user to get the numeric id and villageId,
            // which are required by controllers that use req.user?.id
            if (decodedToken.email) {
                const dbUser = await this.prisma.user.findFirst({
                    where: { email: decodedToken.email },
                    select: { id: true, villageId: true, role: true },
                });
                if (dbUser) {
                    // Merge DB fields into the user object so req.user.id works everywhere
                    request['user'].id = dbUser.id;
                    request['user'].villageId = dbUser.villageId;
                    request['user'].dbRole = dbUser.role;
                }
            }
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
