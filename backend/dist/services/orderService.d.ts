interface CreateOrderInput {
    userId?: number;
    items: {
        productId: number;
        variantId?: number | null;
        qty: number;
        price: number;
    }[];
    neighborhoodId?: number;
    deliveryMethod: string;
    deliveryMessage?: string;
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    cardToken?: string;
    paymentMethodId?: string;
    installments?: number;
    cpf?: string;
    couponId?: number;
    discount?: number;
    paymentMethod?: string;
    isTestMode?: boolean;
}
export declare const orderService: {
    create(input: CreateOrderInput): Promise<{
        id: number;
        status: string;
        paymentStatus: string;
        paymentMethod: string;
        total: import("@prisma/client/runtime/library").Decimal;
    }>;
    findMyOrders(userId: number): Promise<({
        items: ({
            product: {
                name: string;
            };
            variant: {
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
    })[]>;
};
export {};
//# sourceMappingURL=orderService.d.ts.map