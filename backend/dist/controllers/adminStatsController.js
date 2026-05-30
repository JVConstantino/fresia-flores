"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminStatsController = void 0;
const express_1 = require("express");
const adminStatsService_1 = require("@/services/adminStatsService");
const router = (0, express_1.Router)();
router.get('/overview', async (_req, res, next) => {
    try {
        const stats = await adminStatsService_1.adminStatsService.getOverviewStats();
        return res.json(stats);
    }
    catch (err) {
        next(err);
    }
});
router.get('/sales-chart', async (req, res, next) => {
    try {
        const days = parseInt(req.query.days) || 30;
        const chart = await adminStatsService_1.adminStatsService.getSalesChart(days);
        return res.json(chart);
    }
    catch (err) {
        next(err);
    }
});
router.get('/revenue-by-category', async (_req, res, next) => {
    try {
        const data = await adminStatsService_1.adminStatsService.getRevenueByCategory();
        return res.json(data);
    }
    catch (err) {
        next(err);
    }
});
router.get('/top-products', async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit) || 5;
        const data = await adminStatsService_1.adminStatsService.getTopProducts(limit);
        return res.json(data);
    }
    catch (err) {
        next(err);
    }
});
router.get('/orders-status', async (_req, res, next) => {
    try {
        const data = await adminStatsService_1.adminStatsService.getOrdersStatus();
        return res.json(data);
    }
    catch (err) {
        next(err);
    }
});
router.get('/channel-breakdown', async (_req, res, next) => {
    try {
        res.json(await adminStatsService_1.adminStatsService.getChannelBreakdown());
    }
    catch (e) {
        next(e);
    }
});
router.get('/payment-method-breakdown', async (_req, res, next) => {
    try {
        res.json(await adminStatsService_1.adminStatsService.getPaymentMethodBreakdown());
    }
    catch (e) {
        next(e);
    }
});
router.get('/inventory-alerts', async (_req, res, next) => {
    try {
        res.json(await adminStatsService_1.adminStatsService.getInventoryAlerts());
    }
    catch (e) {
        next(e);
    }
});
router.get('/operational-costs', async (req, res, next) => {
    try {
        const days = parseInt(req.query.days || '30');
        res.json(await adminStatsService_1.adminStatsService.getOperationalCosts(days));
    }
    catch (e) {
        next(e);
    }
});
router.get('/customer-metrics', async (req, res, next) => {
    try {
        const days = parseInt(req.query.days || '30');
        res.json(await adminStatsService_1.adminStatsService.getCustomerMetrics(days));
    }
    catch (e) {
        next(e);
    }
});
exports.adminStatsController = router;
//# sourceMappingURL=adminStatsController.js.map