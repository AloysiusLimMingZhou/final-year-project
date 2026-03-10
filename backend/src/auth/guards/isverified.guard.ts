import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class IsVerifiedGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        // Safety check: ensure the user object actually exists on the request
        if (!user) {
            throw new ForbiddenException('User context not found. Ensure JwtAuthGuard runs first.');
        }

        // The actual verification check
        if (!user.isverified) {
            throw new ForbiddenException('Please verify your email address to access this resource.');
        }

        return true;
    }
}