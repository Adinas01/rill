# Contributing

Thanks for your interest in Rill.

## Layout

- `contracts/` Foundry project (Solidity 0.8.30, OpenZeppelin) for StreamPay.
- `packages/ouways-sdk/` the SDK (stream math + create/withdraw/cancel helpers).
- `web/` the Next.js app.

## Before opening a PR

- Contracts: `cd contracts && forge test` must pass.
- SDK: `pnpm --filter ouways-sdk build` must pass with no type errors.
- Keep commits small and focused, with plain English messages.
- No secrets in the tree. Network params and keys live in gitignored `.env`
  files, never committed.

## Reporting issues

Use the issue templates. Include the network, addresses, and a reproduction
where possible.
