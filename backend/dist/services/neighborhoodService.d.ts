export declare const neighborhoodService: {
    findByCityId(cityId: number): Promise<{
        id: number;
        name: string;
        isActive: boolean;
        cityId: number;
        deliveryFee: import("@prisma/client/runtime/library").Decimal;
    }[]>;
    findAllAdmin(cityId?: number): Promise<({
        city: {
            id: number;
            name: string;
            state: string;
        };
    } & {
        id: number;
        name: string;
        isActive: boolean;
        cityId: number;
        deliveryFee: import("@prisma/client/runtime/library").Decimal;
    })[]>;
    create(cityId: number, name: string, deliveryFee: number): Promise<{
        id: number;
        name: string;
        isActive: boolean;
        cityId: number;
        deliveryFee: import("@prisma/client/runtime/library").Decimal;
    }>;
    update(id: number, data: Partial<{
        name: string;
        deliveryFee: number;
        isActive: boolean;
    }>): Promise<{
        id: number;
        name: string;
        isActive: boolean;
        cityId: number;
        deliveryFee: import("@prisma/client/runtime/library").Decimal;
    }>;
    delete(id: number): Promise<{
        id: number;
        name: string;
        isActive: boolean;
        cityId: number;
        deliveryFee: import("@prisma/client/runtime/library").Decimal;
    }>;
};
//# sourceMappingURL=neighborhoodService.d.ts.map