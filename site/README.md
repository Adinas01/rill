# web

The Rill site: a marketing landing (generative flow-field hero, how-it-works,
use cases, FAQ), a `/docs` page, and the live app (open a stream, watch it vest
per second, withdraw, cancel) wired to StreamPay on Arc.

## Run

```bash
pnpm --filter ouways-sdk build
pnpm --filter web dev
```

Network config (chain, RPC, contract, USDC) is baked into `ouways-sdk`
(`arcTestnet`) and read via `web/lib/config.ts`, so no env vars are required to
run the app against the live testnet deployment.

## Notable pieces

- `components/FlowField.tsx` the generative current behind the hero (canvas).
- `components/CreateStream.tsx` the create-stream card (framer-motion).
- `components/StreamCard.tsx` a live, per-second ticking stream.
- `app/docs/page.tsx` the documentation page.

## Deploy to Vercel

Import the repo and set **Root Directory to `web`**. `web/vercel.json` installs
the workspace and builds `ouways-sdk` before `next build`, so no other settings
are needed.
