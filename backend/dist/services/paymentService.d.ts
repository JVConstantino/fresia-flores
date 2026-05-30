interface ProcessPaymentInput {
    orderId: number;
    cardToken: string;
    paymentMethodId: string;
    installments: number;
    customerEmail: string;
    customerPhone?: string;
    cpf: string;
}
interface PixPaymentInput {
    orderId: number;
    customerEmail: string;
    cpf: string;
}
export declare const paymentService: {
    processPayment(input: ProcessPaymentInput): Promise<{
        success: boolean;
        paymentId: number;
        status: string;
    }>;
    createPixPayment(input: PixPaymentInput): Promise<{
        paymentId: number;
        status: string;
        qrCode: any;
        qrCodeBase64: any;
        ticketUrl: any;
        expiresAt: any;
    }>;
};
export {};
//# sourceMappingURL=paymentService.d.ts.map