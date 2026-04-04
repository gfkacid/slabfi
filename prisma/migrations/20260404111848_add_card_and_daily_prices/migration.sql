-- AlterTable
ALTER TABLE `CollateralItem` ADD COLUMN `cardId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `Card` (
    `id` VARCHAR(191) NOT NULL,
    `collection` VARCHAR(191) NOT NULL,
    `tokenId` BIGINT NOT NULL,
    `cardName` VARCHAR(191) NOT NULL,
    `cardImage` TEXT NOT NULL,
    `setName` VARCHAR(191) NULL,
    `cardNumber` VARCHAR(191) NULL,
    `cardRarity` VARCHAR(191) NULL,
    `cardPrinting` VARCHAR(191) NULL,
    `gradeService` VARCHAR(191) NULL,
    `grade` INTEGER NULL,
    `pricechartingId` VARCHAR(191) NULL,
    `tier` INTEGER NOT NULL DEFAULT 1,
    `ltvBps` INTEGER NOT NULL DEFAULT 5000,
    `latestPriceUsdc` BIGINT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Card_collection_tokenId_key`(`collection`, `tokenId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CardDailyPrice` (
    `id` VARCHAR(191) NOT NULL,
    `cardId` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL,
    `priceUsdc` BIGINT NOT NULL,
    `source` VARCHAR(191) NOT NULL DEFAULT 'pricecharting',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `CardDailyPrice_cardId_date_idx`(`cardId`, `date`),
    UNIQUE INDEX `CardDailyPrice_cardId_date_key`(`cardId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `CollateralItem_cardId_idx` ON `CollateralItem`(`cardId`);

-- AddForeignKey
ALTER TABLE `CardDailyPrice` ADD CONSTRAINT `CardDailyPrice_cardId_fkey` FOREIGN KEY (`cardId`) REFERENCES `Card`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CollateralItem` ADD CONSTRAINT `CollateralItem_cardId_fkey` FOREIGN KEY (`cardId`) REFERENCES `Card`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
