export declare const cityService: {
    findAll(): Promise<({
        _count: {
            neighborhoods: number;
        };
    } & {
        id: number;
        name: string;
        state: string;
        ibgeCode: string | null;
    })[]>;
    create(name: string, state: string, ibgeCode?: string): Promise<{
        id: number;
        name: string;
        state: string;
        ibgeCode: string | null;
    }>;
    update(id: number, data: Partial<{
        name: string;
        state: string;
        ibgeCode: string;
    }>): Promise<{
        id: number;
        name: string;
        state: string;
        ibgeCode: string | null;
    }>;
    delete(id: number): Promise<{
        id: number;
        name: string;
        state: string;
        ibgeCode: string | null;
    }>;
};
//# sourceMappingURL=cityService.d.ts.map