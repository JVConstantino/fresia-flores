import { Decimal } from '@prisma/client/runtime/library';
interface CouponInput {
    code: string;
    description?: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    minOrderValue?: number;
    maxUses?: number;
    validFrom: string | Date;
    validTo: string | Date;
    isActive?: boolean;
}
export declare const adminCouponService: {
    getAll(page?: number, pageSize?: number, status?: string, search?: string): Promise<{
        data: {
            id: number;
            code: string;
            description: string;
            discountType: string;
            discountValue: number;
            minOrderValue: number;
            maxUses: number;
            usedCount: number;
            validFrom: Date;
            validTo: Date;
            isActive: boolean;
            status: "active" | "expired" | "inactive" | "esgotado";
            createdAt: Date;
        }[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
        };
    }>;
    getById(id: number): Promise<{
        discountValue: number;
        minOrderValue: number;
        id: number;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        discountType: string;
        maxUses: number | null;
        usedCount: number;
        validFrom: Date;
        validTo: Date;
    }>;
    create(input: CouponInput): Promise<{
        id: number;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        discountType: string;
        discountValue: Decimal;
        minOrderValue: Decimal | null;
        maxUses: number | null;
        usedCount: number;
        validFrom: Date;
        validTo: Date;
    }>;
    update(id: number, input: Partial<CouponInput>): Promise<{
        id: number;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        discountType: string;
        discountValue: Decimal;
        minOrderValue: Decimal | null;
        maxUses: number | null;
        usedCount: number;
        validFrom: Date;
        validTo: Date;
    }>;
    delete(id: number): Promise<void>;
    validate(code: string, orderTotal: number): Promise<{
        id: number;
        code: string;
        discountType: string;
        discountValue: number;
        discount: number;
    }>;
};
export {};
//# sourceMappingURL=adminCouponService.d.ts.map