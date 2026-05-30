declare class AdminStatsService {
    getOverviewStats(): Promise<{
        totalSales: number;
        salesChange: number;
        totalOrders: number;
        ordersChange: number;
        activeCustomers: number;
        lowStockProducts: number;
    }>;
    getSalesChart(days?: number): Promise<{
        date: string;
        sales: number;
    }[]>;
    getRevenueByCategory(): Promise<{
        name: string;
        value: number;
    }[]>;
    getTopProducts(limit?: number): Promise<any[]>;
    getOrdersStatus(): Promise<{
        name: string;
        value: number;
    }[]>;
    getChannelBreakdown(): Promise<{
        channel: string;
        orderCount: number;
        total: number;
    }[]>;
    getPaymentMethodBreakdown(): Promise<{
        paymentMethod: string;
        orderCount: number;
        total: number;
    }[]>;
    getInventoryAlerts(): Promise<{
        products: {
            id: number;
            name: string;
            stock: number;
        }[];
        supplies: {
            id: number;
            name: string;
            currentStock: number;
            minStock: number;
            unit: string;
            category: string;
        }[];
    }>;
    getOperationalCosts(daysBack?: number): Promise<{
        total: number;
        count: number;
        daysBack: number;
    }>;
    getCustomerMetrics(daysBack?: number): Promise<{
        newCustomers: number;
        ticketAverage: number;
        ordersInPeriod: number;
        uniqueCustomers: number;
    }>;
    getAdvancedAnalytics(daysBack?: number): Promise<{
        periodDays: number;
        kpis: {
            totalProducts: number;
            activeProducts: number;
            orders: number;
            deliveredOrders: number;
            paidOrders: number;
            avgTicket: number;
            revenue: number;
            cost: number;
            profit: number;
            marginPct: number;
        };
        topViewedProducts: {
            productId: number;
            name: string;
            qty: number;
        }[];
        topSearchedTerms: {
            term: string;
            hits: number;
        }[];
        topCustomers: {
            name: string;
            email: string;
            userId: number;
            orders: number;
            spent: number;
        }[];
        geography: {
            topNeighborhoods: {
                id: number;
                neighborhood: string;
                city: string;
                orders: number;
            }[];
        };
        loginMetrics: {
            trackingEnabled: boolean;
            note: string;
            newUsers: number;
            activeCustomers: number;
        };
    }>;
    private translateStatus;
}
export declare const adminStatsService: AdminStatsService;
export {};
//# sourceMappingURL=adminStatsService.d.ts.map