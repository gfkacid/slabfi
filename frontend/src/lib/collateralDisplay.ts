import type { CollateralItemJson } from "@/lib/api";
import { formatCardGradeDisplay } from "@/lib/hubFormat";

/** Resolved card title: merged catalog `card` first, then root fields from API. */
export function collateralDisplayTitle(c: CollateralItemJson): string {
  return (c.card?.cardName ?? c.cardName)?.trim() || `Token #${c.tokenId}`;
}

/** Artwork URL when present; no synthetic fallback URLs. */
export function collateralDisplayImageUrl(c: CollateralItemJson): string | undefined {
  const url = (c.card?.cardImage ?? c.cardImage)?.trim();
  return url || undefined;
}

/** Secondary line: set / cert number, else short collection + token id. */
export function collateralDisplaySubtitle(c: CollateralItemJson): string {
  const card = c.card;
  const parts = [
    card?.setName?.trim(),
    card?.cardNumber?.trim() ? `#${card.cardNumber.trim()}` : null,
  ].filter(Boolean) as string[];
  if (parts.length) return parts.join(" · ");
  const col = c.collection?.trim();
  if (col.length > 10) return `${col.slice(0, 8)}… · #${c.tokenId}`;
  if (col) return `${col} · #${c.tokenId}`;
  return `#${c.tokenId}`;
}

/** Grade service + grade, or tier label; null when nothing to show. */
export function collateralDisplayGradeOrTierLine(c: CollateralItemJson): string | null {
  const card = c.card;
  if (card?.gradeService != null && card.grade != null) {
    return `${card.gradeService} ${formatCardGradeDisplay(card.grade)}`;
  }
  if (card?.tier != null) return `Tier ${card.tier}`;
  return null;
}
