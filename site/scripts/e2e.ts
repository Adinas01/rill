/**
 * Real end-to-end run against the LIVE StreamPay deployment on Arc testnet.
 * Creates a short USDC stream, watches it vest, withdraws, then cancels.
 *
 *   pnpm e2e            # from site/, with PRIVATE_KEY in the environment
 *
 * Env: PRIVATE_KEY, a USDC-funded account on Arc.
 */
import { createPublicClient, createWalletClient, http, formatUnits, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import {
  arcTestnet,
  defineArcChain,
  createStream,
  withdraw,
  cancelStream,
  readStream,
  streamedAt,
  streamPayAbi,
  type StreamClientConfig,
} from "../lib/stream";

const u6 = (n: bigint) => formatUnits(n, 6);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const pk = process.env.PRIVATE_KEY as Hex | undefined;
  if (!pk) throw new Error("PRIVATE_KEY required (source .env)");
  const account = privateKeyToAccount(pk);
  const chain = defineArcChain(arcTestnet);
  const publicClient = createPublicClient({ chain, transport: http(arcTestnet.rpcUrl) });
  const walletClient = createWalletClient({ account, chain, transport: http(arcTestnet.rpcUrl) });
  const cfg: StreamClientConfig = { net: arcTestnet, publicClient, walletClient, account };

  console.log(`sender/recipient: ${account.address}`);

  const now = Math.floor(Date.now() / 1000);
  const deposit = 1_000_000n; // 1 USDC
  const startTime = now;
  const stopTime = now + 30; // 30s stream

  console.log(`\ncreating stream: 1 USDC over 30s ...`);
  const { approveTx, createTx, streamId } = await createStream(cfg, {
    recipient: account.address,
    deposit,
    startTime,
    stopTime,
  });
  if (approveTx) console.log(`approve tx: ${approveTx}`);
  console.log(`create tx:  ${createTx}`);
  console.log(`stream id:  ${streamId}`);

  const stream = await readStream(cfg, streamId);
  console.log(`deposit=${u6(stream.deposit)} start=${stream.startTime} stop=${stream.stopTime}`);

  console.log(`\nwatching it vest:`);
  for (let i = 0; i < 3; i++) {
    await sleep(3000);
    const onchain = await publicClient.readContract({
      address: arcTestnet.streamPay,
      abi: streamPayAbi,
      functionName: "streamedAmount",
      args: [streamId],
    });
    const local = streamedAt(stream, Math.floor(Date.now() / 1000));
    console.log(`  t+${(i + 1) * 3}s  on-chain=${u6(onchain)} USDC  local-estimate=${u6(local)} USDC`);
  }

  const vested = await publicClient.readContract({
    address: arcTestnet.streamPay,
    abi: streamPayAbi,
    functionName: "withdrawableOf",
    args: [streamId],
  });
  console.log(`\nwithdrawing vested ${u6(vested)} USDC ...`);
  const wTx = await withdraw(cfg, streamId, vested);
  await publicClient.waitForTransactionReceipt({ hash: wTx });
  console.log(`withdraw tx: ${wTx}`);

  console.log(`\ncancelling stream (reclaim remainder) ...`);
  const cTx = await cancelStream(cfg, streamId);
  await publicClient.waitForTransactionReceipt({ hash: cTx });
  console.log(`cancel tx: ${cTx}`);

  console.log(`\nOK: created, vested, withdrew, and cancelled a real stream on Arc testnet.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
