import { useState } from "react";
import { useAccount, useChainId, usePublicClient, useSwitchChain } from "wagmi";
import { COLLATERAL_ADAPTER_ABI } from "@slabfinance/shared";
import { useSlabCollectibles, useLockAndNotify } from "@/hooks";
import { TransactionButton } from "@/components/TransactionButton";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/Card";
import { baseMainnet, evmAppChains, polygonMainnet } from "@/lib/chains";
import { LAYERZERO_SCAN_URL, ccipMessageIdFromLockReceipt } from "@/lib/ccipLock";
import { contractsForChainId } from "@/lib/contracts";
import { showToast } from "@/lib/toast";

const configuredChainIds = new Set(evmAppChains.map((c) => c.id));

function explorerTxUrl(chainId: number, txHash: string): string {
  if (chainId === polygonMainnet.id) return `https://polygonscan.com/tx/${txHash}`;
  if (chainId === baseMainnet.id) return `https://basescan.org/tx/${txHash}`;
  return `https://etherscan.io/tx/${txHash}`;
}

export function LockPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const lockClient = usePublicClient({
    chainId: chainId as (typeof polygonMainnet)["id"] | (typeof baseMainnet)["id"],
  });
  const { switchChain } = useSwitchChain();
  const { data: nfts, isLoading: nftsLoading } = useSlabCollectibles();
  const { writeContractAsync, isPending } = useLockAndNotify();

  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const isSourceChain = configuredChainIds.has(
    chainId as (typeof polygonMainnet)["id"] | (typeof baseMainnet)["id"],
  );
  const hubOwner = address;
  const adapterAddr = contractsForChainId(chainId)?.collateralAdapter;

  const handleLock = async () => {
    if (!selectedTokenId || !hubOwner || !isSourceChain || !lockClient || !adapterAddr) return;
    if (adapterAddr === "0x0000000000000000000000000000000000000000") return;

    try {
      let lzFee = 0n;
      try {
        lzFee = await lockClient.readContract({
          address: adapterAddr,
          abi: COLLATERAL_ADAPTER_ABI,
          functionName: "quoteCcipFee",
          args: [BigInt(selectedTokenId), hubOwner],
        });
      } catch {
        // Older adapters without `quoteCcipFee` rely on native gas pre-funded on the contract.
      }
      const hash = await writeContractAsync({
        address: adapterAddr,
        abi: COLLATERAL_ADAPTER_ABI,
        functionName: "lockAndNotify",
        args: [BigInt(selectedTokenId), hubOwner],
        value: lzFee,
      });
      setTxHash(hash);
      const receipt = await lockClient.waitForTransactionReceipt({ hash });
      const lzGuid = ccipMessageIdFromLockReceipt(receipt, adapterAddr, COLLATERAL_ADAPTER_ABI);
      const track =
        lzGuid != null
          ? `LayerZero message: ${lzGuid.slice(0, 10)}…${lzGuid.slice(-8)}. Track at ${LAYERZERO_SCAN_URL} — hub updates after delivery on Solana.`
          : `NFT locked. Track the cross-chain message on ${LAYERZERO_SCAN_URL}.`;
      showToast({
        type: "success",
        title: "Lock submitted",
        message: track,
      });
    } catch (err) {
      console.error(err);
      showToast({
        type: "error",
        title: "Transaction failed",
        message:
          err instanceof Error ? err.message : "Could not complete lock and notify. Try again.",
        tag: "Wallet",
        actions: [{ label: "Try again", onClick: () => { void handleLock(); } }],
      });
    }
  };

  if (!isConnected) {
    return (
      <div className="mx-auto max-w-4xl">
        <PageHeader title="Lock collateral" />
        <Card variant="muted" className="border border-amber-200/80 bg-amber-50/90 p-6 text-center">
          <p className="text-sm font-medium text-amber-900">Connect your wallet to lock collateral.</p>
        </Card>
      </div>
    );
  }

  if (!isSourceChain) {
    return (
      <div className="mx-auto max-w-4xl">
        <PageHeader title="Lock collateral" />
        <Card variant="muted" className="border border-amber-200/80 bg-amber-50/90 p-6 text-center">
          <p className="mb-4 text-sm font-medium text-amber-900">
            Switch to Polygon or Base (where your Courtyard / Beezie NFTs live) to lock.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => switchChain({ chainId: polygonMainnet.id })}
              className="rounded-lg bg-secondary-container px-4 py-2 text-sm font-medium text-white hover:bg-secondary"
            >
              Switch to Polygon
            </button>
            <button
              type="button"
              onClick={() => switchChain({ chainId: baseMainnet.id })}
              className="rounded-lg bg-secondary-container px-4 py-2 text-sm font-medium text-white hover:bg-secondary"
            >
              Switch to Base
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Lock collateral"
        description="Select an NFT to lock as collateral. You will need to approve the NFT and pay a small LayerZero messaging fee."
      />

      {txHash && (
        <Card variant="muted" className="mb-6 border border-emerald-200/80 bg-emerald-50/90 p-4">
          <p className="font-medium text-emerald-900">Transaction submitted</p>
          <a
            href={explorerTxUrl(chainId, txHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-emerald-800 underline"
          >
            View on block explorer
          </a>
        </Card>
      )}

      {nftsLoading ? (
        <p className="text-on-surface-variant">Loading your NFTs…</p>
      ) : nfts?.length ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {nfts.map((nft) => (
            <button
              key={nft.tokenId}
              type="button"
              onClick={() => setSelectedTokenId(nft.tokenId)}
              className={`rounded-xl border p-4 text-left transition-colors ${
                selectedTokenId === nft.tokenId
                  ? "border-primary bg-primary-container/30"
                  : "border-outline-variant/30 bg-surface-container-lowest hover:bg-surface-container-low"
              }`}
            >
              <p className="font-bold text-primary">{nft.name}</p>
              <p className="text-xs text-on-surface-variant">Token #{nft.tokenId}</p>
            </button>
          ))}
        </div>
      ) : (
        <Card variant="muted" className="p-6">
          <p className="text-sm text-on-surface-variant">
            No NFTs found in the configured collection for this wallet on this chain.
          </p>
        </Card>
      )}

      <div className="mt-8">
        <TransactionButton
          disabled={!selectedTokenId || !adapterAddr || adapterAddr === "0x0000000000000000000000000000000000000000"}
          isLoading={isPending}
          onClick={() => void handleLock()}
        >
          Lock selected NFT
        </TransactionButton>
      </div>
    </div>
  );
}
