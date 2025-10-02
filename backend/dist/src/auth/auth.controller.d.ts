import { AuthService } from '@/auth/auth.service';
import { RegisterDto, LoginDto } from '@/auth/dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(registerDto: RegisterDto): Promise<{
        id: any;
        email: any;
        username: any;
    }>;
    login(loginDto: LoginDto): Promise<{
        accessToken: any;
    }>;
    getProfile(req: {
        user: unknown;
    }): unknown;
}
