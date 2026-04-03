import type { PrismaClient } from "@prisma/client";
import type { DecodedEventLog } from "../utils/poller.js";

const ZERO = "0x0000000000000000000000000000000000000000";

export async function handleAuctionManagerDecoded(params: {
  prisma: PrismaClient;
  hubChainId: string;
  decoded: DecodedEventLog[];
  blockTs: (bn: bigint) => Promise<bigint>;
}): Promise<void> {
  const { prisma, hubChainId, decoded, blockTs } = params;

  for (const ev of decoded) {
    const bn = ev.blockNumber!;
    const ts = await blockTs(bn);
    const tx = ev.transactionHash!;
    const logIndex = ev.logIndex!;
    const args = ev.args as Record<string, unknown>;

    if (ev.eventName === "AuctionQueued") {
      const auctionId = String(args.auctionId).toLowerCase() as `0x${string}`;
      const borrower = String(args.borrower).toLowerCase();
      const collateralId = String(args.collateralId).toLowerCase() as `0x${string}`;
      await prisma.auction.upsert({
        where: { id: auctionId },
        create: {
          id: auctionId,
          hubChainId,
          borrower,
          collateralId,
          startedAtUnix: ts,
          deadlineUnix: args.deadline as bigint,
          reservePrice: args.reservePrice as bigint,
          debtShareSnapshot: args.debtShareSnapshot as bigint,
          feeSnapshot: 0n,
          highestBid: 0n,
          highestBidder: ZERO,
          settled: false,
          cancelled: false,
        },
        update: {
          deadlineUnix: args.deadline as bigint,
          reservePrice: args.reservePrice as bigint,
          debtShareSnapshot: args.debtShareSnapshot as bigint,
        },
      });
      await prisma.activityEvent.upsert({
        where: { txHash_logIndex_kind: { txHash: tx, logIndex, kind: "AuctionQueued" } },
        create: {
          hubChainId,
          kind: "AuctionQueued",
          actor: borrower,
          counterparty: auctionId,
          txHash: tx,
          blockNumber: bn,
          logIndex,
          timestampUnix: ts,
        },
        update: {},
      });
    }

    if (ev.eventName === "BidPlaced") {
      const auctionId = String(args.auctionId).toLowerCase();
      const bidder = String(args.bidder).toLowerCase();
      const amount = args.amount as bigint;
      const newDeadline = args.newDeadline as bigint;
      await prisma.bid.upsert({
        where: { txHash_logIndex: { txHash: tx, logIndex } },
        create: {
          auctionId,
          bidder,
          amount,
          newDeadlineUnix: newDeadline,
          txHash: tx,
          blockNumber: bn,
          logIndex,
          timestampUnix: ts,
        },
        update: {},
      });
      await prisma.auction.update({
        where: { id: auctionId },
        data: {
          highestBid: amount,
          highestBidder: bidder,
          deadlineUnix: newDeadline,
        },
      });
      await prisma.activityEvent.upsert({
        where: { txHash_logIndex_kind: { txHash: tx, logIndex, kind: "BidPlaced" } },
        create: {
          hubChainId,
          kind: "BidPlaced",
          actor: bidder,
          counterparty: auctionId,
          amount,
          txHash: tx,
          blockNumber: bn,
          logIndex,
          timestampUnix: ts,
        },
        update: {},
      });
    }

    if (ev.eventName === "AuctionSettled") {
      const auctionId = String(args.auctionId).toLowerCase();
      const winner = String(args.winner).toLowerCase();
      await prisma.auction.update({
        where: { id: auctionId },
        data: { settled: true, highestBidder: winner, highestBid: args.winningBid as bigint },
      });
      await prisma.auctionSettlement.upsert({
        where: { auctionId },
        create: {
          auctionId,
          winner,
          winningBid: args.winningBid as bigint,
          debtToPool: args.debtToPool as bigint,
          feeToTreasury: args.feeToTreasury as bigint,
          excessToPool: args.excessToPool as bigint,
          excessToTreasury: args.excessToTreasury as bigint,
          txHash: tx,
          timestampUnix: ts,
        },
        update: {
          winner,
          winningBid: args.winningBid as bigint,
          debtToPool: args.debtToPool as bigint,
          feeToTreasury: args.feeToTreasury as bigint,
          excessToPool: args.excessToPool as bigint,
          excessToTreasury: args.excessToTreasury as bigint,
          txHash: tx,
          timestampUnix: ts,
        },
      });
      await prisma.activityEvent.upsert({
        where: { txHash_logIndex_kind: { txHash: tx, logIndex, kind: "AuctionSettled" } },
        create: {
          hubChainId,
          kind: "AuctionSettled",
          actor: winner,
          counterparty: auctionId,
          amount: args.winningBid as bigint,
          txHash: tx,
          blockNumber: bn,
          logIndex,
          timestampUnix: ts,
        },
        update: {},
      });
    }

    if (ev.eventName === "AuctionCancelled") {
      const auctionId = String(args.auctionId).toLowerCase();
      await prisma.auction.update({
        where: { id: auctionId },
        data: { cancelled: true },
      });
      await prisma.activityEvent.upsert({
        where: { txHash_logIndex_kind: { txHash: tx, logIndex, kind: "AuctionCancelled" } },
        create: {
          hubChainId,
          kind: "AuctionCancelled",
          actor: auctionId,
          txHash: tx,
          blockNumber: bn,
          logIndex,
          timestampUnix: ts,
        },
        update: {},
      });
    }

    if (ev.eventName === "BidRefunded") {
      const auctionId = String(args.auctionId).toLowerCase();
      const bidder = String(args.bidder).toLowerCase();
      await prisma.activityEvent.upsert({
        where: { txHash_logIndex_kind: { txHash: tx, logIndex, kind: "BidRefunded" } },
        create: {
          hubChainId,
          kind: "BidRefunded",
          actor: bidder,
          counterparty: auctionId,
          amount: args.amount as bigint,
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
