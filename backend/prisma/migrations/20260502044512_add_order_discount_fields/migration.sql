-- AlterTable
ALTER TABLE `order` ADD COLUMN `couponId` INTEGER NULL,
    ADD COLUMN `discount` DECIMAL(10, 2) NULL,
    ADD COLUMN `paymentMethod` VARCHAR(191) NOT NULL DEFAULT 'card';

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_couponId_fkey` FOREIGN KEY (`couponId`) REFERENCES `Coupon`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
