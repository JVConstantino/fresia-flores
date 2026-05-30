interface CartItem {
    productId: number;
    price: number;
    qty: number;
}
interface DiscountedItem extends CartItem {
    originalPrice: number;
    discountedPrice: number;
    promotionName?: string;
    promotionDiscount: number;
}
export declare const discountService: {
    calculateDiscounts(items: CartItem[]): Promise<{
        items: DiscountedItem[];
        totalPromotionDiscount: number;
    }>;
};
export {};
//# sourceMappingURL=discountService.d.ts.map