# Rill

[![License: MIT](https://img.shields.io/badge/license-MIT-3ddc97.svg)](LICENSE)

**Continuous USDC payment streams on Arc.** Lock USDC once and it vests to the
recipient linearly, every second, instead of landing as a lump sum. Rill is
built for the money that should move at the same rate the work does: payroll,
vesting, and grants.

Because USDC is the native asset on Arc, a stream is a single asset end to end.
There is no separate gas token, no wrapping, and no bridge, the thing you stream
is the thing you pay fees in.

## Why streams

A salary paid monthly, a grant paid up front, or tokens that unlock on a cliff
all share the same problem: the money and the work move at different speeds. The
recipient waits, or the payer takes on risk by paying ahead. A stream removes the
gap. Value accrues continuously, the recipient can draw it whenever they like,
and the payer can stop it the moment circumstances change.

## How it works

1. **Open a stream.** A sender picks a recipient, an amount, and a start/stop
   window. The full deposit is pulled into the `StreamPay` contract up front.
2. **It vests per second.** The balance flows to the recipient linearly across
   the window. At any moment the recipient can withdraw whatever has vested.
3. **Withdraw or cancel.** The recipient pulls vested funds on demand. Either
   party can cancel: vested-but-unwithdrawn funds go to the recipient, and the
   remainder returns to the sender.

The contract uses a `deposit / start / stop` model rather than a stored
per-second rate, and computes the streamed amount as
`deposit * elapsed / duration`. That means the math is exact and no dust is
stranded by per-second rounding.

## Contract interface

`StreamPay` (`contract/src/StreamPay.sol`) is a single, unowned contract, no
factory, no proxy, no admin keys.

| Function | Who | What |
|---|---|---|
| `createStream(recipient, token, deposit, startTime, stopTime)` | sender | pulls `deposit` and opens a stream, returns its id |
| `withdraw(streamId, amount)` | recipient | withdraws up to the vested, un-withdrawn balance |
| `cancelStream(streamId)` | either party | ends the stream and splits the balance by what has streamed |
| `streamedAmount(streamId)` | view | amount vested at the current block |
| `withdrawableOf(streamId)` | view | recipient's currently withdrawable balance |
| `senderBalanceOf(streamId)` | view | sender's currently refundable balance |
| `getStream(streamId)` | view | the full stream record |

It is a `ReentrancyGuard` and uses `SafeERC20` for all token movement.

## Usage

The client helpers and stream math live in [`site/lib/stream`](site/lib/stream)
(network config, the ABI, and typed viem wrappers). Open a stream:

```ts
import { createStream, arcTestnet } from "@/lib/stream";

const now = Math.floor(Date.now() / 1000);
const { streamId } = await createStream(
  { net: arcTestnet, publicClient, walletClient, account },
  { recipient: "0x…", deposit: 10_000_000n, startTime: now, stopTime: now + 3600 },
);
```

Withdraw or cancel:

```ts
import { withdraw, cancelStream, arcTestnet } from "@/lib/stream";

await withdraw({ net: arcTestnet, publicClient, walletClient, account }, streamId, 500_000n);
await cancelStream({ net: arcTestnet, publicClient, walletClient, account }, streamId);
```

`streamedAt`, `withdrawableAt`, and `refundableAt` mirror the contract exactly,
so a UI can tick the vested figure locally without an RPC call per frame, that is
how the live streams on the site update every 200ms.

## Live deployment

Deployed and settling real streams on Arc testnet (chain `5042002`). See
[`deployments/arc-testnet.json`](deployments/arc-testnet.json).

| | |
|---|---|
| StreamPay | `0xd981229808c89e1689e025E7c5367d1154F1899D` |
| USDC (ERC-20, 6 decimals) | `0x3600000000000000000000000000000000000000` |
| RPC | `https://rpc.testnet.arc.network` |

## Layout

```
contract/          Foundry: StreamPay.sol, tests, and the deploy script
site/              Next.js app (landing, docs, live streams)
  lib/stream/      network config, ABI, client helpers, and stream math
  scripts/e2e.ts   a real end-to-end run against the live deployment
deployments/       recorded on-chain addresses
```

## Run

```bash
# contract (needs Foundry)
cd contract && forge install foundry-rs/forge-std OpenZeppelin/openzeppelin-contracts
forge test

# app + stream helpers (needs pnpm)
cd site && pnpm install
pnpm dev            # the app on :3000
pnpm test           # stream-math tests

# a real end-to-end stream against the live deployment (PRIVATE_KEY in env)
pnpm e2e
```

## Disclaimer

This is experimental software on a testnet and has not been audited. Do not use
it with funds you are not prepared to lose.
