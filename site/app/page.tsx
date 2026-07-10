"use client";

import { useCallback, useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { CreateStream } from "@/components/CreateStream";
import { StreamCard } from "@/components/StreamCard";
import { FlowField } from "@/components/FlowField";
import { Faq, HowItWorks, Reveal, SiteFooter, UseCases } from "@/components/marketing";
import { net } from "@/lib/config";

const KEY = "rill.streams";
const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

export default function Home() {
  const { isConnected } = useAccount();
  const [ids, setIds] = useState<bigint[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setIds((JSON.parse(raw) as string[]).map(BigInt));
    } catch {
      /* ignore */
    }
  }, []);

  const persist = useCallback((next: bigint[]) => {
    setIds(next);
    localStorage.setItem(KEY, JSON.stringify(next.map((n) => n.toString())));
  }, []);
  const add = useCallback((id: bigint) => persist([id, ...ids.filter((x) => x !== id)]), [ids, persist]);
  const remove = useCallback((id: bigint) => persist(ids.filter((x) => x !== id)), [ids, persist]);

  return (
    <main>
      {/* Hero, pulled up behind the sticky nav so the current runs full-bleed */}
      <section className="relative -mt-[60px] overflow-hidden">
        <div className="absolute inset-0">
          <FlowField />
        </div>
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, transparent 42%, var(--color-canvas) 97%), radial-gradient(120% 80% at 50% -10%, transparent 40%, color-mix(in oklch, var(--color-canvas) 55%, transparent))",
          }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl px-5 pb-16 pt-[128px] sm:px-8 sm:pb-24 sm:pt-[168px]">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-1 text-[12px] font-semibold text-[var(--color-mint)] backdrop-blur">
              <span className="pulse h-1.5 w-1.5 rounded-full bg-[var(--color-mint)]" />
              Live on {net.name}
            </div>
            <h1 className="text-balance text-[clamp(2.8rem,8vw,5.5rem)] font-extrabold leading-[0.92] tracking-[-0.04em]">
              Money that moves
              <br />
              like a <span className="value-gradient">current</span>.
            </h1>
            <p className="mt-6 max-w-[46ch] text-[17px] font-medium leading-relaxed text-[var(--color-muted)] sm:text-[19px]">
              Rill streams USDC by the second on Arc. Lock it once and it flows to
              the recipient continuously, payroll, vesting, and grants that arrive
              like water, not in lump sums.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <a
                href="#app"
                className="btn mint-glow rounded-full bg-[var(--color-mint)] px-6 py-3 text-[15px] font-bold text-[var(--color-canvas)]"
              >
                Open a stream
              </a>
              <a
                href="#how"
                className="btn rounded-full border border-[var(--color-line)] px-6 py-3 text-[15px] font-bold text-[var(--color-ink)] hover:border-[var(--color-mint)]"
              >
                How it works
              </a>
            </div>
          </div>
        </div>
      </section>

      <HowItWorks />
      <UseCases />

      {/* Try it: the live app */}
      <section id="app" className="scroll-mt-20 border-t border-[var(--color-line)]">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
          <Reveal>
            <div className="mb-3 text-[13px] font-bold uppercase tracking-[0.14em] text-[var(--color-mint)]">Try it live</div>
            <h2 className="max-w-[20ch] text-[clamp(2rem,4.5vw,3.2rem)] font-extrabold leading-[1.02] tracking-[-0.03em]">
              Open a real stream on {net.name}.
            </h2>
          </Reveal>
          <div className="mt-10 grid items-start gap-6 lg:grid-cols-[0.85fr_1.15fr]">
            <CreateStream onCreated={add} />
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-[20px] font-bold tracking-tight">Your streams</h3>
                <span className="mono text-[12px] text-[var(--color-muted)]">{ids.length} tracked</span>
              </div>
              {!isConnected ? (
                <Empty>Connect a wallet on {net.name} to open and track streams.</Empty>
              ) : ids.length === 0 ? (
                <Empty>No streams yet. Open one and watch it fill, live, right here.</Empty>
              ) : (
                <div className="space-y-4">
                  {ids.map((id) => (
                    <StreamCard key={id.toString()} id={id} onGone={remove} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <Faq />
      <SiteFooter streamPay={net.streamPay} />
    </main>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="panel rounded-3xl px-6 py-12 text-center text-[14px] text-[var(--color-muted)]">{children}</div>
  );
}
