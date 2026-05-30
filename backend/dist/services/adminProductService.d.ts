import { Decimal } from '@prisma/client/runtime/library';
interface VariantInput {
    id?: number;
    name: string;
    description?: string;
    price: number;
    salePrice?: number | null;
    stock: number;
    images?: string;
}
interface ProductInput {
    name?: string;
    slug?: string;
    description?: string;
    shortDescription?: string;
    categoryId?: number;
    price?: number;
    salePrice?: number | null;
    stock?: number;
    isActive?: boolean;
    isFeatured?: boolean;
    allowCoupons?: boolean;
    images?: string;
    tags?: string;
    variants?: VariantInput[];
    specsTable?: string;
}
declare class AdminProductService {
    getAll(page?: number, pageSize?: number, category?: string, search?: string): Promise<{
        data: {
            id: number;
            name: string;
            price: number;
            salePrice: number;
            stock: number;
            categoryId: number;
            categoryName: string;
            isActive: boolean;
            images: string;
            slug: string;
        }[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
        };
    }>;
    getById(id: number): Promise<{
        price: number;
        salePrice: number;
        category: {
            id: number;
            name: string;
            slug: string;
            imageUrl: string | null;
        };
        variants: {
            id: number;
            name: string;
            description: string | null;
            price: Decimal;
            salePrice: Decimal | null;
            stock: number;
            images: string | null;
            productId: number;
        }[];
        id: number;
        name: string;
        slug: string;
        description: string | null;
        shortDescription: string | null;
        stock: number;
        images: string | null;
        isActive: boolean;
        isFeatured: boolean;
        allowCoupons: boolean;
        categoryId: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
    create(input: ProductInput): Promise<{
        variants: {
            id: number;
            name: string;
            description: string | null;
            price: Decimal;
            salePrice: Decimal | null;
            stock: number;
            images: string | null;
            productId: number;
        }[];
    } & {
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
    }>;
    update(id: number, input: ProductInput): Promise<{
        category: {
            id: number;
            name: string;
            slug: string;
            imageUrl: string | null;
        };
        variants: {
            id: number;
            name: string;
            description: string | null;
            price: Decimal;
            salePrice: Decimal | null;
            stock: number;
            images: string | null;
            productId: number;
        }[];
    } & {
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
    }>;
    delete(id: number): Promise<void>;
    batchDelete(ids: number[]): Promise<void>;
}
export declare const adminProductService: AdminProductService;
export {};
//# sourceMappingURL=adminProductService.d.ts.map