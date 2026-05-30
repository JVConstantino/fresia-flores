"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminMediaController = void 0;
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const client_1 = require("@/prisma/client");
const router = (0, express_1.Router)();
const UPLOAD_DIR = path_1.default.resolve(process.cwd(), 'public', 'uploads');
if (!fs_1.default.existsSync(UPLOAD_DIR))
    fs_1.default.mkdirSync(UPLOAD_DIR, { recursive: true });
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => {
        const base = path_1.default.parse(file.originalname).name.replace(/[^a-z0-9_-]/gi, '_');
        const ext = path_1.default.extname(file.originalname);
        cb(null, `${base}-${Date.now()}${ext}`);
    },
});
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith('image/'))
            cb(null, true);
        else
            cb(new Error('Apenas imagens são permitidas'));
    },
});
// GET /admin/media — lista paginada
router.get('/', async (req, res, next) => {
    try {
        const page = parseInt(req.query.page || '1');
        const pageSize = Math.min(100, parseInt(req.query.pageSize || '50'));
        const search = req.query.search || '';
        const where = search ? { filename: { contains: search } } : {};
        const [items, total] = await Promise.all([
            client_1.prisma.media.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
            client_1.prisma.media.count({ where }),
        ]);
        res.json({ items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
    }
    catch (err) {
        next(err);
    }
});
// POST /admin/media — upload com registro no DB
router.post('/', upload.single('file'), async (req, res, next) => {
    try {
        if (!req.file)
            return res.status(400).json({ error: 'Arquivo não enviado' });
        const media = await client_1.prisma.media.create({
            data: {
                url: `/uploads/${req.file.filename}`,
                filename: req.file.filename,
                mimeType: req.file.mimetype,
                size: req.file.size,
                alt: req.body.alt || null,
            },
        });
        res.status(201).json(media);
    }
    catch (err) {
        next(err);
    }
});
// DELETE /admin/media/:id
router.delete('/:id', async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        const media = await client_1.prisma.media.findUnique({ where: { id } });
        if (!media)
            return res.status(404).json({ error: 'Mídia não encontrada' });
        const filePath = path_1.default.resolve(process.cwd(), 'public', media.url.replace(/^\//, ''));
        try {
            if (fs_1.default.existsSync(filePath))
                fs_1.default.unlinkSync(filePath);
        }
        catch { /* segue mesmo se falhar */ }
        await client_1.prisma.media.delete({ where: { id } });
        res.json({ message: 'Mídia removida' });
    }
    catch (err) {
        next(err);
    }
});
// POST /admin/media/sync — popular tabela com arquivos existentes em /uploads
router.post('/sync', async (_req, res, next) => {
    try {
        const files = fs_1.default.readdirSync(UPLOAD_DIR).filter(f => !f.startsWith('.'));
        let added = 0;
        for (const filename of files) {
            const exists = await client_1.prisma.media.findFirst({ where: { filename } });
            if (exists)
                continue;
            const filePath = path_1.default.join(UPLOAD_DIR, filename);
            const stat = fs_1.default.statSync(filePath);
            const ext = path_1.default.extname(filename).slice(1).toLowerCase();
            const mimeTypes = {
                png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
                webp: 'image/webp', gif: 'image/gif', svg: 'image/svg+xml',
            };
            await client_1.prisma.media.create({
                data: {
                    url: `/uploads/${filename}`,
                    filename,
                    mimeType: mimeTypes[ext] || 'image/png',
                    size: stat.size,
                },
            });
            added++;
        }
        res.json({ added, total: files.length });
    }
    catch (err) {
        next(err);
    }
});
exports.adminMediaController = router;
//# sourceMappingURL=adminMediaController.js.map