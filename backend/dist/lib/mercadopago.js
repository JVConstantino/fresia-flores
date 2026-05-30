"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPaymentClient = getPaymentClient;
const mercadopago_1 = require("mercadopago");
function getPaymentClient() {
    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) {
        throw Object.assign(new Error('MP_ACCESS_TOKEN not configured'), { statusCode: 503 });
    }
    const client = new mercadopago_1.MercadoPagoConfig({
        accessToken,
        options: { timeout: 5000 }
    });
    return new mercadopago_1.Payment(client);
}
//# sourceMappingURL=mercadopago.js.map