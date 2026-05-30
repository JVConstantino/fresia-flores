export interface AuthUser {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    isAdmin: boolean;
}
export declare function cookieOptions(): {
    httpOnly: boolean;
    sameSite: "lax";
    secure: boolean;
    maxAge: number;
};
export declare const authService: {
    register(name: string, email: string, password: string, phone?: string): Promise<{
        user: AuthUser;
        token: string;
    }>;
    login(email: string, password: string): Promise<{
        user: AuthUser;
        token: string;
    }>;
    me(userId: number): Promise<AuthUser>;
    updateProfile(userId: number, data: {
        name: string;
        phone?: string;
    }): Promise<AuthUser>;
    updatePassword(userId: number, currentPassword: string, newPassword: string): Promise<void>;
};
//# sourceMappingURL=authService.d.ts.map