export declare const settingService: {
    getAll(): Promise<Record<string, string>>;
    get(key: string): Promise<string>;
    updateMany(data: Record<string, string>): Promise<any>;
    /** Retorna configurações públicas (sem chaves sensíveis) */
    getPublic(): Promise<Record<string, string>>;
};
//# sourceMappingURL=settingService.d.ts.map