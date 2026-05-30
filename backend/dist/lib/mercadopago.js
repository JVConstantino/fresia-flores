"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.payment = void 0;
const mercadopago_1 = require("mercadopago");
const client = new mercadopago_1.MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN,
    options: { timeout: 5000 }
});
exports.payment = new mercadopago_1.Payment(client);
//# sourceMappingURL=mercadopago.js.map