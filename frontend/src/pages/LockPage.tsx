import { useState } from "react";
import { useAccount, useSwitchChain } from "wagmi";
import { COLLATERAL_ADAPTER_ABI } from "@slabfinance/shared";
import { useSlabCollectibles, useLockAndNotify } from "@/hooks";
import { TransactionButton } from "@/components/TransactionButton";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/Card";
import { sepolia } from "@/lib/chains";
import { CONTRACT_ADDRESSES } from "@/lib/contracts";
import { showToast } from "@/lib/toast";

export function LockPage() {
  const { address, isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const { data: nfts, isLoading: nftsLoading } = useSlabCollectibles();
  const { writeContractAsync, isPending } = useLockAndNotify();

  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const isSourceChain = chainId === sepolia.id;
  const hubOwner = address;

  const handleLock = async () => {
    if (!selectedTokenId || !hubOwner || !isSourceChain) return;

    const adapterAddr = CONTRACT_ADDRESSES.sepolia.collateralAdapter;
    if (!adapterAddr) return;

    try {
      const hash = await writeContractAsync({
        address: adapterAddr,
        abi: COLLATERAL_ADAPTER_ABI,
        functionName: "lockAndNotify",
        args: [BigInt(selectedTokenId), hubOwner],
        value: 0n,
      });
      setTxHash(hash);
      showToast({
        type: "success",
        title: "Transaction confirmed",
        message: "Your NFT has been locked and the hub has been notified.",
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
            Switch to Ethereum Sepolia to lock NFTs.
          </p>
          <button
            type="button"
            onClick={() => switchChain({ chainId: sepolia.id })}
            className="rounded-lg bg-secondary-container px-4 py-2 text-sm font-medium text-white hover:bg-secondary"
          >
            Switch to Sepolia
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Lock collateral"
        description="Select an NFT to lock as collateral. You will need to approve the NFT and pay a small CCIP fee."
      />

      {txHash && (
        <Card variant="muted" className="mb-6 border border-emerald-200/80 bg-emerald-50/90 p-4">
          <p className="font-medium text-emerald-900">Transaction submitted</p>
          <a
            href={`https://sepolia.etherscan.io/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-emerald-800 underline"
          >
            View on Etherscan
          </a>
        </Card>
      )}

      {nftsLoading ? (
        <p className="text-on-surface-variant">Loading your NFTs…</p>
      ) : nfts?.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {nfts.map((nft) => (
            <div
              key={nft.tokenId}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedTokenId(nft.tokenId)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") setSelectedTokenId(nft.tokenId);
              }}
              className={`cursor-pointer rounded-xl border-2 p-4 transition ${
                selectedTokenId === nft.tokenId
                  ? "border-slab-accent bg-secondary-fixed/30"
                  : "border-outline-variant/20 bg-surface-container-lowest hover:border-outline-variant/40"
              }`}
            >
              <div className="aspect-[3/4] overflow-hidden rounded-lg bg-surface-container-high">
                {nft.image ? (
                  <img
                    src={nft.image}
                    alt={nft.name ?? `#${nft.tokenId}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-4xl">🃏</div>
                )}
              </div>
              <p className="mt-2 font-medium text-on-surface">{nft.name ?? `Token #${nft.tokenId}`}</p>
              <p className="text-sm text-on-surface-variant">Sepolia</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-on-surface-variant">No NFTs found. Make sure you are on Ethereum Sepolia.</p>
      )}

      {selectedTokenId && (
        <div className="mt-8">
          <TransactionButton
            onClick={handleLock}
            isLoading={isPending}
            disabled={!selectedTokenId}
          >
            Lock NFT #{selectedTokenId}
          </TransactionButton>
        </div>
      )}
    </div>
  );
}
