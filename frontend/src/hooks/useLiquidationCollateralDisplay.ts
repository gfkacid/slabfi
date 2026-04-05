import { useMemo } from "react";
import { collateralCatalogPresentation } from "@/lib/collateralDisplay";
import { useCatalogCollateralItem } from "@/hooks/useCollateralCatalog";
import { useCollateralItem } from "@/hooks/useCollateralRegistry";

function shortHexId(hex: string) {
  if (!hex || hex.length < 14) return hex;
  return `${hex.slice(0, 6)}…${hex.slice(-4)}`;
}

/**
 * Card imagery + titles aligned with the Assets catalog when the API lists this collateral;
 * otherwise falls back to on-chain token id or collateral id hex.
 */
export function useLiquidationCollateralDisplay(collateralId: `0x${string}`) {
  const catalogItem = useCatalogCollateralItem(collateralId);
  const { data: chainItem } = useCollateralItem(collateralId);

  return useMemo(() => {
    const p = catalogItem ? collateralCatalogPresentation(catalogItem) : null;
    const chainTokenId = chainItem?.tokenId;
    const fallbackTitle =
      chainTokenId !== undefined ? `Token #${chainTokenId.toString()}` : shortHexId(collateralId);
    const title = p?.title ?? fallbackTitle;
    const imageUrl = p?.imageUrl;
    const imageAlt = p?.imageAlt ?? title;
    return {
      hasCatalog: p != null,
      title,
      imageUrl,
      imageAlt,
      subtitle: p?.subtitle,
      gradeLine: p?.gradeLine ?? null,
      valuation: p?.valuation ?? null,
      ltvPercentLabel: p?.ltvPercentLabel ?? null,
    };
  }, [catalogItem, chainItem, collateralId]);
}
