"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.newsletterService = void 0;
const client_1 = require("@/prisma/client");
class NewsletterService {
    async subscribe(email) {
        const existing = await client_1.prisma.newsletterSubscription.findUnique({
            where: { email }
        });
        if (existing) {
            throw new Error('Email já inscrito');
        }
        const subscription = await client_1.prisma.newsletterSubscription.create({
            data: { email, active: true }
        });
        return {
            id: subscription.id,
            email: subscription.email,
            active: subscription.active,
            createdAt: subscription.createdAt
        };
    }
    async getSubscriptions(page = 1, pageSize = 50) {
        const skip = (page - 1) * pageSize;
        const [data, total] = await Promise.all([
            client_1.prisma.newsletterSubscription.findMany({
                where: { active: true },
                skip,
                take: pageSize,
                orderBy: { createdAt: 'desc' }
            }),
            client_1.prisma.newsletterSubscription.count({
                where: { active: true }
            })
        ]);
        return {
            data: data.map(sub => ({
                id: sub.id,
                email: sub.email,
                active: sub.active,
                createdAt: sub.createdAt
            })),
            pagination: {
                page,
                pageSize,
                total
            }
        };
    }
    async unsubscribe(email) {
        await client_1.prisma.newsletterSubscription.update({
            where: { email },
            data: { active: false }
        });
    }
}
exports.newsletterService = new NewsletterService();
//# sourceMappingURL=newsletterService.js.map