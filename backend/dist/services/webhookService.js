"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhookService = void 0;
exports.triggerWebhooks = triggerWebhooks;
const client_1 = require("@/prisma/client");
const axios_1 = __importDefault(require("axios"));
const crypto_1 = __importDefault(require("crypto"));
exports.webhookService = {
    async getAll() {
        return client_1.prisma.webhook.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: { select: { logs: true } }
            }
        });
    },
    async getById(id) {
        return client_1.prisma.webhook.findUnique({
            where: { id },
            include: { logs: { orderBy: { createdAt: 'desc' }, take: 50 } }
        });
    },
    async create(data) {
        return client_1.prisma.webhook.create({
            data: {
                name: data.name,
                url: data.url,
                events: JSON.stringify(data.events),
                secret: data.secret,
                isActive: data.isActive ?? true,
            }
        });
    },
    async update(id, data) {
        return client_1.prisma.webhook.update({
            where: { id },
            data: {
                ...data,
                events: data.events ? JSON.stringify(data.events) : undefined,
                secret: data.secret === null ? null : data.secret,
            }
        });
    },
    async delete(id) {
        return client_1.prisma.webhook.delete({ where: { id } });
    },
    async getLogs(webhookId, limit = 50) {
        return client_1.prisma.webhookLog.findMany({
            where: { webhookId },
            orderBy: { createdAt: 'desc' },
            take: limit
        });
    },
    async clearLogs(webhookId) {
        return client_1.prisma.webhookLog.deleteMany({ where: { webhookId } });
    }
};
async function triggerWebhooks(event, data) {
    const webhooks = await client_1.prisma.webhook.findMany({
        where: { isActive: true }
    });
    const payload = {
        event,
        timestamp: new Date().toISOString(),
        data,
    };
    const payloadStr = JSON.stringify(payload);
    for (const wh of webhooks) {
        let events = [];
        try {
            events = JSON.parse(wh.events);
        }
        catch {
            events = [];
        }
        if (!events.includes(event))
            continue;
        const headers = {
            'Content-Type': 'application/json',
            'X-Fresia-Event': event,
        };
        if (wh.secret) {
            const signature = crypto_1.default
                .createHmac('sha256', wh.secret)
                .update(payloadStr)
                .digest('hex');
            headers['X-Fresia-Signature'] = signature;
        }
        try {
            const response = await axios_1.default.post(wh.url, payload, {
                headers,
                timeout: 15000,
                validateStatus: () => true,
            });
            await client_1.prisma.webhookLog.create({
                data: {
                    webhookId: wh.id,
                    event,
                    payload: payloadStr,
                    statusCode: response.status,
                    response: JSON.stringify(response.data).slice(0, 2000),
                    success: response.status >= 200 && response.status < 300,
                }
            });
        }
        catch (err) {
            await client_1.prisma.webhookLog.create({
                data: {
                    webhookId: wh.id,
                    event,
                    payload: payloadStr,
                    statusCode: null,
                    response: err?.message?.slice(0, 2000) ?? 'Unknown error',
                    success: false,
                }
            });
        }
    }
}
//# sourceMappingURL=webhookService.js.map