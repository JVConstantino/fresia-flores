"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminUserController = void 0;
const client_1 = require("@/prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
exports.adminUserController = {
    async create(req, res, next) {
        try {
            const { name, email, password, phone, role } = req.body;
            if (!name || !email || !password) {
                return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
            }
            if (String(password).length < 6) {
                return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres' });
            }
            const existing = await client_1.prisma.user.findUnique({ where: { email } });
            if (existing)
                return res.status(409).json({ error: 'Email já cadastrado' });
            const passwordHash = await bcryptjs_1.default.hash(password, 10);
            const user = await client_1.prisma.user.create({
                data: {
                    name,
                    email,
                    passwordHash,
                    phone: phone || null,
                    isAdmin: role === 'admin',
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    isAdmin: true,
                    isSuspended: true,
                    createdAt: true,
                },
            });
            res.status(201).json(user);
        }
        catch (err) {
            next(err);
        }
    },
    async list(req, res, next) {
        try {
            const { search, status, page = '1', limit = '20' } = req.query;
            const where = {};
            if (search) {
                where.OR = [
                    { name: { contains: search } },
                    { email: { contains: search } }
                ];
            }
            if (status === 'suspended')
                where.isSuspended = true;
            else if (status === 'active')
                where.isSuspended = false;
            const pageNum = Math.max(1, parseInt(page));
            const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
            const skip = (pageNum - 1) * limitNum;
            const [users, total] = await Promise.all([
                client_1.prisma.user.findMany({
                    where,
                    skip,
                    take: limitNum,
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        isAdmin: true,
                        isSuspended: true,
                        avatarUrl: true,
                        createdAt: true,
                        _count: { select: { orders: true } },
                        orders: { select: { total: true } }
                    }
                }),
                client_1.prisma.user.count({ where })
            ]);
            const data = users.map(u => ({
                id: u.id,
                name: u.name,
                email: u.email,
                phone: u.phone,
                isAdmin: u.isAdmin,
                isSuspended: u.isSuspended,
                avatarUrl: u.avatarUrl,
                createdAt: u.createdAt,
                orderCount: u._count.orders,
                totalSpent: u.orders.reduce((sum, o) => sum + Number(o.total), 0)
            }));
            res.json({ data, pagination: { total, page: pageNum, limit: limitNum } });
        }
        catch (err) {
            next(err);
        }
    },
    async getById(req, res, next) {
        try {
            const id = Number(req.params.id);
            const user = await client_1.prisma.user.findUnique({
                where: { id },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    isAdmin: true,
                    isSuspended: true,
                    mustChangePassword: true,
                    avatarUrl: true,
                    createdAt: true,
                    addresses: true,
                    paymentCards: {
                        select: {
                            id: true, brand: true, lastFour: true, nickname: true, isDefault: true, createdAt: true
                        }
                    },
                    orders: {
                        orderBy: { createdAt: 'desc' },
                        take: 20,
                        select: {
                            id: true, status: true, total: true, createdAt: true,
                            items: { select: { qty: true, price: true, product: { select: { name: true } } } }
                        }
                    }
                }
            });
            if (!user)
                return res.status(404).json({ error: 'Usuário não encontrado' });
            res.json(user);
        }
        catch (err) {
            next(err);
        }
    },
    async update(req, res, next) {
        try {
            const id = Number(req.params.id);
            const { name, phone } = req.body;
            const user = await client_1.prisma.user.update({
                where: { id },
                data: { name, phone },
                select: { id: true, name: true, email: true, phone: true }
            });
            res.json(user);
        }
        catch (err) {
            next(err);
        }
    },
    async suspend(req, res, next) {
        try {
            const id = Number(req.params.id);
            const { isSuspended } = req.body;
            await client_1.prisma.user.update({ where: { id }, data: { isSuspended } });
            res.json({ message: isSuspended ? 'Usuário suspenso' : 'Usuário reativado' });
        }
        catch (err) {
            next(err);
        }
    },
    async resetPassword(req, res, next) {
        try {
            const id = Number(req.params.id);
            const user = await client_1.prisma.user.findUnique({ where: { id }, select: { email: true, name: true } });
            if (!user)
                return res.status(404).json({ error: 'Usuário não encontrado' });
            // TODO: gerar token real, salvar no banco/cache com expiração e enviar email
            // Por enquanto, simula o envio
            console.log(`[PENDENTE] Enviar email de reset para: ${user.email}`);
            res.json({ message: `Email de reset enviado para ${user.email}` });
        }
        catch (err) {
            next(err);
        }
    },
    async setTempPassword(req, res, next) {
        try {
            const id = Number(req.params.id);
            const { tempPassword } = req.body;
            if (!tempPassword || tempPassword.length < 6) {
                return res.status(400).json({ error: 'Senha temporária deve ter pelo menos 6 caracteres' });
            }
            const passwordHash = await bcryptjs_1.default.hash(tempPassword, 10);
            await client_1.prisma.user.update({
                where: { id },
                data: { passwordHash, mustChangePassword: true }
            });
            res.json({ message: 'Senha temporária definida. Usuário deverá alterar no próximo login.' });
        }
        catch (err) {
            next(err);
        }
    }
};
//# sourceMappingURL=adminUserController.js.map