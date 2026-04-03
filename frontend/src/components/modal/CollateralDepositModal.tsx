import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { erc721Abi, formatUnits } from "viem";
import {
  useAccount,
  useChainId,
  usePublicClient,
  useReadContract,
  useSwitchChain,
  useWriteContract,
} from "wagmi";
import { COLLATERAL_ADAPTER_ABI } from "@slabfinance/shared";
import { BaseModal } from "@/components/modal/BaseModal";
import { TransactionButton } from "@/components/TransactionButton";
import { useLockAndNotify } from "@/hooks/useCollateralAdapter";
import {
  isPricingApiConfigured,
  maxBorrowUsdFromValuation,
  useCardValuations,
  type CardValuation,
} from "@/hooks/useCardValuations";
import {
  formatHealthFactor,
  useHubExistingCollateral,
  useHubOutstandingTotal,
  usePreviewHealthFactorOnHub,
} from "@/hooks/useHubDepositPreview";
import { useSepoliaSlabCollectibles } from "@/hooks/useSepoliaSlabCollectibles";
import { Icon } from "@/components/ui/Icon";
import { sepolia } from "@/lib/chains";
import { CONTRACT_ADDRESSES } from "@/lib/contracts";
import { hubChain, hubContracts } from "@/lib/hub";
import { showToast } from "@/lib/toast";
import { COLLATERAL_REGISTRY_ABI } from "@slabfinance/shared";

type CollateralDepositModalProps = {
  onClose: () => void;
};

function formatUsd(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function gradeChip(nft: { cardRarity?: string; cardPrinting?: string }): string {
  const g = [nft.cardRarity, nft.cardPrinting].filter(Boolean).join(" · ");
  return g || "Card";
}

function centsToWad(cents: number): bigint {
  return BigInt(Math.round(cents * 10 ** 16));
}

const MAX_UINT256 = 2n ** 256n - 1n;

function hfToBarPercent(hf: bigint | undefined): number | null {
  if (hf === undefined || hf === MAX_UINT256) return null;
  const n = Number(hf) / 1e18;
  if (!Number.isFinite(n)) return null;
  return Math.min(100, Math.max(0, (n / 5) * 100));
}

type ChainTab = "all" | "sepolia" | "polygon";

export function CollateralDepositModal({ onClose }: CollateralDepositModalProps) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const sepoliaClient = usePublicClient({ chainId: sepolia.id });
  const { data: nfts, isLoading: nftsLoading } = useSepoliaSlabCollectibles(true);
  const valuationQueries = useCardValuations(nfts, true);
  const apiConfigured = isPricingApiConfigured();

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"name" | "price">("price");
  const [chainTab, setChainTab] = useState<ChainTab>("all");
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [locking, setLocking] = useState(false);

  const collectionAddr = CONTRACT_ADDRESSES.sepolia.slabFinanceCollectible;
  const adapterAddr = CONTRACT_ADDRESSES.sepolia.collateralAdapter;

  const { data: existing, isLoading: existingLoading } = useHubExistingCollateral(isConnected);
  const { data: debtTuple } = useHubOutstandingTotal(isConnected);
  const totalDebtWad = debtTuple?.[2];

  const { data: availableCredit } = useReadContract({
    chainId: hubChain.id,
    address: isConnected && hubContracts.collateralRegistry ? hubContracts.collateralRegistry : undefined,
    abi: COLLATERAL_REGISTRY_ABI,
    functionName: "availableCredit",
    args: address && isConnected && hubContracts.collateralRegistry ? [address] : undefined,
  });

  const nftIndexByToken = useMemo(() => {
    const m = new Map<string, number>();
    (nfts ?? []).forEach((nft, i) => m.set(nft.tokenId, i));
    return m;
  }, [nfts]);

  const valuationByTokenId = useMemo(() => {
    const map = new Map<string, CardValuation | null>();
    (nfts ?? []).forEach((nft, i) => {
      map.set(nft.tokenId, valuationQueries[i]?.data ?? null);
    });
    return map;
  }, [nfts, valuationQueries]);

  const filteredSorted = useMemo(() => {
    const list = [...(nfts ?? [])];
    const q = search.trim().toLowerCase();
    const filtered = q
      ? list.filter(
          (n) =>
            n.name.toLowerCase().includes(q) ||
            n.tokenId.includes(q) ||
            (n.setName?.toLowerCase().includes(q) ?? false)
        )
      : list;

    const priced = (id: string) => {
      const v = valuationByTokenId.get(id);
      return v ? maxBorrowUsdFromValuation(v) : 0;
    };

    filtered.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      return priced(b.tokenId) - priced(a.tokenId);
    });
    return filtered;
  }, [nfts, search, sort, valuationByTokenId]);

  const chainFiltered = useMemo(() => {
    if (chainTab === "polygon") return [];
    return filteredSorted;
  }, [chainTab, filteredSorted]);

  const selectedList = useMemo(() => {
    return (nfts ?? []).filter((n) => selected.has(n.tokenId));
  }, [nfts, selected]);

  const selectedValuations = useMemo(() => {
    return selectedList.map((n) => valuationByTokenId.get(n.tokenId) ?? null);
  }, [selectedList, valuationByTokenId]);

  const newCollateralUsd = useMemo(() => {
    let s = 0;
    for (const v of selectedValuations) {
      if (v) s += v.priceUSD / 100;
    }
    return s;
  }, [selectedValuations]);

  const newBorrowUsd = useMemo(() => {
    let s = 0;
    for (const v of selectedValuations) {
      if (v) s += maxBorrowUsdFromValuation(v);
    }
    return s;
  }, [selectedValuations]);

  const existingCollateralUsd = useMemo(() => {
    if (!existing?.valuesWad.length) return 0;
    return existing.valuesWad.reduce((acc, w) => acc + Number(formatUnits(w, 18)), 0);
  }, [existing]);

  const mergedAfter = useMemo(() => {
    const values = [...(existing?.valuesWad ?? [])];
    const tiers = [...(existing?.tiers ?? [])];
    selectedList.forEach((nft, i) => {
      const v = selectedValuations[i];
      if (!v) return;
      values.push(centsToWad(v.priceUSD));
      const t = v.tier >= 1 && v.tier <= 3 ? v.tier : 2;
      tiers.push(t);
    });
    return { valuesWad: values as readonly bigint[], tiers: tiers as readonly number[] };
  }, [existing, selectedList, selectedValuations]);

  const mergedCurrent = useMemo(() => {
    return {
      valuesWad: existing?.valuesWad ?? [],
      tiers: existing?.tiers ?? [],
    };
  }, [existing]);

  const unpricedSelected =
    apiConfigured && selectedList.some((_, i) => selectedValuations[i] === null);

  const hfEngineConfigured = !!hubContracts.healthFactorEngine;

  const currentHf = usePreviewHealthFactorOnHub(
    mergedCurrent.valuesWad,
    mergedCurrent.tiers,
    totalDebtWad,
    isConnected && hfEngineConfigured && totalDebtWad !== undefined
  );

  const afterHf = usePreviewHealthFactorOnHub(
    mergedAfter.valuesWad,
    mergedAfter.tiers,
    totalDebtWad,
    isConnected &&
      hfEngineConfigured &&
      totalDebtWad !== undefined &&
      selectedList.length > 0 &&
      !unpricedSelected
  );

  const canDeposit =
    selectedList.length > 0 &&
    !unpricedSelected &&
    !!address &&
    !!adapterAddr &&
    !!collectionAddr;

  const toggle = useCallback((tokenId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(tokenId)) next.delete(tokenId);
      else next.add(tokenId);
      return next;
    });
  }, []);

  const { writeContractAsync: lockWrite, isPending: lockPending } = useLockAndNotify();
  const { writeContractAsync: erc721Write, isPending: approvePending } = useWriteContract();

  const handleDeposit = async () => {
    if (!canDeposit || !address || !adapterAddr || !collectionAddr || !sepoliaClient) return;

    try {
      setLocking(true);
      if (chainId !== sepolia.id) {
        if (switchChainAsync) {
          await switchChainAsync({ chainId: sepolia.id });
        } else {
          showToast({
            type: "error",
            title: "Wrong network",
            message: "Switch to Ethereum Sepolia in your wallet, then try again.",
          });
          return;
        }
      }

      const approved = await sepoliaClient.readContract({
        address: collectionAddr,
        abi: erc721Abi,
        functionName: "isApprovedForAll",
        args: [address, adapterAddr],
      });

      if (!approved) {
        await erc721Write({
          address: collectionAddr,
          abi: erc721Abi,
          functionName: "setApprovalForAll",
          args: [adapterAddr, true],
        });
      }

      for (const nft of selectedList) {
        await lockWrite({
          address: adapterAddr,
          abi: COLLATERAL_ADAPTER_ABI,
          functionName: "lockAndNotify",
          args: [BigInt(nft.tokenId), address],
          value: 0n,
        });
      }

      showToast({
        type: "success",
        title: "Deposit transactions sent",
        message:
          "Cards are locking on Sepolia and CCIP will notify the hub. Check the dashboard for PENDING → ACTIVE status.",
      });
      setSelected(new Set());
      onClose();
    } catch (err) {
      console.error(err);
      showToast({
        type: "error",
        title: "Deposit failed",
        message: err instanceof Error ? err.message : "Could not complete deposit. Try again.",
        tag: "Wallet",
      });
    } finally {
      setLocking(false);
    }
  };

  const debtUsd =
    totalDebtWad !== undefined ? Number(formatUnits(totalDebtWad, 18)) : undefined;
  const creditUsd =
    availableCredit !== undefined ? Number(formatUnits(availableCredit, 18)) : undefined;
  const creditAfter =
    creditUsd !== undefined ? creditUsd + newBorrowUsd : undefined;

  const currentHfPct = hfToBarPercent(currentHf.data);
  const afterHfPct = hfToBarPercent(afterHf.data);
  const fillPct =
    selectedList.length > 0 && !unpricedSelected
      ? afterHfPct ?? currentHfPct ?? 0
      : currentHfPct ?? 0;
  const markerPct = currentHfPct;
  const currentHfNum =
    currentHf.data !== undefined && currentHf.data !== MAX_UINT256
      ? Number(currentHf.data) / 1e18
      : null;
  const afterHfNum =
    afterHf.data !== undefined && afterHf.data !== MAX_UINT256
      ? Number(afterHf.data) / 1e18
      : null;
  const showTrendUp =
    currentHfNum !== null &&
    afterHfNum !== null &&
    Number.isFinite(currentHfNum) &&
    Number.isFinite(afterHfNum) &&
    afterHfNum > currentHfNum;

  return (
    <BaseModal
      open
      onClose={onClose}
      title="Deposit Collateral"
      panelClassName="flex max-h-[min(90vh,900px)] w-full max-w-6xl flex-col"
      bodyClassName="flex min-h-0 flex-1 flex-col overflow-hidden bg-surface p-0"
    >
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Stitch: main deposit column — filters + card grid */}
        <div className="min-h-0 flex-1 overflow-y-auto border-b border-outline-variant/15 p-6 lg:border-b-0 lg:border-r lg:pr-8">
          {!isConnected ? (
            <p className="text-sm font-medium text-on-surface-variant">
              Connect your wallet to see eligible NFTs on Ethereum Sepolia and deposit them as
              collateral.
            </p>
          ) : (
            <p className="mb-8 text-sm font-medium text-on-surface-variant">
              Select assets from your connected wallets to increase your borrowing capacity.
            </p>
          )}

          {isConnected && !apiConfigured ? (
            <div className="mb-6 rounded-xl border border-amber-200/80 bg-amber-50/90 px-3 py-2 text-xs text-amber-950">
              <strong className="font-bold">Pricing API not set.</strong> Set{" "}
              <code className="rounded bg-white/80 px-1">VITE_EXTERNAL_PRICE_API_BASE</code> for
              live valuations. You can still lock cards; borrow previews stay approximate.
            </div>
          ) : null}

          {isConnected && apiConfigured ? (
            <div className="mb-6 rounded-xl border border-outline-variant/30 bg-surface-container-low px-3 py-2 text-xs text-on-surface-variant">
              Cards without a price cannot be deposited until the pricing service returns data.
            </div>
          ) : null}

          {isConnected ? (
            <>
              <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap gap-3">
                  {(
                    [
                      { id: "all" as const, label: "All Chains" },
                      { id: "sepolia" as const, label: "Sepolia" },
                      { id: "polygon" as const, label: "Polygon" },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      disabled={tab.id === "polygon"}
                      onClick={() => setChainTab(tab.id)}
                      className={`rounded-xl px-5 py-2 text-sm font-bold shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                        chainTab === tab.id
                          ? "bg-primary text-on-primary"
                          : "bg-surface-container-low font-semibold text-on-surface-variant hover:bg-surface-container-high"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-on-surface-variant">
                  <span>Sort by:</span>
                  <div className="relative">
                    <select
                      value={sort}
                      onChange={(e) => setSort(e.target.value as "name" | "price")}
                      className="cursor-pointer appearance-none rounded-lg border-0 bg-transparent pr-6 font-bold text-primary outline-none focus:ring-0"
                      aria-label="Sort cards"
                    >
                      <option value="price">Market Price</option>
                      <option value="name">Name</option>
                    </select>
                    <Icon
                      name="expand_more"
                      className="pointer-events-none absolute right-0 top-1/2 !text-lg -translate-y-1/2 text-primary"
                      aria-hidden
                    />
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <input
                  type="search"
                  placeholder="Search by name or token ID…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full max-w-md rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-2.5 text-sm font-medium text-primary outline-none ring-secondary focus:ring-2"
                />
              </div>
            </>
          ) : null}

          {!isConnected ? null : nftsLoading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[1, 2, 3, 4].map((k) => (
                <div key={k} className="h-72 animate-pulse rounded-xl bg-surface-container" aria-hidden />
              ))}
            </div>
          ) : chainTab === "polygon" ? (
            <p className="text-sm font-medium text-on-surface-variant">
              No assets on Polygon in this build. Switch to Sepolia or All Chains.
            </p>
          ) : chainFiltered.length === 0 ? (
            <p className="text-sm font-medium text-on-surface-variant">
              You don&apos;t own any eligible card NFTs on Sepolia in this collection, or nothing
              matches your search.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {chainFiltered.map((nft) => {
                const v = valuationByTokenId.get(nft.tokenId);
                const priced = !!v;
                const qi = nftIndexByToken.get(nft.tokenId);
                const loadingV =
                  apiConfigured && qi !== undefined ? valuationQueries[qi]?.isLoading : false;
                const isSel = selected.has(nft.tokenId);
                const canSelect = !apiConfigured || priced;

                return (
                  <article
                    key={nft.tokenId}
                    role="button"
                    tabIndex={canSelect ? 0 : -1}
                    onClick={() => canSelect && toggle(nft.tokenId)}
                    onKeyDown={(e) => {
                      if (!canSelect) return;
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggle(nft.tokenId);
                      }
                    }}
                    className={`group relative rounded-xl p-4 transition-all duration-300 ${
                      isSel
                        ? "bg-surface-container-lowest ring-2 ring-secondary ring-offset-4 ring-offset-surface"
                        : "border border-transparent bg-surface-container-lowest hover:border-outline-variant/30 hover:shadow-lg"
                    } ${canSelect ? "cursor-pointer" : "cursor-not-allowed opacity-80"}`}
                  >
                    <div className="absolute right-6 top-6 z-10">
                      {isSel ? (
                        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-secondary">
                          <Icon name="check" className="!text-lg text-white" aria-hidden />
                        </div>
                      ) : (
                        <div
                          className={`h-6 w-6 rounded-md border-2 border-outline-variant bg-surface-container-lowest transition-colors ${
                            canSelect ? "group-hover:border-secondary" : ""
                          }`}
                        />
                      )}
                    </div>
                    <div className="mb-4 aspect-[3/4] overflow-hidden rounded-lg bg-surface-container">
                      {nft.image ? (
                        <img
                          src={nft.image}
                          alt=""
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-4xl">🃏</div>
                      )}
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-headline font-bold text-primary">{nft.name}</h3>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <span className="rounded bg-surface-container-high px-1.5 py-0.5 text-[10px] font-bold text-on-surface-variant">
                              {gradeChip(nft)}
                            </span>
                            <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold uppercase text-slate-700">
                              {sepolia.name}
                            </span>
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-xs font-semibold text-on-surface-variant">Market Price</p>
                          {loadingV ? (
                            <p className="mt-0.5 animate-pulse text-sm text-on-surface-variant">…</p>
                          ) : v ? (
                            <p className="font-bold text-primary">{formatUsd(v.priceUSD / 100)}</p>
                          ) : apiConfigured ? (
                            <p className="text-xs font-bold text-error">N/A</p>
                          ) : (
                            <p className="text-xs text-on-surface-variant">—</p>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 border-t border-outline-variant/15 pt-3">
                        <div>
                          <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                            LTV
                          </p>
                          {loadingV ? (
                            <p className="animate-pulse text-sm">…</p>
                          ) : v ? (
                            <p className="text-sm font-bold text-primary">{v.ltvBPS / 100}%</p>
                          ) : (
                            <p className="text-sm font-bold text-on-surface-variant">—</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                            Max Borrow
                          </p>
                          {loadingV ? (
                            <p className="animate-pulse text-sm">…</p>
                          ) : v ? (
                            <p className="text-sm font-bold text-primary">
                              {formatUsd(maxBorrowUsdFromValuation(v))}
                            </p>
                          ) : (
                            <p className="text-sm font-bold text-on-surface-variant">—</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {/* Stitch: preview column — matches overlay “Collateral Deposit Preview” panel */}
        <aside className="flex w-full shrink-0 flex-col bg-surface-container-lowest p-6 lg:w-[380px] lg:border-l lg:border-outline-variant/10">
          <h4 className="mb-6 font-headline text-xl font-extrabold text-primary">
            Collateral Deposit Preview
          </h4>

          {unpricedSelected ? (
            <p className="mb-4 rounded-xl bg-error-container/40 px-3 py-2 text-[11px] font-medium text-error">
              One or more selected cards have no price — remove them or wait for pricing.
            </p>
          ) : null}

          <div className="mb-6 space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              Selected Assets ({selectedList.length})
            </p>
            <div className="space-y-2">
              {selectedList.length === 0 ? (
                <p className="rounded-xl bg-surface-container-low p-3 text-sm text-on-surface-variant">
                  None selected
                </p>
              ) : (
                selectedList.map((nft) => {
                  const v = valuationByTokenId.get(nft.tokenId);
                  return (
                    <div
                      key={nft.tokenId}
                      className="flex items-center justify-between rounded-xl bg-surface-container-low p-3"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="h-12 w-10 shrink-0 overflow-hidden rounded bg-surface-container">
                          {nft.image ? (
                            <img src={nft.image} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full items-center justify-center text-lg">🃏</div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-primary">{nft.name}</p>
                          <p className="text-[10px] font-bold text-on-surface-variant">
                            {sepolia.name} • {gradeChip(nft)}
                          </p>
                        </div>
                      </div>
                      <p className="shrink-0 pl-2 text-sm font-bold text-primary">
                        {v ? formatUsd(v.priceUSD / 100) : "—"}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-emerald-700/20 bg-emerald-950 p-4">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400/90">
                New Collateral Value
              </p>
              <p className="font-headline text-xl font-extrabold text-emerald-300">
                +{formatUsd(newCollateralUsd)}
              </p>
            </div>
            <div className="rounded-2xl border border-secondary-fixed-dim/30 bg-secondary-container p-4">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-on-primary/80">
                New Borrow Capacity
              </p>
              <p className="font-headline text-xl font-extrabold text-on-primary">
                +{formatUsd(newBorrowUsd)}
              </p>
            </div>
          </div>

          <div className="mb-4 space-y-1.5 border-t border-outline-variant/15 pt-4 text-[11px] text-on-surface-variant">
            <div className="flex justify-between gap-2 font-medium">
              <span>Total collateral (est.)</span>
              <span className="text-right font-bold tabular-nums text-primary">
                {formatUsd(existingCollateralUsd + newCollateralUsd)}
                <span className="ml-1 font-normal">(was {formatUsd(existingCollateralUsd)})</span>
              </span>
            </div>
            <div className="flex justify-between gap-2 font-medium">
              <span>Total debt</span>
              <span className="font-bold tabular-nums text-primary">
                {debtUsd !== undefined ? formatUsd(debtUsd) : existingLoading ? "…" : "—"}
              </span>
            </div>
            <div className="flex justify-between gap-2 font-medium">
              <span>Available credit (est.)</span>
              <span className="text-right font-bold tabular-nums text-primary">
                {creditAfter !== undefined ? formatUsd(creditAfter) : "—"}
                {creditUsd !== undefined ? (
                  <span className="ml-1 font-normal">(was {formatUsd(creditUsd)})</span>
                ) : null}
              </span>
            </div>
          </div>

          <div className="mb-6 space-y-4 rounded-2xl bg-surface-container-low p-5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-bold text-on-surface">Health Factor Preview</p>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-on-surface-variant">
                  {formatHealthFactor(currentHf.data)}
                </span>
                {showTrendUp ? (
                  <Icon name="trending_up" className="!text-lg text-secondary" aria-hidden />
                ) : null}
                {selectedList.length > 0 && !unpricedSelected ? (
                  <span className="text-sm font-bold text-tertiary-fixed-dim">
                    {formatHealthFactor(afterHf.data)}
                  </span>
                ) : null}
              </div>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-surface-container-highest">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-error via-tertiary-fixed-dim to-tertiary-fixed shadow-[0_0_8px_rgba(74,222,128,0.35)] transition-all"
                style={{ width: `${fillPct}%` }}
              />
              {markerPct !== null ? (
                <div
                  className="absolute -inset-y-0.5 w-1 -translate-x-1/2 rounded-full bg-white shadow-sm ring-2 ring-primary/20"
                  style={{ left: `${markerPct}%` }}
                />
              ) : null}
            </div>
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
              <span>Liquidation Risk</span>
              <span>Safe Zone</span>
            </div>
            <p className="text-[10px] text-on-surface-variant">
              On-chain <code className="rounded bg-surface-container-high px-1">previewHealthFactor</code>{" "}
              on {hubChain.name}.
              {!hfEngineConfigured ? " Configure hub contracts for live values." : ""}
            </p>
          </div>

          <div className="mt-auto space-y-3">
            <TransactionButton
              onClick={() => void handleDeposit()}
              disabled={!canDeposit || locking || lockPending || approvePending}
              isLoading={locking || lockPending || approvePending}
              className="w-full justify-center gap-2 rounded-2xl bg-primary py-4 font-headline text-lg font-bold text-on-primary shadow-lg shadow-primary/20 hover:bg-primary-container active:scale-[0.98]"
            >
              <span>
                {selectedList.length
                  ? `Deposit ${selectedList.length} Card${selectedList.length === 1 ? "" : "s"}`
                  : "Select cards to deposit"}
              </span>
              <Icon name="double_arrow" className="!text-xl text-on-primary" aria-hidden />
            </TransactionButton>
            <p className="text-center text-[10px] font-medium text-on-surface-variant">
              Executes on Sepolia (approve adapter if needed, then lock per card).{" "}
              <Link to="/lock" className="font-bold text-secondary hover:underline" onClick={onClose}>
                Open full lock page
              </Link>
            </p>
          </div>
        </aside>
      </div>
    </BaseModal>
  );
}
