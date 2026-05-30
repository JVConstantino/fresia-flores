"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testimonialService = void 0;
const client_1 = require("@/prisma/client");
class TestimonialService {
    async getActive() {
        return client_1.prisma.testimonial.findMany({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' }
        });
    }
    async getAll(page = 1, pageSize = 20) {
        const skip = (page - 1) * pageSize;
        const [data, total] = await Promise.all([
            client_1.prisma.testimonial.findMany({
                skip,
                take: pageSize,
                orderBy: { createdAt: 'desc' }
            }),
            client_1.prisma.testimonial.count()
        ]);
        return {
            data,
            pagination: { page, pageSize, total }
        };
    }
    async create(data) {
        if (data.rating < 1 || data.rating > 5) {
            throw new Error('Rating deve ser entre 1 e 5');
        }
        return client_1.prisma.testimonial.create({
            data: {
                clientName: data.clientName,
                rating: data.rating,
                text: data.text,
                isActive: true
            }
        });
    }
    async update(id, data) {
        return client_1.prisma.testimonial.update({
            where: { id },
            data
        });
    }
    async delete(id) {
        await client_1.prisma.testimonial.delete({ where: { id } });
    }
}
exports.testimonialService = new TestimonialService();
//# sourceMappingURL=testimonialService.js.map