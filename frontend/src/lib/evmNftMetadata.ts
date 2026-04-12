/** Resolve `ipfs://…` and `ar://…` to an HTTP gateway URL for `<img src>`. */
export function resolveTokenUri(uri: string): string {
  const u = uri.trim();
  if (u.startsWith("ipfs://")) {
    const path = u.slice("ipfs://".length);
    return `https://ipfs.io/ipfs/${path}`;
  }
  if (u.startsWith("ar://")) {
    return `https://arweave.net/${u.slice("ar://".length)}`;
  }
  return u;
}

export type TokenUriJson = {
  name?: string;
  title?: string;
  image?: string;
  animation_url?: string;
};

export function parseTokenUriJson(raw: string): TokenUriJson | null {
  try {
    let base = raw.trim();
    if (base.startsWith("data:application/json;base64,")) {
      const b64 = base.slice("data:application/json;base64,".length);
      base = typeof atob === "function" ? atob(b64) : "";
    } else if (base.startsWith("data:application/json,")) {
      base = decodeURIComponent(base.slice("data:application/json,".length));
    }
    return JSON.parse(base) as TokenUriJson;
  } catch {
    return null;
  }
}
