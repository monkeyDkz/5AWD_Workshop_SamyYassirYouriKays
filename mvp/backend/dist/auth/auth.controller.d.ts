import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
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
}
