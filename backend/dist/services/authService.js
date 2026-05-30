"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = void 0;
exports.cookieOptions = cookieOptions;
const client_1 = require("@/prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET;
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
function signToken(userId, isAdmin) {
    return jsonwebtoken_1.default.sign({ id: userId, isAdmin }, JWT_SECRET, { expiresIn: '7d' });
}
function cookieOptions() {
    return {
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        maxAge: COOKIE_MAX_AGE,
    };
}
exports.authService = {
    async register(name, email, password, phone) {
        const existing = await client_1.prisma.user.findUnique({ where: { email } });
        if (existing) {
            throw Object.assign(new Error('Email já está em uso'), { statusCode: 409 });
        }
        const passwordHash = await bcryptjs_1.default.hash(password, 12);
        const user = await client_1.prisma.user.create({
            data: { name, email, passwordHash, phone: phone ?? null },
            select: { id: true, name: true, email: true, phone: true, isAdmin: true },
        });
        return { user, token: signToken(user.id, user.isAdmin) };
    },
    async login(email, password) {
        const user = await client_1.prisma.user.findUnique({ where: { email } });
        if (!user) {
            throw Object.assign(new Error('Credenciais inválidas'), { statusCode: 401 });
        }
        const valid = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!valid) {
            throw Object.assign(new Error('Credenciais inválidas'), { statusCode: 401 });
        }
        return {
            user: { id: user.id, name: user.name, email: user.email, phone: user.phone, isAdmin: user.isAdmin },
            token: signToken(user.id, user.isAdmin),
        };
    },
    async me(userId) {
        const user = await client_1.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, email: true, phone: true, isAdmin: true },
        });
        if (!user) {
            throw Object.assign(new Error('Usuário não encontrado'), { statusCode: 404 });
        }
        return user;
    },
    async updateProfile(userId, data) {
        const user = await client_1.prisma.user.update({
            where: { id: userId },
            data: { name: data.name, phone: data.phone ?? null },
            select: { id: true, name: true, email: true, phone: true, isAdmin: true },
        });
        return user;
    },
    async updatePassword(userId, currentPassword, newPassword) {
        const user = await client_1.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw Object.assign(new Error('Usuário não encontrado'), { statusCode: 404 });
        const valid = await bcryptjs_1.default.compare(currentPassword, user.passwordHash);
        if (!valid)
            throw Object.assign(new Error('Senha atual incorreta'), { statusCode: 400 });
        const passwordHash = await bcryptjs_1.default.hash(newPassword, 12);
        await client_1.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    },
};
//# sourceMappingURL=authService.js.map