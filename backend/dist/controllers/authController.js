"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = void 0;
const authService_1 = require("../services/authService");
exports.authController = {
    async register(req, res, next) {
        try {
            const { name, email, password, phone } = req.body;
            const { user, token } = await authService_1.authService.register(name, email, password, phone);
            res.cookie('token', token, (0, authService_1.cookieOptions)());
            res.status(201).json(user);
        }
        catch (err) {
            next(err);
        }
    },
    async login(req, res, next) {
        try {
            const { email, password } = req.body;
            const { user, token } = await authService_1.authService.login(email, password);
            res.cookie('token', token, (0, authService_1.cookieOptions)());
            res.json(user);
        }
        catch (err) {
            next(err);
        }
    },
    logout(_req, res) {
        res.clearCookie('token');
        res.json({ message: 'ok' });
    },
    async me(req, res, next) {
        try {
            const user = await authService_1.authService.me(req.user.id);
            res.json(user);
        }
        catch (err) {
            next(err);
        }
    },
    async updateProfile(req, res, next) {
        try {
            const userId = req.user.id;
            const { name, phone } = req.body;
            if (!name || typeof name !== 'string') {
                return res.status(400).json({ error: 'Nome é obrigatório' });
            }
            const user = await authService_1.authService.updateProfile(userId, { name, phone });
            res.json(user);
        }
        catch (err) {
            next(err);
        }
    },
    async updatePassword(req, res, next) {
        try {
            const userId = req.user.id;
            const { currentPassword, newPassword } = req.body;
            if (!currentPassword || !newPassword) {
                return res.status(400).json({ error: 'Senhas são obrigatórias' });
            }
            if (newPassword.length < 6) {
                return res.status(400).json({ error: 'Nova senha deve ter pelo menos 6 caracteres' });
            }
            await authService_1.authService.updatePassword(userId, currentPassword, newPassword);
            res.json({ message: 'Senha atualizada com sucesso' });
        }
        catch (err) {
            next(err);
        }
    },
};
//# sourceMappingURL=authController.js.map