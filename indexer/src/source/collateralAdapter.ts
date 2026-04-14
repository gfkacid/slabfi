import type { PrismaClient } from "@prisma/client";
import { getAddress } from "viem";
import { protocolConfig, COLLATERAL_ADAPTER_VIEW_ABI } from "@slabfinance/shared";
import type { PublicClient } from "viem";
import type { DecodedEventLog } from "../utils/poller.js";

export async function handleCollateralAdapterDecoded(params: {
  prisma: PrismaClient;
  client: PublicClient;
  sourceChainId: string;
  decoded: DecodedEventLog[];
  blockTs: (bn: bigint) => Promise<bigint>;
}): Promise<void> {
  const { prisma, client, sourceChainId, decoded, blockTs } = params;

  for (const ev of decoded) {
    const bn = ev.blockNumber!;
    const ts = await blockTs(bn);
    const tx = ev.transactionHash!;
    const logIndex = ev.logIndex!;
    const args = ev.args as Record<string, unknown>;

    if (ev.eventName === "Locked") {
      const owner = String(args.owner).toLowerCase();
      const adapterAddr = getAddress(ev.address);
      let collection = "";
      let chainSelector = sourceChainId;
      try {
        collection = getAddress(
          (await client.readContract({
            address: adapterAddr,
            abi: COLLATERAL_ADAPTER_VIEW_ABI,
            functionName: "collection",
          })) as `0x${string}`,
        );
        const sel = await client.readContract({
          address: adapterAddr,
          abi: COLLATERAL_ADAPTER_VIEW_ABI,
          functionName: "chainSelector",
        });
        chainSelector = String(sel);
      } catch {
        const src = Object.values(protocolConfig.evmSources).find(
          (s) => String(s.chainId) === sourceChainId,
        );
        collection = (src?.contracts.collection || "").trim().toLowerCase();
      }

      const msgId = args.ccipMessageId as `0x${string}` | undefined;
      await prisma.activityEvent.upsert({
        where: { txHash_logIndex_kind: { txHash: tx, logIndex, kind: "AdapterLocked" } },
        create: {
          sourceChainId,
          kind: "AdapterLocked",
          actor: owner,
          amount: args.tokenId as bigint,
          payloadJson: JSON.stringify({
            ccipMessageId: msgId,
            tokenId: String(args.tokenId as bigint),
            adapter: adapterAddr.toLowerCase(),
            collection,
            chainSelector,
            relayed: false,
          }),
          txHash: tx,
          blockNumber: bn,
          logIndex,
          timestampUnix: ts,
        },
        update: {},
      });
    }

    if (ev.eventName === "Unlocked") {
      const recipient = String(args.recipient).toLowerCase();
      await prisma.activityEvent.upsert({
        where: { txHash_logIndex_kind: { txHash: tx, logIndex, kind: "AdapterUnlocked" } },
        create: {
          sourceChainId,
          kind: "AdapterUnlocked",
          actor: recipient,
          amount: args.tokenId as bigint,
          txHash: tx,
          blockNumber: bn,
          logIndex,
          timestampUnix: ts,
        },
        update: {},
      });
    }
  }
}
