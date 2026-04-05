import type { Address, PublicClient } from "viem";
import {
  COLLATERAL_REGISTRY_ABI,
  LENDING_POOL_ABI,
  ORACLE_CONSUMER_ABI,
} from "@slabfinance/shared";
import { CollateralStatus } from "@slabfinance/shared";

const WAD = 10n ** 18n;
const MAX_UINT256 = 2n ** 256n - 1n;

function mulDiv(a: bigint, b: bigint, denominator: bigint): bigint {
  return (a * b) / denominator;
}

/**
 * Mirrors `HealthFactorEngine._computePosition` + HF math (WAD) using hub RPC reads.
 * Used when the deployed engine does not expose `getHealthFactor` yet.
 */
export async function computeHubHealthFactorWad(params: {
  client: PublicClient;
  borrower: Address;
  collateralRegistry: Address;
  oracleConsumer: Address;
  lendingPool: Address;
}): Promise<bigint> {
  const { client, borrower, collateralRegistry, oracleConsumer, lendingPool } = params;

  const position = await client.readContract({
    address: collateralRegistry,
    abi: COLLATERAL_REGISTRY_ABI,
    functionName: "getPosition",
    args: [borrower],
  });

  const [, , totalDebtRaw] = await client.readContract({
    address: lendingPool,
    abi: LENDING_POOL_ABI,
    functionName: "outstandingDebt",
    args: [borrower],
  });

  if (totalDebtRaw === 0n) {
    return MAX_UINT256;
  }

  let weightedSum8 = 0n;
  for (const cid of position.collateralIds) {
    const item = await client.readContract({
      address: collateralRegistry,
      abi: COLLATERAL_REGISTRY_ABI,
      functionName: "getCollateralItem",
      args: [cid],
    });

    const st = Number(item.status);
    if (st !== CollateralStatus.ACTIVE && st !== CollateralStatus.PENDING) {
      continue;
    }

    try {
      const [price] = await client.readContract({
        address: oracleConsumer,
        abi: ORACLE_CONSUMER_ABI,
        functionName: "getPrice",
        args: [item.collection, item.tokenId],
      });
      let effectiveLTV = await client.readContract({
        address: oracleConsumer,
        abi: ORACLE_CONSUMER_ABI,
        functionName: "getEffectiveLTV",
        args: [item.collection, item.tokenId],
      });
      const inPenalty = await client.readContract({
        address: oracleConsumer,
        abi: ORACLE_CONSUMER_ABI,
        functionName: "isInStalenessPenaltyWindow",
        args: [item.collection, item.tokenId],
      });
      if (inPenalty) {
        effectiveLTV /= 2n;
      }
      weightedSum8 += (price * effectiveLTV) / 10000n;
    } catch {
      /* same as on-chain try/oracleConsumer.getPrice */
    }
  }

  const capacityRaw = mulDiv(weightedSum8, 1_000_000n, 100_000_000n);
  return mulDiv(capacityRaw, WAD, totalDebtRaw);
}
