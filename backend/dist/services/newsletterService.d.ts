interface SubscriptionResult {
    id: number;
    email: string;
    active: boolean;
    createdAt: Date;
}
interface PaginatedResult {
    data: SubscriptionResult[];
    pagination: {
        page: number;
        pageSize: number;
        total: number;
    };
}
declare class NewsletterService {
    subscribe(email: string): Promise<SubscriptionResult>;
    getSubscriptions(page?: number, pageSize?: number): Promise<PaginatedResult>;
    unsubscribe(email: string): Promise<void>;
}
export declare const newsletterService: NewsletterService;
export {};
//# sourceMappingURL=newsletterService.d.ts.map