// TODO: Real Mercado Pago integration pending
// This service prepares the structure for MP API calls
// Once MP SDK is integrated, replace mock functions with real API calls

interface CardTokenRequest {
  cardNumber: string
  cardholderName: string
  cardExpirationMonth: string
  cardExpirationYear: string
  securityCode: string
  identificationType: string // "CPF"
  identificationNumber: string
}

interface CardTokenResponse {
  token: string
  paymentMethodId: string // "visa", "mastercard", etc
}

export const mercadoPagoService = {
  /**
   * TODO: Integrate with window.MercadoPago.createCardToken() once MP SDK loaded
   * This currently generates a mock token for testing
   * Real integration: https://www.mercadopago.com.ar/developers/en/docs/checkout-api/reference/payments/_post_payments/post
   */
  async createCardToken(data: CardTokenRequest): Promise<CardTokenResponse> {
    // TODO: Validate cardNumber against Luhn algorithm
    // TODO: Call window.MercadoPago.createCardToken(data) in real implementation

    // MOCK: Generate fake token for now
    const mockToken = `test_token_${data.cardNumber.slice(-4)}_${Date.now()}`
    const paymentMethodId = this.detectBrand(data.cardNumber)

    return {
      token: mockToken,
      paymentMethodId
    }
  },

  /**
   * Detect card brand from BIN (first 6 digits)
   * TODO: Replace with real MP getBin() API call for production
   */
  detectBrand(cardNumber: string): string {
    const bin = cardNumber.slice(0, 6)
    const binNum = parseInt(bin)

    // Basic BIN detection (mock)
    if (binNum >= 400000 && binNum <= 499999) return 'visa'
    if (binNum >= 500000 && binNum <= 559999) return 'mastercard'
    if (binNum >= 636214 && binNum <= 636215) return 'elo'
    if (binNum >= 506629 && binNum <= 506778) return 'elo'
    if (binNum >= 384100 && binNum <= 384800) return 'hipercard'
    if (binNum >= 300000 && binNum <= 305999) return 'amex'

    return 'unknown'
  },

  /**
   * TODO: Integrate with MP payment.create() once real tokenization works
   * This will be called from checkout payment processing
   * Structure: payment.create({ transaction_amount, payment_method_id, token, ...metadata })
   */
  async processPayment(data: any): Promise<any> {
    // TODO: Real MP payment processing
    throw new Error('Payment processing not yet implemented. Awaiting real MP integration.')
  }
}
