-- CCIP chain selectors are uint64 and can exceed signed BIGINT (2^63-1).
ALTER TABLE `CollateralItem` MODIFY `sourceChainId` BIGINT UNSIGNED NOT NULL;
