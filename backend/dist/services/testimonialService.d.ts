interface TestimonialDTO {
    id: number;
    clientName: string;
    rating: number;
    text: string;
    isActive: boolean;
    createdAt: Date;
}
declare class TestimonialService {
    getActive(): Promise<TestimonialDTO[]>;
    getAll(page?: number, pageSize?: number): Promise<{
        data: {
            id: number;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            clientName: string;
            rating: number;
            text: string;
        }[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
        };
    }>;
    create(data: {
        clientName: string;
        rating: number;
        text: string;
    }): Promise<TestimonialDTO>;
    update(id: number, data: Partial<{
        clientName: string;
        rating: number;
        text: string;
        isActive: boolean;
    }>): Promise<TestimonialDTO>;
    delete(id: number): Promise<void>;
}
export declare const testimonialService: TestimonialService;
export {};
//# sourceMappingURL=testimonialService.d.ts.map