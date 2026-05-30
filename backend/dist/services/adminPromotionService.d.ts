import { Decimal } from '@prisma/client/runtime/library';
interface PromotionInput {
    name: string;
    description?: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    validFrom: Date;
    validTo: Date;
    isActive: boolean;
    productIds: number[];
}
declare class AdminPromotionService {
    private getStatus;
    getAll(page?: number, pageSize?: number, status?: string, search?: string): Promise<{
        data: {
            id: number;
            name: string;
            description: string;
            discountType: string;
            discountValue: number;
            validFrom: Date;
            validTo: Date;
            isActive: boolean;
            status: "active" | "expired" | "inactive";
            productCount: number;
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
        productIds: number[];
        products: {
            id: number;
            name: string;
            slug: string;
            description: string | null;
            shortDescription: string | null;
            price: Decimal;
            salePrice: Decimal | null;
            stock: number;
            images: string | null;
            isActive: boolean;
            isFeatured: boolean;
            allowCoupons: boolean;
            categoryId: number;
            createdAt: Date;
            updatedAt: Date;
        }[];
        id: number;
        name: string;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        discountType: string;
        validFrom: Date;
        validTo: Date;
    }>;
    create(input: PromotionInput): Promise<{
        discountValue: number;
        productIds: number[];
        products: {
            id: number;
            name: string;
            slug: string;
            description: string | null;
            shortDescription: string | null;
            price: Decimal;
            salePrice: Decimal | null;
            stock: number;
            images: string | null;
            isActive: boolean;
            isFeatured: boolean;
            allowCoupons: boolean;
            categoryId: number;
            createdAt: Date;
            updatedAt: Date;
        }[];
        id: number;
        name: string;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        discountType: string;
        validFrom: Date;
        validTo: Date;
    }>;
    update(id: number, input: Partial<PromotionInput>): Promise<{
        discountValue: number;
        productIds: number[];
        products: {
            id: number;
            name: string;
            slug: string;
            description: string | null;
            shortDescription: string | null;
            price: Decimal;
            salePrice: Decimal | null;
            stock: number;
            images: string | null;
            isActive: boolean;
            isFeatured: boolean;
            allowCoupons: boolean;
            categoryId: number;
            createdAt: Date;
            updatedAt: Date;
        }[];
        id: number;
        name: string;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        discountType: string;
        validFrom: Date;
        validTo: Date;
    }>;
    delete(id: number): Promise<void>;
    getActive(): Promise<{
        id: number;
        name: string;
        discountType: string;
        discountValue: number;
        products: {
            id: number;
            name: string;
            slug: string;
            description: string | null;
            shortDescription: string | null;
            price: Decimal;
            salePrice: Decimal | null;
            stock: number;
            images: string | null;
            isActive: boolean;
            isFeatured: boolean;
            allowCoupons: boolean;
            categoryId: number;
            createdAt: Date;
            updatedAt: Date;
        }[];
    }[]>;
}
export declare const adminPromotionService: AdminPromotionService;
export {};
//# sourceMappingURL=adminPromotionService.d.ts.map