export declare const adminCategoryService: {
    getAll(): Promise<({
        _count: {
            products: number;
        };
    } & {
        id: number;
        name: string;
        slug: string;
        imageUrl: string | null;
    })[]>;
    create(data: {
        name: string;
        slug?: string;
        imageUrl?: string | null;
    }): Promise<{
        id: number;
        name: string;
        slug: string;
        imageUrl: string | null;
    }>;
    update(id: number, data: {
        name?: string;
        slug?: string;
        imageUrl?: string | null;
    }): Promise<{
        id: number;
        name: string;
        slug: string;
        imageUrl: string | null;
    }>;
    delete(id: number): Promise<{
        id: number;
        name: string;
        slug: string;
        imageUrl: string | null;
    }>;
};
//# sourceMappingURL=adminCategoryService.d.ts.map