import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthService {
    private readonly prisma;
    private readonly jwtService;
    private readonly configService;
    constructor(prisma: PrismaService, jwtService: JwtService, configService: ConfigService);
    register(dto: RegisterDto): Promise<{
        user: {
            username: string;
            avatar: string | null;
            id: string;
            email: string;
            createdAt: Date;
            updatedAt: Date;
        };
        access_token: string;
    }>;
    login(dto: LoginDto): Promise<{
        user: {
            username: string;
            avatar: string | null;
            id: string;
            email: string;
            createdAt: Date;
            updatedAt: Date;
        };
        access_token: string;
    }>;
    validateUser(userId: string): Promise<{
        username: string;
        avatar: string | null;
        id: string;
        email: string;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    generateToken(user: {
        id: string;
        username: string;
    }): {
        access_token: string;
    };
}
