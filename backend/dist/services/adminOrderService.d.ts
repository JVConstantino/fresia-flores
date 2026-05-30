export declare const adminOrderService: {
    getAll(page?: number, pageSize?: number, status?: string): Promise<{
        items: ({
            user: {
                id: number;
                name: string;
                email: string;
            };
            neighborhood: {
                id: number;
                name: string;
            };
            items: ({
                product: {
                    id: number;
                    name: string;
                };
            } & {
                id: number;
                price: import("@prisma/client/runtime/library").Decimal;
                productId: number;
                qty: number;
                variantId: number | null;
                orderId: number;
            })[];
        } & {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            userId: number | null;
            status: string;
            paymentStatus: string;
            paymentMethod: string;
            total: import("@prisma/client/runtime/library").Decimal;
            discount: import("@prisma/client/runtime/library").Decimal | null;
            couponId: number | null;
            deliveryMessage: string | null;
            deliveryMethod: string;
            neighborhoodId: number | null;
            customerName: string;
            customerEmail: string;
            customerPhone: string | null;
            paymentId: string | null;
            channel: string;
            installments: number | null;
        })[];
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    }>;
    getById(id: number): Promise<{
        user: {
            id: number;
            name: string;
            email: string;
            phone: string;
        };
        neighborhood: {
            id: number;
            name: string;
            isActive: boolean;
            cityId: number;
            deliveryFee: import("@prisma/client/runtime/library").Decimal;
        };
        items: ({
            product: {
                id: number;
                name: string;
                price: import("@prisma/client/runtime/library").Decimal;
                images: string;
            };
            variant: {
                id: number;
                name: string;
                description: string;
                images: string;
            };
        } & {
            id: number;
            price: import("@prisma/client/runtime/library").Decimal;
            productId: number;
            qty: number;
            variantId: number | null;
            orderId: number;
        })[];
    } & {
        id: number;
        createdAt: Date;
        updatedAt: Date;
        userId: number | null;
        status: string;
        paymentStatus: string;
        paymentMethod: string;
        total: import("@prisma/client/runtime/library").Decimal;
        discount: import("@prisma/client/runtime/library").Decimal | null;
        couponId: number | null;
        deliveryMessage: string | null;
        deliveryMethod: string;
        neighborhoodId: number | null;
        customerName: string;
        customerEmail: string;
        customerPhone: string | null;
        paymentId: string | null;
        channel: string;
        installments: number | null;
    }>;
    updateStatus(id: number, status: string): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        userId: number | null;
        status: string;
        paymentStatus: string;
        paymentMethod: string;
        total: import("@prisma/client/runtime/library").Decimal;
        discount: import("@prisma/client/runtime/library").Decimal | null;
        couponId: number | null;
        deliveryMessage: string | null;
        deliveryMethod: string;
        neighborhoodId: number | null;
        customerName: string;
        customerEmail: string;
        customerPhone: string | null;
        paymentId: string | null;
        channel: string;
        installments: number | null;
    }>;
};
//# sourceMappingURL=adminOrderService.d.ts.map