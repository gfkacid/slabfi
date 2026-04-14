import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { keccak_256 } from "@noble/hashes/sha3";
import { hubProgramsFromConfig } from "@slabfinance/shared";

const RECEIVE_CROSS_CHAIN_LOCK_DISC = Buffer.from("57f504b0c6784698", "hex");
const ORACLE_SET_PRICE_DISC = Buffer.from("fca8031a9bd5143f", "hex");
const WHITELIST_COLLECTION_DISC = Buffer.from("8db4e6db1ddb815f", "hex");

function programId(): PublicKey {
  return new PublicKey(hubProgramsFromConfig().slabHub);
}

export function syntheticPubkeyFromEvmAddress(addr: string): PublicKey {
  const hex = addr.replace(/^0x/i, "").toLowerCase();
  if (hex.length !== 40) throw new Error("Invalid EVM address");
  const buf = Buffer.alloc(32);
  buf.write(hex, 12, "hex");
  return new PublicKey(buf);
}

/** Solidity `keccak256(abi.encodePacked(uint64 chainSel, address collection, uint256 tokenId))`. */
export function collateralIdEvmPacked(
  sourceChainSelector: bigint,
  collection: string,
  tokenId: bigint,
): `0x${string}` {
  const col = collection.replace(/^0x/i, "").toLowerCase();
  if (col.length !== 40) throw new Error("Invalid collection address");
  const u64 = Buffer.allocUnsafe(8);
  u64.writeBigUInt64BE(BigInt.asUintN(64, sourceChainSelector), 0);
  const addr = Buffer.from(col, "hex");
  const tidHex = BigInt.asUintN(256, tokenId).toString(16).padStart(64, "0");
  const u256 = Buffer.from(tidHex, "hex");
  const packed = Buffer.concat([u64, addr, u256]);
  const hash = keccak_256(packed);
  return `0x${Buffer.from(hash).toString("hex")}` as `0x${string}`;
}

function u32le(n: number): Buffer {
  const b = Buffer.allocUnsafe(4);
  b.writeUInt32LE(n >>> 0, 0);
  return b;
}

function u64le(n: bigint): Buffer {
  const b = Buffer.allocUnsafe(8);
  b.writeBigUInt64LE(n, 0);
  return b;
}

function hexToBytes32(h: string): Buffer {
  const hex = h.replace(/^0x/i, "");
  if (hex.length !== 64) throw new Error("Expected 32-byte hex");
  return Buffer.from(hex, "hex");
}

function evmAddrToBytes20(addr: string): Buffer {
  const hex = addr.replace(/^0x/i, "").toLowerCase();
  if (hex.length !== 40) throw new Error("Invalid EVM address");
  return Buffer.from(hex, "hex");
}

export function receiveCrossChainLockIx(params: {
  router: PublicKey;
  payer: PublicKey;
  sourceChainSelector: number;
  collection: string;
  tokenId: bigint;
  hubOwner: string;
  messageDigest: string;
  collateralId: string;
}): TransactionInstruction {
  const pid = programId();
  const [hubConfig] = PublicKey.findProgramAddressSync([Buffer.from("hub_config")], pid);
  const digestBuf = hexToBytes32(params.messageDigest);
  const [replay] = PublicKey.findProgramAddressSync([Buffer.from("replay"), digestBuf], pid);
  const colIdBuf = hexToBytes32(params.collateralId);
  const [collateral] = PublicKey.findProgramAddressSync([Buffer.from("item"), colIdBuf], pid);
  const owner20 = evmAddrToBytes20(params.hubOwner);
  const synthetic = syntheticPubkeyFromEvmAddress(params.hubOwner);
  const [position] = PublicKey.findProgramAddressSync(
    [Buffer.from("pos"), synthetic.toBuffer()],
    pid,
  );

  const collection20 = evmAddrToBytes20(params.collection);
  const data = Buffer.concat([
    RECEIVE_CROSS_CHAIN_LOCK_DISC,
    u32le(params.sourceChainSelector),
    collection20,
    u64le(params.tokenId),
    owner20,
    digestBuf,
    colIdBuf,
  ]);

  const keys = [
    { pubkey: params.router, isSigner: true, isWritable: false },
    { pubkey: hubConfig, isSigner: false, isWritable: false },
    { pubkey: replay, isSigner: false, isWritable: true },
    { pubkey: params.payer, isSigner: true, isWritable: true },
    { pubkey: synthetic, isSigner: false, isWritable: false },
    { pubkey: collateral, isSigner: false, isWritable: true },
    { pubkey: position, isSigner: false, isWritable: true },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
  ];

  return new TransactionInstruction({
    keys,
    programId: pid,
    data,
  });
}

/** Same accounts as Anchor `OracleSetPrice` (oracle pays rent for new price PDA). */
export function oracleSetPriceIx(params: {
  oracleAuthority: PublicKey;
  collectionMint: PublicKey;
  tokenId: bigint;
  priceUsd8d: bigint;
  tier: number;
}): TransactionInstruction {
  const pid = programId();
  const [hubConfig] = PublicKey.findProgramAddressSync([Buffer.from("hub_config")], pid);
  const tidBuf = Buffer.allocUnsafe(8);
  tidBuf.writeBigUInt64LE(params.tokenId, 0);
  const [price] = PublicKey.findProgramAddressSync(
    [Buffer.from("price"), params.collectionMint.toBuffer(), tidBuf],
    pid,
  );
  const data = Buffer.concat([
    ORACLE_SET_PRICE_DISC,
    u64le(params.tokenId),
    u64le(params.priceUsd8d),
    Buffer.from([params.tier & 0xff]),
  ]);
  return new TransactionInstruction({
    programId: pid,
    keys: [
      { pubkey: params.oracleAuthority, isSigner: true, isWritable: true },
      { pubkey: hubConfig, isSigner: false, isWritable: false },
      { pubkey: params.collectionMint, isSigner: false, isWritable: false },
      { pubkey: price, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  });
}

/** `whitelist_collection` — synthetic `collection_mint` is the 32-byte pubkey with the EVM address in bytes 12..31. */
export function whitelistCollectionIx(params: {
  admin: PublicKey;
  collectionMint: PublicKey;
  kind: number;
}): TransactionInstruction {
  const pid = programId();
  const [hubConfig] = PublicKey.findProgramAddressSync([Buffer.from("hub_config")], pid);
  const [whitelist] = PublicKey.findProgramAddressSync(
    [Buffer.from("wl"), params.collectionMint.toBuffer()],
    pid,
  );
  const data = Buffer.concat([WHITELIST_COLLECTION_DISC, Buffer.from([params.kind & 0xff])]);
  return new TransactionInstruction({
    programId: pid,
    keys: [
      { pubkey: params.admin, isSigner: true, isWritable: true },
      { pubkey: hubConfig, isSigner: false, isWritable: false },
      { pubkey: params.collectionMint, isSigner: false, isWritable: false },
      { pubkey: whitelist, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  });
}

export async function sendVersionedTx(
  conn: Connection,
  feePayer: Keypair,
  signers: Keypair[],
  instructions: TransactionInstruction[],
): Promise<string> {
  const { blockhash, lastValidBlockHeight } = await conn.getLatestBlockhash("confirmed");
  const msg = new TransactionMessage({
    payerKey: feePayer.publicKey,
    recentBlockhash: blockhash,
    instructions,
  }).compileToV0Message();
  const tx = new VersionedTransaction(msg);
  tx.sign(signers);
  const sig = await conn.sendTransaction(tx, {
    skipPreflight: false,
    maxRetries: 3,
  });
  await conn.confirmTransaction(
    { signature: sig, blockhash, lastValidBlockHeight },
    "confirmed",
  );
  return sig;
}
