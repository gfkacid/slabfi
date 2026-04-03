-- CreateTable
CREATE TABLE `IndexerCursor` (
    `chainId` VARCHAR(191) NOT NULL,
    `contractKey` VARCHAR(191) NOT NULL,
    `lastBlock` BIGINT NOT NULL,
    `updatedAtUnix` BIGINT NOT NULL,

    PRIMARY KEY (`chainId`, `contractKey`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CollateralItem` (
    `id` VARCHAR(191) NOT NULL,
    `hubChainId` VARCHAR(191) NOT NULL,
    `sourceChainId` BIGINT NOT NULL,
    `collection` VARCHAR(191) NOT NULL,
    `tokenId` BIGINT NOT NULL,
    `owner` VARCHAR(191) NOT NULL,
    `status` INTEGER NOT NULL,
    `lockedAtUnix` BIGINT NOT NULL,
    `latestPriceUsd` BIGINT NULL,
    `tokenUri` TEXT NULL,
    `cardName` VARCHAR(191) NULL,
    `cardImage` TEXT NULL,

    INDEX `CollateralItem_hubChainId_owner_idx`(`hubChainId`, `owner`),
    INDEX `CollateralItem_hubChainId_collection_tokenId_idx`(`hubChainId`, `collection`, `tokenId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Position` (
    `borrower` VARCHAR(191) NOT NULL,
    `hubChainId` VARCHAR(191) NOT NULL,
    `collateralIdsJson` TEXT NOT NULL,
    `principal` BIGINT NOT NULL,
    `interestAccrued` BIGINT NOT NULL,
    `lastInterestUpdateUnix` BIGINT NOT NULL,
    `status` INTEGER NOT NULL,
    `healthFactorWad` BIGINT NULL,

    INDEX `Position_hubChainId_idx`(`hubChainId`),
    PRIMARY KEY (`borrower`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LendingPoolEvent` (
    `id` VARCHAR(191) NOT NULL,
    `hubChainId` VARCHAR(191) NOT NULL,
    `kind` VARCHAR(191) NOT NULL,
    `account` VARCHAR(191) NOT NULL,
    `amount` BIGINT NULL,
    `amount2` BIGINT NULL,
    `boolFlag` BOOLEAN NULL,
    `txHash` VARCHAR(191) NOT NULL,
    `blockNumber` BIGINT NOT NULL,
    `logIndex` INTEGER NOT NULL,
    `timestampUnix` BIGINT NOT NULL,

    INDEX `LendingPoolEvent_hubChainId_account_idx`(`hubChainId`, `account`),
    INDEX `LendingPoolEvent_hubChainId_timestampUnix_idx`(`hubChainId`, `timestampUnix`),
    UNIQUE INDEX `LendingPoolEvent_txHash_logIndex_key`(`txHash`, `logIndex`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Auction` (
    `id` VARCHAR(191) NOT NULL,
    `hubChainId` VARCHAR(191) NOT NULL,
    `borrower` VARCHAR(191) NOT NULL,
    `collateralId` VARCHAR(191) NOT NULL,
    `startedAtUnix` BIGINT NOT NULL,
    `deadlineUnix` BIGINT NOT NULL,
    `reservePrice` BIGINT NOT NULL,
    `debtShareSnapshot` BIGINT NOT NULL,
    `feeSnapshot` BIGINT NOT NULL,
    `highestBid` BIGINT NOT NULL,
    `highestBidder` VARCHAR(191) NOT NULL,
    `settled` BOOLEAN NOT NULL DEFAULT false,
    `cancelled` BOOLEAN NOT NULL DEFAULT false,

    INDEX `Auction_hubChainId_borrower_idx`(`hubChainId`, `borrower`),
    INDEX `Auction_hubChainId_settled_cancelled_idx`(`hubChainId`, `settled`, `cancelled`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Bid` (
    `id` VARCHAR(191) NOT NULL,
    `auctionId` VARCHAR(191) NOT NULL,
    `bidder` VARCHAR(191) NOT NULL,
    `amount` BIGINT NOT NULL,
    `newDeadlineUnix` BIGINT NOT NULL,
    `txHash` VARCHAR(191) NOT NULL,
    `blockNumber` BIGINT NOT NULL,
    `logIndex` INTEGER NOT NULL,
    `timestampUnix` BIGINT NOT NULL,

    INDEX `Bid_auctionId_idx`(`auctionId`),
    UNIQUE INDEX `Bid_txHash_logIndex_key`(`txHash`, `logIndex`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuctionSettlement` (
    `auctionId` VARCHAR(191) NOT NULL,
    `winner` VARCHAR(191) NOT NULL,
    `winningBid` BIGINT NOT NULL,
    `debtToPool` BIGINT NOT NULL,
    `feeToTreasury` BIGINT NOT NULL,
    `excessToPool` BIGINT NOT NULL,
    `excessToTreasury` BIGINT NOT NULL,
    `txHash` VARCHAR(191) NOT NULL,
    `timestampUnix` BIGINT NOT NULL,

    PRIMARY KEY (`auctionId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PriceRecord` (
    `id` VARCHAR(191) NOT NULL,
    `hubChainId` VARCHAR(191) NOT NULL,
    `collection` VARCHAR(191) NOT NULL,
    `tokenId` BIGINT NOT NULL,
    `priceUsd` BIGINT NOT NULL,
    `attestedAtUnix` BIGINT NOT NULL,
    `updatedAtUnix` BIGINT NOT NULL,
    `disputed` BOOLEAN NOT NULL DEFAULT false,
    `primaryPrice` BIGINT NULL,
    `secondaryPrice` BIGINT NULL,
    `deviationBps` BIGINT NULL,
    `txHash` VARCHAR(191) NOT NULL,
    `blockNumber` BIGINT NOT NULL,
    `logIndex` INTEGER NOT NULL,

    INDEX `PriceRecord_hubChainId_collection_tokenId_idx`(`hubChainId`, `collection`, `tokenId`),
    INDEX `PriceRecord_hubChainId_updatedAtUnix_idx`(`hubChainId`, `updatedAtUnix`),
    UNIQUE INDEX `PriceRecord_hubChainId_txHash_logIndex_key`(`hubChainId`, `txHash`, `logIndex`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProtocolSnapshot` (
    `id` VARCHAR(191) NOT NULL,
    `hubChainId` VARCHAR(191) NOT NULL,
    `totalAssets` BIGINT NOT NULL,
    `totalBorrows` BIGINT NOT NULL,
    `utilizationWad` BIGINT NOT NULL,
    `borrowAprBps` BIGINT NOT NULL,
    `supplyAprBps` BIGINT NOT NULL,
    `exchangeRateWad` BIGINT NOT NULL,
    `blockNumber` BIGINT NOT NULL,
    `timestampUnix` BIGINT NOT NULL,
    `totalSupplyShares` BIGINT NULL,
    `depositorCount` INTEGER NULL,
    `positionCount` INTEGER NULL,

    INDEX `ProtocolSnapshot_hubChainId_timestampUnix_idx`(`hubChainId`, `timestampUnix`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ActivityEvent` (
    `id` VARCHAR(191) NOT NULL,
    `hubChainId` VARCHAR(191) NULL,
    `sourceChainId` VARCHAR(191) NULL,
    `kind` VARCHAR(191) NOT NULL,
    `actor` VARCHAR(191) NOT NULL,
    `counterparty` VARCHAR(191) NULL,
    `amount` BIGINT NULL,
    `amount2` BIGINT NULL,
    `payloadJson` TEXT NULL,
    `txHash` VARCHAR(191) NOT NULL,
    `blockNumber` BIGINT NOT NULL,
    `logIndex` INTEGER NOT NULL,
    `timestampUnix` BIGINT NOT NULL,

    INDEX `ActivityEvent_actor_timestampUnix_idx`(`actor`, `timestampUnix`),
    UNIQUE INDEX `ActivityEvent_txHash_logIndex_kind_key`(`txHash`, `logIndex`, `kind`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Bid` ADD CONSTRAINT `Bid_auctionId_fkey` FOREIGN KEY (`auctionId`) REFERENCES `Auction`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuctionSettlement` ADD CONSTRAINT `AuctionSettlement_auctionId_fkey` FOREIGN KEY (`auctionId`) REFERENCES `Auction`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
