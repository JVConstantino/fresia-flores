"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingService = void 0;
const client_1 = require("@/prisma/client");
const DEFAULTS = {
    store_name: 'Frésia',
    store_phone: '',
    store_address: '',
    store_city: '',
    store_state: '',
    store_hours: '',
    store_instagram: '',
    store_whatsapp: '',
    min_order_value: '0',
    free_shipping_above: '0',
    payment_pix_enabled: 'true',
    payment_card_enabled: 'true',
    payment_max_installments: '3',
    mp_public_key: '',
    mp_access_token: '',
};
exports.settingService = {
    async getAll() {
        const rows = await client_1.prisma.setting.findMany();
        const result = { ...DEFAULTS };
        for (const row of rows) {
            result[row.key] = row.value;
        }
        return result;
    },
    async get(key) {
        const row = await client_1.prisma.setting.findUnique({ where: { key } });
        return row?.value ?? DEFAULTS[key] ?? '';
    },
    async updateMany(data) {
        const ops = Object.entries(data).map(([key, value]) => client_1.prisma.setting.upsert({
            where: { key },
            create: { key, value: String(value) },
            update: { value: String(value) },
        }));
        await client_1.prisma.$transaction(ops);
        return this.getAll();
    },
    /** Retorna configurações públicas (sem chaves sensíveis) */
    async getPublic() {
        const all = await this.getAll();
        const { mp_access_token, ...safe } = all;
        return safe;
    },
};
//# sourceMappingURL=settingService.js.map