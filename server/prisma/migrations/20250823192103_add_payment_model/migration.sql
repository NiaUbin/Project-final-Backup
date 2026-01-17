-- CreateTable
CREATE TABLE `Payment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `amount` DOUBLE NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'THB',
    `method` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `customerEmail` VARCHAR(191) NULL,
    `customerName` VARCHAR(191) NULL,
    `customerPhone` VARCHAR(191) NULL,
    `transactionId` VARCHAR(191) NOT NULL,
    `gatewayId` VARCHAR(191) NULL,
    `gatewayStatus` VARCHAR(191) NULL,
    `metadata` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `orderId` INTEGER NOT NULL,

    UNIQUE INDEX `Payment_transactionId_key`(`transactionId`),
    INDEX `Payment_orderId_fkey`(`orderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
