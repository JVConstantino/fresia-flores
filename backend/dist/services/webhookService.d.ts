export type WebhookEvent = 'order.created' | 'order.updated' | 'order.paid' | 'product.low_stock' | 'newsletter.subscribed' | 'testimonial.created';
export interface WebhookPayload {
    event: WebhookEvent;
    timestamp: string;
    data: unknown;
}
export declare const webhookService: {
    getAll(): Promise<({
        _count: {
            logs: number;
        };
    } & {
        id: number;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        url: string;
        events: string;
        secret: string | null;
    })[]>;
    getById(id: number): Promise<{
        logs: {
            event: string;
            id: number;
            createdAt: Date;
            statusCode: number | null;
            payload: string;
            response: string | null;
            success: boolean;
            webhookId: number;
        }[];
    } & {
        id: number;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        url: string;
        events: string;
        secret: string | null;
    }>;
    create(data: {
        name: string;
        url: string;
        events: string[];
        secret?: string;
        isActive?: boolean;
    }): Promise<{
        id: number;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        url: string;
        events: string;
        secret: string | null;
    }>;
    update(id: number, data: {
        name?: string;
        url?: string;
        events?: string[];
        secret?: string | null;
        isActive?: boolean;
    }): Promise<{
        id: number;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        url: string;
        events: string;
        secret: string | null;
    }>;
    delete(id: number): Promise<{
        id: number;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        url: string;
        events: string;
        secret: string | null;
    }>;
    getLogs(webhookId: number, limit?: number): Promise<{
        event: string;
        id: number;
        createdAt: Date;
        statusCode: number | null;
        payload: string;
        response: string | null;
        success: boolean;
        webhookId: number;
    }[]>;
    clearLogs(webhookId: number): Promise<import(".prisma/client").Prisma.BatchPayload>;
};
export declare function triggerWebhooks(event: WebhookEvent, data: unknown): Promise<void>;
//# sourceMappingURL=webhookService.d.ts.map