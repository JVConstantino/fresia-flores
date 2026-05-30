"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const errorHandler_1 = require("./middlewares/errorHandler");
const authMiddleware_1 = require("./middlewares/authMiddleware");
const adminMiddleware_1 = require("./middlewares/adminMiddleware");
const categories_1 = __importDefault(require("./routes/categories"));
const products_1 = __importDefault(require("./routes/products"));
const auth_1 = __importDefault(require("./routes/auth"));
const cities_1 = __importDefault(require("./routes/cities"));
const neighborhoods_1 = __importDefault(require("./routes/neighborhoods"));
const orders_1 = __importDefault(require("./routes/orders"));
const cities_2 = __importDefault(require("./routes/admin/cities"));
const neighborhoods_2 = __importDefault(require("./routes/admin/neighborhoods"));
const newsletter_1 = __importDefault(require("./routes/admin/newsletter"));
const payment_1 = __importDefault(require("./routes/payment"));
const promotions_1 = __importDefault(require("./routes/promotions"));
const newsletterController_1 = require("./controllers/newsletterController");
const testimonialController_1 = require("./controllers/testimonialController");
const adminPromotionController_1 = require("./controllers/adminPromotionController");
const adminStatsController_1 = require("./controllers/adminStatsController");
const adminProductController_1 = require("./controllers/adminProductController");
const adminCategoryController_1 = require("./controllers/adminCategoryController");
const adminOrderController_1 = require("./controllers/adminOrderController");
const adminCouponController_1 = require("./controllers/adminCouponController");
const adminSettingController_1 = require("./controllers/adminSettingController");
const adminWebhookController_1 = require("./controllers/adminWebhookController");
const adminMediaController_1 = require("./controllers/adminMediaController");
const adminPostController_1 = require("./controllers/adminPostController");
const publicPostController_1 = require("./controllers/publicPostController");
const adminSupplyController_1 = require("./controllers/adminSupplyController");
const adminPdvController_1 = require("./controllers/adminPdvController");
const adminAuditController_1 = require("./controllers/adminAuditController");
const publicSettingsController_1 = require("./controllers/publicSettingsController");
const publicCouponController_1 = require("./controllers/publicCouponController");
const publicDiscountController_1 = require("./controllers/publicDiscountController");
const account_1 = __importDefault(require("./routes/account"));
const upload_1 = __importDefault(require("./routes/upload"));
const adminUsers_1 = __importDefault(require("./routes/adminUsers"));
const app = (0, express_1.default)();
const PORT = process.env.PORT ?? 4000;
app.use((0, cors_1.default)({
    origin: (origin, cb) => {
        if (!origin || /^http:\/\/localhost:\d+$/.test(origin))
            cb(null, true);
        else
            cb(new Error('Not allowed by CORS'));
    },
    credentials: true,
}));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.static('public'));
app.get('/api/v1/health', (_req, res) => res.json({ status: 'ok', ts: Date.now() }));
// Rotas públicas
app.use('/api/v1/categories', categories_1.default);
app.use('/api/v1/products', products_1.default);
app.use('/api/v1/auth', auth_1.default);
app.use('/api/v1/upload', authMiddleware_1.authMiddleware, upload_1.default);
app.use('/api/v1/cities', cities_1.default);
app.use('/api/v1/neighborhoods', neighborhoods_1.default);
app.use('/api/v1/orders', orders_1.default);
app.use('/api/v1/payment', payment_1.default);
app.use('/api/v1/newsletter', newsletterController_1.newsletterController);
app.use('/api/v1/testimonials', testimonialController_1.testimonialController);
app.use('/api/v1/settings', publicSettingsController_1.publicSettingsController);
app.use('/api/v1/coupons', publicCouponController_1.publicCouponController);
app.use('/api/v1/discounts', publicDiscountController_1.publicDiscountController);
app.use('/api/v1/promotions', promotions_1.default);
// Rotas de conta (auth obrigatório)
app.use('/api/v1/account', account_1.default);
// Rotas admin (auth + admin)
app.use('/api/v1/admin/categories', authMiddleware_1.authMiddleware, adminMiddleware_1.adminMiddleware, adminCategoryController_1.adminCategoryController);
app.use('/api/v1/admin/orders', authMiddleware_1.authMiddleware, adminMiddleware_1.adminMiddleware, adminOrderController_1.adminOrderController);
app.use('/api/v1/admin/promotions', authMiddleware_1.authMiddleware, adminMiddleware_1.adminMiddleware, adminPromotionController_1.adminPromotionController);
app.use('/api/v1/admin/stats', authMiddleware_1.authMiddleware, adminMiddleware_1.adminMiddleware, adminStatsController_1.adminStatsController);
app.use('/api/v1/admin/products', authMiddleware_1.authMiddleware, adminMiddleware_1.adminMiddleware, adminProductController_1.adminProductController);
app.use('/api/v1/admin/newsletter', authMiddleware_1.authMiddleware, adminMiddleware_1.adminMiddleware, newsletter_1.default);
app.use('/api/v1/admin/cities', authMiddleware_1.authMiddleware, adminMiddleware_1.adminMiddleware, cities_2.default);
app.use('/api/v1/admin/neighborhoods', authMiddleware_1.authMiddleware, adminMiddleware_1.adminMiddleware, neighborhoods_2.default);
app.use('/api/v1/admin/coupons', authMiddleware_1.authMiddleware, adminMiddleware_1.adminMiddleware, adminCouponController_1.adminCouponController);
app.use('/api/v1/admin/settings', authMiddleware_1.authMiddleware, adminMiddleware_1.adminMiddleware, adminSettingController_1.adminSettingController);
app.use('/api/v1/admin/webhooks', authMiddleware_1.authMiddleware, adminMiddleware_1.adminMiddleware, adminWebhookController_1.adminWebhookController);
app.use('/api/v1/admin/users', adminUsers_1.default);
app.use('/api/v1/admin/media', authMiddleware_1.authMiddleware, adminMiddleware_1.adminMiddleware, adminMediaController_1.adminMediaController);
app.use('/api/v1/admin/posts', authMiddleware_1.authMiddleware, adminMiddleware_1.adminMiddleware, adminPostController_1.adminPostController);
app.use('/api/v1/admin/supplies', authMiddleware_1.authMiddleware, adminMiddleware_1.adminMiddleware, adminSupplyController_1.adminSupplyController);
app.use('/api/v1/admin/pdv', authMiddleware_1.authMiddleware, adminMiddleware_1.adminMiddleware, adminPdvController_1.adminPdvController);
app.use('/api/v1/admin/audit', authMiddleware_1.authMiddleware, adminMiddleware_1.adminMiddleware, adminAuditController_1.adminAuditController);
app.use('/api/v1/posts', publicPostController_1.publicPostController);
app.use(errorHandler_1.errorHandler);
app.listen(PORT, () => console.log(`Backend rodando em http://localhost:${PORT}`));
//# sourceMappingURL=server.js.map