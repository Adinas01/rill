# ouways-sdk

SDK for Rill / StreamPay: continuous USDC payment streams on Arc. It ships the
Arc network config, the StreamPay ABI, exact client-side stream math, and
`createStream` / `withdraw` / `cancelStream` helpers over viem.

## Install

```bash
pnpm add github:Adinas01/rill#path:packages/ouways-sdk viem
```

## Create a stream

```ts
import { createStream, arcTestnet, defineArcChain } from "ouways-sdk";
import { createPublicClient, createWalletClient, http } from "viem";

const chain = defineArcChain(arcTestnet);
const publicClient = createPublicClient({ chain, transport: http(arcTestnet.rpcUrl) });
const walletClient = createWalletClient({ chain, transport: http(arcTestnet.rpcUrl), account });

const now = Math.floor(Date.now() / 1000);
const { streamId } = await createStream(
  { net: arcTestnet, publicClient, walletClient, account },
  { recipient: "0x…", deposit: 10_000_000n, startTime: now, stopTime: now + 3600 },
);
```

## Live stream math

`streamedAt` / `withdrawableAt` / `refundableAt` mirror the contract exactly, so
a UI can tick the vested value locally without an RPC call per frame.

```ts
import { readStream, streamedAt, withdrawableAt } from "ouways-sdk";

const stream = await readStream({ net: arcTestnet, publicClient }, streamId);
streamedAt(stream, Date.now() / 1000);
withdrawableAt(stream, Date.now() / 1000);
```

## Key exports

- `arcTestnet` / `defineArcChain` Arc network config and viem chain.
- `streamPayAbi` / `erc20Abi` contract ABIs.
- `createStream` / `withdraw` / `cancelStream` / `readStream` client helpers.
- `streamedAt` / `withdrawableAt` / `refundableAt` / `statusAt` / `ratePerSecond` math.

USDC on Arc uses 6 decimals; amounts are `bigint` base units (`10_000_000n` = 10 USDC).
