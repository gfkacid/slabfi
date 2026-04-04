-- Prisma still rejects JS BigInt > 2^63-1 over the wire even for UNSIGNED BIGINT; store uint64 selectors as decimal text.
ALTER TABLE `CollateralItem` MODIFY `sourceChainId` VARCHAR(32) NOT NULL;
