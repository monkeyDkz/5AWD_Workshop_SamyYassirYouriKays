import { ConfigService } from '@nestjs/config';
import { Strategy } from 'passport-jwt';
import { AuthService } from './auth.service';
export interface JwtPayload {
    sub: string;
    username: string;
    iat?: number;
    exp?: number;
}
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly authService;
    constructor(authService: AuthService, configService: ConfigService);
    validate(payload: JwtPayload): Promise<{
        username: string;
        avatar: string | null;
        id: string;
        email: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
export {};
