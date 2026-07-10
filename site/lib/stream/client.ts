import {
  type Account,
  type Address,
  type Hex,
  type PublicClient,
  type WalletClient,
} from "viem";
import { erc20Abi, streamPayAbi } from "./abi";
import type { ArcNetwork } from "./network";
import type { Stream } from "./stream";

export interface StreamClientConfig {
  net: ArcNetwork;
  publicClient: PublicClient;
  walletClient?: WalletClient;
  account?: Account | Address;
}

/** Read a stream and normalize its numeric fields. */
export async function readStream(
  cfg: StreamClientConfig,
  streamId: bigint,
): Promise<Stream> {
  const s = await cfg.publicClient.readContract({
    address: cfg.net.streamPay,
    abi: streamPayAbi,
    functionName: "getStream",
    args: [streamId],
  });
  return {
    sender: s.sender,
    recipient: s.recipient,
    deposit: s.deposit,
    withdrawn: s.withdrawn,
    startTime: Number(s.startTime),
    stopTime: Number(s.stopTime),
    token: s.token,
  };
}

function requireWallet(cfg: StreamClientConfig): {
  wallet: WalletClient;
  account: Account | Address;
} {
  if (!cfg.walletClient || !cfg.account) throw new Error("walletClient and account required");
  return { wallet: cfg.walletClient, account: cfg.account };
}

/**
 * Approve (if needed) and create a stream of `deposit` USDC to `recipient`
 * between `startTime` and `stopTime` (unix seconds). Returns the tx hashes and
 * the new stream id parsed from the receipt.
 */
export async function createStream(
  cfg: StreamClientConfig,
  params: { recipient: Address; deposit: bigint; startTime: number; stopTime: number },
): Promise<{ approveTx?: Hex; createTx: Hex; streamId: bigint }> {
  const { wallet, account } = requireWallet(cfg);
  const owner = (typeof account === "string" ? account : account.address) as Address;

  const allowance = await cfg.publicClient.readContract({
    address: cfg.net.usdc,
    abi: erc20Abi,
    functionName: "allowance",
    args: [owner, cfg.net.streamPay],
  });

  let approveTx: Hex | undefined;
  if (allowance < params.deposit) {
    approveTx = await wallet.writeContract({
      account,
      chain: wallet.chain,
      address: cfg.net.usdc,
      abi: erc20Abi,
      functionName: "approve",
      args: [cfg.net.streamPay, params.deposit],
    });
    await cfg.publicClient.waitForTransactionReceipt({ hash: approveTx });
  }

  const createTx = await wallet.writeContract({
    account,
    chain: wallet.chain,
    address: cfg.net.streamPay,
    abi: streamPayAbi,
    functionName: "createStream",
    args: [
      params.recipient,
      cfg.net.usdc,
      params.deposit,
      params.startTime,
      params.stopTime,
    ],
  });
  const receipt = await cfg.publicClient.waitForTransactionReceipt({ hash: createTx });

  // nextStreamId was incremented; the new id is the previous value.
  const next = await cfg.publicClient.readContract({
    address: cfg.net.streamPay,
    abi: streamPayAbi,
    functionName: "nextStreamId",
    args: [],
    blockNumber: receipt.blockNumber,
  });
  return { approveTx, createTx, streamId: next - 1n };
}

export async function withdraw(
  cfg: StreamClientConfig,
  streamId: bigint,
  amount: bigint,
): Promise<Hex> {
  const { wallet, account } = requireWallet(cfg);
  return wallet.writeContract({
    account,
    chain: wallet.chain,
    address: cfg.net.streamPay,
    abi: streamPayAbi,
    functionName: "withdraw",
    args: [streamId, amount],
  });
}

export async function cancelStream(cfg: StreamClientConfig, streamId: bigint): Promise<Hex> {
  const { wallet, account } = requireWallet(cfg);
  return wallet.writeContract({
    account,
    chain: wallet.chain,
    address: cfg.net.streamPay,
    abi: streamPayAbi,
    functionName: "cancelStream",
    args: [streamId],
  });
}
