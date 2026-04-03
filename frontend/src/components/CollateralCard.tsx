import { StatusBadge } from "./StatusBadge";
import { formatUnits } from "viem";

interface CollateralCardProps {
  collateralId: `0x${string}`;
  tokenId: bigint;
  collection: `0x${string}`;
  status: number;
  priceUSD?: bigint;
  imageUrl?: string;
  name?: string;
}

const PRICE_DECIMALS = 8;

export function CollateralCard({
  tokenId,
  collection,
  status,
  priceUSD,
  imageUrl,
  name,
}: CollateralCardProps) {
  void collection;
  const priceFormatted =
    priceUSD !== undefined
      ? `$${Number(formatUnits(priceUSD, PRICE_DECIMALS)).toFixed(2)}`
      : "—";

  return (
    <div className="overflow-hidden rounded-xl border border-outline-variant/10 bg-surface-container-lowest shadow-slab transition-all hover:shadow-slab-md">
      <div className="relative h-36 overflow-hidden bg-surface-container-high sm:h-40">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name ?? `Token #${tokenId}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400">
            <span className="text-4xl">🃏</span>
          </div>
        )}
        <div className="absolute right-2 top-2">
          <StatusBadge status={status} />
        </div>
      </div>
      <div className="bg-surface-low/50 p-3">
        <p className="text-[8px] font-bold uppercase text-secondary">CardFi</p>
        <p className="truncate text-xs font-bold text-on-surface">
          {name ?? `Token #${tokenId}`}
        </p>
        <p className="mt-0.5 text-xs font-extrabold text-primary">{priceFormatted}</p>
      </div>
    </div>
  );
}
