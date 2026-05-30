"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminMiddleware = adminMiddleware;
function adminMiddleware(req, res, next) {
    const user = req.user;
    if (!user?.isAdmin)
        return res.status(403).json({ error: 'Acesso negado' });
    next();
}
//# sourceMappingURL=adminMiddleware.js.map