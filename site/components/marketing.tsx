"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Banknote, ChevronDown, GraduationCap, Lock, Timer, Wallet } from "lucide-react";

export function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

function Kicker({ children }: { children: React.ReactNode }) {
  return <div className="mb-3 text-[13px] font-bold uppercase tracking-[0.14em] text-[var(--color-mint)]">{children}</div>;
}

export function HowItWorks() {
  const steps = [
    { icon: Lock, title: "Lock USDC once", body: "Open a stream with a recipient, an amount, and a window. The deposit is held by the StreamPay contract." },
    { icon: Timer, title: "It vests per second", body: "The balance flows to the recipient linearly, every second, computed exactly on-chain with no rounding dust." },
    { icon: Wallet, title: "Withdraw or cancel", body: "The recipient pulls whatever has vested at any time. Either party can cancel and split the balance fairly." },
  ];
  return (
    <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-20 sm:px-8 sm:py-28">
      <Reveal>
        <Kicker>How it works</Kicker>
        <h2 className="max-w-[20ch] text-[clamp(2rem,4.5vw,3.2rem)] font-extrabold leading-[1.02] tracking-[-0.03em]">
          A deposit that drains at the speed of the work.
        </h2>
      </Reveal>
      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {steps.map((s, i) => (
          <Reveal key={s.title} delay={i * 0.08}>
            <div className="panel h-full rounded-3xl p-6">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[color-mix(in_oklch,var(--color-mint)_16%,transparent)] text-[var(--color-mint)]">
                <s.icon className="h-6 w-6" strokeWidth={2.2} />
              </span>
              <div className="mt-5 flex items-baseline gap-2">
                <span className="mono text-[13px] font-bold text-[var(--color-mint)]">0{i + 1}</span>
                <h3 className="text-[19px] font-bold tracking-tight">{s.title}</h3>
              </div>
              <p className="mt-2 text-[14px] leading-relaxed text-[var(--color-muted)]">{s.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export function UseCases() {
  const cases = [
    { icon: Banknote, title: "Payroll", body: "Pay contributors continuously. They draw earnings whenever they want instead of waiting for a pay cycle." },
    { icon: Timer, title: "Vesting", body: "Token or stablecoin vesting that unlocks by the second, cancellable if someone leaves, with no cliff cliffhangers." },
    { icon: GraduationCap, title: "Grants", body: "Fund builders over a period and keep the runway visible. Stop the stream if a milestone slips." },
  ];
  return (
    <section id="use-cases" className="scroll-mt-20 border-t border-[var(--color-line)] bg-[var(--color-canvas-2)]/40">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
        <Reveal>
          <Kicker>Use cases</Kicker>
          <h2 className="max-w-[22ch] text-[clamp(2rem,4.5vw,3.2rem)] font-extrabold leading-[1.02] tracking-[-0.03em]">
            Money that should move continuously.
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {cases.map((c, i) => (
            <Reveal key={c.title} delay={i * 0.08}>
              <div className="group panel h-full rounded-3xl p-6 transition-transform hover:-translate-y-1">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--color-mint)] text-[var(--color-canvas)]">
                  <c.icon className="h-6 w-6" strokeWidth={2.2} />
                </span>
                <h3 className="mt-5 text-[19px] font-bold tracking-tight">{c.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-[var(--color-muted)]">{c.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

const FAQS = [
  { q: "Which network is Rill on?", a: "Arc testnet (chain 5042002), where USDC is the native asset. The StreamPay contract is live and settling real streams." },
  { q: "What happens if I cancel a stream?", a: "The vested-but-unwithdrawn amount goes to the recipient and the remainder returns to the sender. Either party can cancel." },
  { q: "Are the streamed amounts exact?", a: "Yes. The contract uses a deposit/start/stop model and computes the streamed amount exactly, so no dust is stranded by per-second rounding." },
  { q: "Do I need a separate gas token?", a: "No. USDC is native on Arc, so a stream is a single asset end to end, no wrapping, no bridge, no second token for gas." },
];

export function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <section className="mx-auto max-w-3xl px-5 py-20 sm:px-8 sm:py-28">
      <Reveal>
        <Kicker>FAQ</Kicker>
        <h2 className="text-[clamp(2rem,4.5vw,3.2rem)] font-extrabold leading-[1.02] tracking-[-0.03em]">Questions.</h2>
      </Reveal>
      <div className="mt-10 divide-y divide-[var(--color-line)] border-y border-[var(--color-line)]">
        {FAQS.map((f, i) => (
          <div key={f.q}>
            <button
              onClick={() => setOpen(open === i ? -1 : i)}
              className="flex w-full items-center justify-between gap-4 py-5 text-left"
            >
              <span className="text-[17px] font-bold tracking-tight">{f.q}</span>
              <ChevronDown
                className={`h-5 w-5 shrink-0 text-[var(--color-muted)] transition-transform ${open === i ? "rotate-180" : ""}`}
              />
            </button>
            <motion.div
              initial={false}
              animate={{ height: open === i ? "auto" : 0, opacity: open === i ? 1 : 0 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <p className="pb-5 text-[15px] leading-relaxed text-[var(--color-muted)]">{f.a}</p>
            </motion.div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function SiteFooter({ streamPay }: { streamPay: string }) {
  const short = `${streamPay.slice(0, 6)}…${streamPay.slice(-4)}`;
  return (
    <footer className="border-t border-[var(--color-line)]">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-5 py-10 sm:flex-row sm:items-center sm:px-8">
        <div className="flex items-center gap-2.5">
          <svg width="20" height="20" viewBox="0 0 32 32" fill="none" aria-hidden>
            <path d="M3 20c5 0 5-8 10-8s5 8 10 8 6-8 6-8" stroke="var(--color-mint)" strokeWidth="2.4" strokeLinecap="round" />
          </svg>
          <span className="font-extrabold">Rill</span>
          <span className="text-[13px] text-[var(--color-muted)]">USDC streams on Arc</span>
        </div>
        <div className="flex items-center gap-5 text-[13px] text-[var(--color-muted)]">
          <a href="/docs" className="font-semibold hover:text-[var(--color-ink)]">Docs</a>
          <a href="https://github.com/Adinas01/rill" target="_blank" rel="noreferrer" className="font-semibold hover:text-[var(--color-ink)]">GitHub</a>
          <span className="mono">StreamPay {short}</span>
        </div>
      </div>
    </footer>
  );
}
