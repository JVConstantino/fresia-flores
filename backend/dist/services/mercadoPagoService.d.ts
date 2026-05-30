interface CardTokenRequest {
    cardNumber: string;
    cardholderName: string;
    cardExpirationMonth: string;
    cardExpirationYear: string;
    securityCode: string;
    identificationType: string;
    identificationNumber: string;
}
interface CardTokenResponse {
    token: string;
    paymentMethodId: string;
}
export declare const mercadoPagoService: {
    /**
     * TODO: Integrate with window.MercadoPago.createCardToken() once MP SDK loaded
     * This currently generates a mock token for testing
     * Real integration: https://www.mercadopago.com.ar/developers/en/docs/checkout-api/reference/payments/_post_payments/post
     */
    createCardToken(data: CardTokenRequest): Promise<CardTokenResponse>;
    /**
     * Detect card brand from BIN (first 6 digits)
     * TODO: Replace with real MP getBin() API call for production
     */
    detectBrand(cardNumber: string): string;
    /**
     * TODO: Integrate with MP payment.create() once real tokenization works
     * This will be called from checkout payment processing
     * Structure: payment.create({ transaction_amount, payment_method_id, token, ...metadata })
     */
    processPayment(data: any): Promise<any>;
};
export {};
//# sourceMappingURL=mercadoPagoService.d.ts.map