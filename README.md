# Rill

[![License: MIT](https://img.shields.io/badge/license-MIT-3ddc97.svg)](LICENSE)

Continuous USDC payment streams on Arc. Lock USDC once and it vests to the
recipient linearly, every second, instead of arriving as a lump sum. Built for
payroll, vesting, and grants, where the money should move at the same rate the
work does.

Because USDC is the native asset on Arc, a stream is a single asset end to end:
no separate gas token, no wrapping, no bridge.

## How it works

- A sender opens a stream: recipient, USDC amount, and a start/stop window.
- The deposit vests linearly per second. The recipient can withdraw whatever
  has vested at any time.
- Either party can cancel: vested-but-unwithdrawn funds go to the recipient, the
  remainder returns to the sender.

The contract uses a deposit/start/stop model and computes the streamed amount
exactly, so no dust is stranded by per-second rounding.

## Layout

```
contract/          Foundry: StreamPay.sol + tests + deploy script
site/              Next.js app (Rill site + docs) and lib/stream, the
                   network config, StreamPay ABI, and client + math helpers
deployments/       recorded on-chain addresses
```

## Live deployment

Deployed and settling real streams on Arc testnet (chain `5042002`):

| | |
|---|---|
| StreamPay | `0xd981229808c89e1689e025E7c5367d1154F1899D` |
| USDC (ERC-20, 6 decimals) | `0x3600000000000000000000000000000000000000` |
| RPC | `https://rpc.testnet.arc.network` |

## Run

```bash
# contract (needs Foundry)
cd contract && forge install foundry-rs/forge-std OpenZeppelin/openzeppelin-contracts && forge test

# app + stream helpers (needs pnpm)
cd site && pnpm install
pnpm dev            # the app on :3000
pnpm test           # stream-math tests

# a real end-to-end stream against the live deployment (PRIVATE_KEY in env)
pnpm e2e
```
