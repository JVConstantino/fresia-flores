"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.avatarController = void 0;
const client_1 = require("@/prisma/client");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
exports.avatarController = {
    async upload(req, res, next) {
        try {
            const userId = req.user.id;
            const file = req.file;
            if (!file) {
                return res.status(400).json({ error: 'Arquivo não fornecido' });
            }
            // Validate file is an image
            const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
            if (!allowedMimes.includes(file.mimetype)) {
                fs_1.default.unlinkSync(file.path);
                return res.status(400).json({ error: 'Apenas imagens (JPEG, PNG, WebP) são permitidas' });
            }
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                fs_1.default.unlinkSync(file.path);
                return res.status(400).json({ error: 'Arquivo muito grande (máx 5MB)' });
            }
            // Get current user to delete old avatar if exists
            const currentUser = await client_1.prisma.user.findUnique({ where: { id: userId } });
            if (currentUser?.avatarUrl) {
                const oldPath = path_1.default.join(process.cwd(), 'public', currentUser.avatarUrl.replace('/public/', ''));
                try {
                    fs_1.default.unlinkSync(oldPath);
                }
                catch (err) {
                    // Ignore if file doesn't exist
                }
            }
            // Generate filename: userId_timestamp_originalname
            const filename = `${userId}_${Date.now()}_${file.originalname}`;
            const relativePath = `/uploads/${filename}`;
            // Rename temp file to final location
            const finalPath = path_1.default.join(process.cwd(), 'public', 'uploads', filename);
            fs_1.default.renameSync(file.path, finalPath);
            // Update user in database
            const user = await client_1.prisma.user.update({
                where: { id: userId },
                data: { avatarUrl: relativePath },
                select: { id: true, name: true, email: true, avatarUrl: true, phone: true, isAdmin: true }
            });
            res.json(user);
        }
        catch (err) {
            next(err);
        }
    }
};
//# sourceMappingURL=avatarController.js.map