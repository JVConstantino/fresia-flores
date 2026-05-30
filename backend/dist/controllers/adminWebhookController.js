"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminWebhookController = void 0;
const express_1 = require("express");
const webhookService_1 = require("@/services/webhookService");
const router = (0, express_1.Router)();
router.get('/', async (_req, res, next) => {
    try {
        const items = await webhookService_1.webhookService.getAll();
        res.json(items);
    }
    catch (err) {
        next(err);
    }
});
router.get('/:id', async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (isNaN(id))
            return res.status(400).json({ error: 'ID inválido' });
        const item = await webhookService_1.webhookService.getById(id);
        if (!item)
            return res.status(404).json({ error: 'Webhook não encontrado' });
        res.json(item);
    }
    catch (err) {
        next(err);
    }
});
router.post('/', async (req, res, next) => {
    try {
        const { name, url, events, secret, isActive } = req.body;
        if (!name || !url || !Array.isArray(events) || events.length === 0) {
            return res.status(400).json({ error: 'Nome, URL e eventos são obrigatórios' });
        }
        const item = await webhookService_1.webhookService.create({ name, url, events, secret, isActive });
        res.status(201).json(item);
    }
    catch (err) {
        next(err);
    }
});
router.put('/:id', async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (isNaN(id))
            return res.status(400).json({ error: 'ID inválido' });
        const { name, url, events, secret, isActive } = req.body;
        const item = await webhookService_1.webhookService.update(id, { name, url, events, secret, isActive });
        res.json(item);
    }
    catch (err) {
        next(err);
    }
});
router.delete('/:id', async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (isNaN(id))
            return res.status(400).json({ error: 'ID inválido' });
        await webhookService_1.webhookService.delete(id);
        res.status(204).send();
    }
    catch (err) {
        next(err);
    }
});
router.get('/:id/logs', async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (isNaN(id))
            return res.status(400).json({ error: 'ID inválido' });
        const logs = await webhookService_1.webhookService.getLogs(id, 100);
        res.json(logs);
    }
    catch (err) {
        next(err);
    }
});
router.delete('/:id/logs', async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (isNaN(id))
            return res.status(400).json({ error: 'ID inválido' });
        await webhookService_1.webhookService.clearLogs(id);
        res.status(204).send();
    }
    catch (err) {
        next(err);
    }
});
router.post('/:id/test', async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (isNaN(id))
            return res.status(400).json({ error: 'ID inválido' });
        const webhook = await webhookService_1.webhookService.getById(id);
        if (!webhook)
            return res.status(404).json({ error: 'Webhook não encontrado' });
        let events = [];
        try {
            events = JSON.parse(webhook.events);
        }
        catch {
            events = [];
        }
        const event = events[0] || 'order.created';
        await (0, webhookService_1.triggerWebhooks)(event, {
            test: true,
            message: 'Este é um evento de teste do Frésia Webhooks',
            webhookId: id,
        });
        res.json({ success: true, message: 'Evento de teste disparado' });
    }
    catch (err) {
        next(err);
    }
});
exports.adminWebhookController = router;
//# sourceMappingURL=adminWebhookController.js.map