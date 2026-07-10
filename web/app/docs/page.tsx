import Link from "next/link";
import { net } from "@/lib/config";

export const metadata = {
  title: "Rill docs",
  description: "How to use Rill: network, contract, and the ouways-sdk.",
};

const NAV = [
  { id: "overview", label: "Overview" },
  { id: "network", label: "Network" },
  { id: "install", label: "Install" },
  { id: "create", label: "Create a stream" },
  { id: "withdraw", label: "Withdraw & cancel" },
  { id: "math", label: "Stream math" },
];

export default function Docs() {
  return (
    <main className="mx-auto max-w-6xl px-5 pt-28 sm:px-8">
      <div className="grid gap-10 pb-24 lg:grid-cols-[200px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--color-muted)]">Documentation</div>
            <nav className="flex flex-col gap-1">
              {NAV.map((n) => (
                <a
                  key={n.id}
                  href={`#${n.id}`}
                  className="rounded-lg px-3 py-1.5 text-[14px] font-semibold text-[var(--color-muted)] transition-colors hover:bg-[var(--color-canvas-2)] hover:text-[var(--color-ink)]"
                >
                  {n.label}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        <article className="max-w-[68ch]">
          <h1 className="text-[clamp(2.2rem,5vw,3.4rem)] font-extrabold tracking-[-0.03em]">Docs</h1>
          <p className="mt-3 text-[17px] leading-relaxed text-[var(--color-muted)]">
            Rill is continuous USDC payment streams on Arc. A sender locks USDC that
            vests to a recipient linearly, per second, via the on-chain StreamPay
            contract.
          </p>

          <Section id="overview" title="Overview">
            <p>Three actions make up the whole protocol:</p>
            <ul>
              <li><b>Create</b> a stream: recipient, amount, and a start/stop window. The deposit is pulled into the contract.</li>
              <li><b>Withdraw</b>: the recipient pulls whatever has vested so far, at any time.</li>
              <li><b>Cancel</b>: either party ends it. Vested-but-unwithdrawn funds go to the recipient, the rest returns to the sender.</li>
            </ul>
          </Section>

          <Section id="network" title="Network">
            <Table
              rows={[
                ["Network", net.name ?? "Arc Testnet"],
                ["Chain ID", String(net.chainId)],
                ["RPC", net.rpcUrl],
                ["StreamPay", net.streamPay],
                ["USDC (ERC-20, 6 decimals)", net.usdc],
              ]}
            />
            <p>USDC is Arc&apos;s native asset; amounts are in base units (6 decimals), so <code>1000000</code> is 1 USDC.</p>
          </Section>

          <Section id="install" title="Install">
            <Code>{`pnpm add github:Adinas01/rill#path:packages/ouways-sdk viem`}</Code>
            <p>Set up viem clients against Arc:</p>
            <Code>{`import { createPublicClient, createWalletClient, http } from "viem";
import { arcTestnet, defineArcChain } from "ouways-sdk";

const chain = defineArcChain(arcTestnet);
const publicClient = createPublicClient({ chain, transport: http(arcTestnet.rpcUrl) });
const walletClient = createWalletClient({ chain, transport: http(arcTestnet.rpcUrl), account });`}</Code>
          </Section>

          <Section id="create" title="Create a stream">
            <p>Approve (handled for you) and open a stream. Returns the new stream id.</p>
            <Code>{`import { createStream, arcTestnet } from "ouways-sdk";

const now = Math.floor(Date.now() / 1000);
const { streamId } = await createStream(
  { net: arcTestnet, publicClient, walletClient, account },
  {
    recipient: "0x…",
    deposit: 10_000_000n,   // 10 USDC
    startTime: now,
    stopTime: now + 3600,   // over 1 hour
  },
);`}</Code>
          </Section>

          <Section id="withdraw" title="Withdraw & cancel">
            <Code>{`import { withdraw, cancelStream } from "ouways-sdk";

// recipient pulls a specific amount of vested USDC
await withdraw({ net: arcTestnet, publicClient, walletClient, account }, streamId, 500_000n);

// either party ends the stream and splits the balance
await cancelStream({ net: arcTestnet, publicClient, walletClient, account }, streamId);`}</Code>
          </Section>

          <Section id="math" title="Stream math">
            <p>
              The SDK mirrors the contract exactly, so a UI can tick the streamed
              value locally without an RPC call per frame.
            </p>
            <Code>{`import { readStream, streamedAt, withdrawableAt } from "ouways-sdk";

const stream = await readStream({ net: arcTestnet, publicClient }, streamId);
const now = Date.now() / 1000;
streamedAt(stream, now);       // total vested at 'now'
withdrawableAt(stream, now);   // vested minus already withdrawn`}</Code>
          </Section>

          <div className="mt-14 rounded-2xl border border-[var(--color-line)] bg-[var(--color-canvas-2)]/50 p-6">
            <p className="text-[15px] text-[var(--color-muted)]">
              Ready to try it?{" "}
              <Link href="/#app" className="font-bold text-[var(--color-mint)]">Open a stream on the app</Link>.
            </p>
          </div>
        </article>
      </div>
    </main>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mt-14 scroll-mt-24">
      <h2 className="text-[24px] font-bold tracking-tight">{title}</h2>
      <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-[var(--color-muted)] [&_b]:font-semibold [&_b]:text-[var(--color-ink)] [&_code]:mono [&_code]:rounded [&_code]:bg-[var(--color-canvas-2)] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[13px] [&_code]:text-[var(--color-ink)] [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-2">
        {children}
      </div>
    </section>
  );
}

function Code({ children }: { children: string }) {
  return (
    <pre className="mono overflow-x-auto rounded-2xl border border-[var(--color-line)] bg-[var(--color-canvas-2)]/70 p-4 text-[13px] leading-relaxed text-[var(--color-ink)]">
      {children}
    </pre>
  );
}

function Table({ rows }: { rows: [string, string][] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--color-line)]">
      <table className="w-full text-[14px]">
        <tbody className="divide-y divide-[var(--color-line)]">
          {rows.map(([k, v]) => (
            <tr key={k}>
              <td className="w-[42%] bg-[var(--color-canvas-2)]/40 px-4 py-2.5 font-semibold text-[var(--color-ink)]">{k}</td>
              <td className="mono px-4 py-2.5 text-[13px] text-[var(--color-muted)] break-all">{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
