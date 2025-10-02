import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@/prisma/prisma.service';
import { RegisterDto, LoginDto } from '@/auth/dto';
export declare class AuthService {
    private prisma;
    private jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    register(registerDto: RegisterDto): Promise<{
        id: any;
        email: any;
        username: any;
    }>;
    login(loginDto: LoginDto): Promise<{
        accessToken: any;
    }>;
    validateToken(userId: string): Promise<any>;
}
