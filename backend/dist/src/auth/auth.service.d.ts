import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@/prisma/prisma.service';
export interface RegisterDto {
    email: string;
    username: string;
    password: string;
}
export interface LoginDto {
    email: string;
    password: string;
}
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
