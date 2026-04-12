import bs58 from "bs58";
import { PublicKey } from "@solana/web3.js";

const RECEIVE_DISC = Buffer.from("57f504b0c6784698", "hex");

export type DecodedReceiveLock = {
  sourceChainSelector: number;
  collectionHex: `0x${string}`;
  tokenId: bigint;
  hubOwnerHex: `0x${string}`;
  messageDigestHex: `0x${string}`;
  collateralIdHex: `0x${string}`;
  syntheticOwnerBase58: string;
};

function readU32LE(buf: Buffer, o: number): number {
  return buf.readUInt32LE(o);
}

function readU64LE(buf: Buffer, o: number): bigint {
  return buf.readBigUInt64LE(o);
}

export function tryDecodeReceiveCrossChainLock(data: Uint8Array): DecodedReceiveLock | null {
  const buf = Buffer.from(data);
  if (buf.length < 8 + 4 + 20 + 8 + 20 + 32 + 32) return null;
  if (!buf.subarray(0, 8).equals(RECEIVE_DISC)) return null;
  let o = 8;
  const sourceChainSelector = readU32LE(buf, o);
  o += 4;
  const collection20 = buf.subarray(o, o + 20);
  o += 20;
  const tokenId = readU64LE(buf, o);
  o += 8;
  const owner20 = buf.subarray(o, o + 20);
  o += 20;
  const digest = buf.subarray(o, o + 32);
  o += 32;
  const collateralId = buf.subarray(o, o + 32);

  const hex20 = (b: Buffer) =>
    (`0x${b.toString("hex")}`) as `0x${string}`;
  const hex32 = (b: Buffer) =>
    (`0x${b.toString("hex")}`) as `0x${string}`;

  const ownPk = Buffer.alloc(32);
  owner20.copy(ownPk, 12);
  const syntheticOwnerBase58 = new PublicKey(ownPk).toBase58();

  return {
    sourceChainSelector,
    collectionHex: hex20(collection20),
    tokenId,
    hubOwnerHex: hex20(owner20),
    messageDigestHex: hex32(digest),
    collateralIdHex: hex32(collateralId),
    syntheticOwnerBase58,
  };
}

export function decodeCompiledInstructionData(dataBs58: string): Buffer {
  return Buffer.from(bs58.decode(dataBs58));
}
