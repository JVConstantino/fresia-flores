type Sort = 'newest' | 'price_asc' | 'price_desc';
export declare const productService: {
    findAll(categoryIds?: number[], sort?: Sort, limit?: number, excludeSlug?: string, priceMin?: number, priceMax?: number, isFeatured?: boolean, hasPromotion?: boolean, search?: string): Promise<({
        category: {
            id: number;
            name: string;
            slug: string;
        };
        variants: {
            id: number;
            name: string;
            description: string;
            price: import("@prisma/client/runtime/library").Decimal;
            salePrice: import("@prisma/client/runtime/library").Decimal;
            stock: number;
            images: string;
        }[];
    } & {
        id: number;
        name: string;
        slug: string;
        description: string | null;
        shortDescription: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        salePrice: import("@prisma/client/runtime/library").Decimal | null;
        stock: number;
        images: string | null;
        isActive: boolean;
        isFeatured: boolean;
        allowCoupons: boolean;
        categoryId: number;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    findFeatured(): Promise<({
        category: {
            id: number;
            name: string;
            slug: string;
        };
    } & {
        id: number;
        name: string;
        slug: string;
        description: string | null;
        shortDescription: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        salePrice: import("@prisma/client/runtime/library").Decimal | null;
        stock: number;
        images: string | null;
        isActive: boolean;
        isFeatured: boolean;
        allowCoupons: boolean;
        categoryId: number;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    findBySlug(slug: string): Promise<{
        category: {
            id: number;
            name: string;
            slug: string;
        };
        variants: {
            id: number;
            name: string;
            description: string;
            price: import("@prisma/client/runtime/library").Decimal;
            salePrice: import("@prisma/client/runtime/library").Decimal;
            stock: number;
            images: string;
        }[];
    } & {
        id: number;
        name: string;
        slug: string;
        description: string | null;
        shortDescription: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        salePrice: import("@prisma/client/runtime/library").Decimal | null;
        stock: number;
        images: string | null;
        isActive: boolean;
        isFeatured: boolean;
        allowCoupons: boolean;
        categoryId: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
};
export {};
//# sourceMappingURL=productService.d.ts.map