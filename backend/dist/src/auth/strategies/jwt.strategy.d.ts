import { AuthService } from '@/auth/auth.service';
declare const JwtStrategy_base: any;
export declare class JwtStrategy extends JwtStrategy_base {
    private authService;
    constructor(authService: AuthService);
    validate(payload: {
        sub: string;
        email: string;
        username: string;
    }): Promise<any>;
}
export {};
