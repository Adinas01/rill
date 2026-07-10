"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { parseUnits, isAddress, type Address } from "viem";
import { createStream } from "@/lib/stream";
import { net } from "@/lib/config";
import { AlertCircle, ArrowRight, CheckCircle2, Loader2, Waves } from "lucide-react";

type Status = { kind: "idle" | "busy" | "err" | "ok"; msg?: string };

const DURATIONS = [
  { label: "1 hour", secs: 3600 },
  { label: "1 day", secs: 86400 },
  { label: "30 days", secs: 2592000 },
];

const container = {
  hidden: { opacity: 0, y: 18, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 300, damping: 30, staggerChildren: 0.06, delayChildren: 0.05 },
  },
};
const item = {
  hidden: { opacity: 0, y: 10, filter: "blur(4px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { type: "spring" as const, stiffness: 400, damping: 28 } },
};

function humanRate(perSec: number) {
  if (perSec <= 0) return "—";
  const perDay = perSec * 86400;
  if (perSec >= 0.01) return `${perSec.toFixed(4)} USDC/s`;
  return `${perDay.toFixed(2)} USDC/day`;
}

export function CreateStream({ onCreated }: { onCreated: (id: bigint) => void }) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const reduce = useReducedMotion();

  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("10");
  const [duration, setDuration] = useState(3600);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const cardRef = useRef<HTMLDivElement>(null);
  const [glow, setGlow] = useState({ x: 0, y: 0, on: false });

  const amt = Number(amount || "0");
  const perSec = amt / duration;
  const durLabel = DURATIONS.find((d) => d.secs === duration)?.label ?? "";

  function onMove(e: React.MouseEvent) {
    const r = cardRef.current?.getBoundingClientRect();
    if (r) setGlow({ x: e.clientX - r.left, y: e.clientY - r.top, on: true });
  }

  async function submit() {
    if (!publicClient || !walletClient || !address) return;
    if (!isAddress(recipient)) {
      setStatus({ kind: "err", msg: "Enter a valid recipient address." });
      return;
    }
    if (!(amt > 0)) {
      setStatus({ kind: "err", msg: "Enter an amount above zero." });
      return;
    }
    setStatus({ kind: "busy", msg: "Approving and opening the stream…" });
    try {
      const now = Math.floor(Date.now() / 1000);
      const { streamId } = await createStream(
        { net, publicClient, walletClient, account: address },
        { recipient: recipient as Address, deposit: parseUnits(amount, 6), startTime: now, stopTime: now + duration },
      );
      setStatus({ kind: "ok", msg: "Stream open" });
      onCreated(streamId);
      setTimeout(() => setStatus({ kind: "idle" }), 1800);
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e);
      setStatus({ kind: "err", msg: /rejected|denied/i.test(m) ? "Rejected in wallet." : m.slice(0, 150) });
    }
  }

  const disabled = status.kind === "busy" || !address;

  return (
    <motion.div
      ref={cardRef}
      className="relative"
      variants={container}
      initial="hidden"
      animate="visible"
      onMouseMove={onMove}
      onMouseLeave={() => setGlow((g) => ({ ...g, on: false }))}
    >
      {/* Cursor-tracked glow */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -inset-px rounded-[26px] blur-lg"
        animate={{ opacity: glow.on && !reduce ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        style={{
          background: `radial-gradient(340px circle at ${glow.x}px ${glow.y}px, color-mix(in oklch, var(--color-mint) 45%, transparent), transparent 70%)`,
        }}
      />

      <div className="panel relative overflow-hidden rounded-[24px] p-6">
        <motion.div className="flex items-center gap-3" variants={item}>
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--color-mint)] text-[var(--color-canvas)] mint-glow">
            <Waves className="h-5 w-5" strokeWidth={2.4} />
          </span>
          <div>
            <h3 className="text-[22px] font-extrabold leading-none tracking-tight">Open a stream</h3>
            <p className="mt-1 text-[13px] text-[var(--color-muted)]">USDC that flows every second until it runs dry.</p>
          </div>
        </motion.div>

        <motion.div className="mt-6 space-y-3" variants={item}>
          {/* Recipient */}
          <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-canvas-2)]/60 p-4">
            <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.09em] text-[var(--color-muted)]">Recipient</div>
            <input
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="0x…"
              spellCheck={false}
              className="mono w-full bg-transparent text-[15px] text-[var(--color-ink)] outline-none placeholder:text-[var(--color-muted)]"
            />
          </div>

          {/* Amount + token pill */}
          <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-canvas-2)]/60 p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-[0.09em] text-[var(--color-muted)]">You lock</span>
              <span className="text-[11px] text-[var(--color-muted)]">streams fully over {durLabel}</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                inputMode="decimal"
                className="mono w-full bg-transparent text-[34px] font-extrabold leading-none text-[var(--color-ink)] outline-none"
              />
              <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--color-line)] bg-[var(--color-canvas)] px-3 py-1.5 text-[13px] font-bold">
                <span className="h-4 w-4 rounded-full bg-gradient-to-br from-[var(--color-mint)] to-[var(--color-amber)]" />
                USDC
              </span>
            </div>
          </div>

          {/* Duration segmented control */}
          <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-canvas-2)]/60 p-2">
            <div className="grid grid-cols-3 gap-1">
              {DURATIONS.map((d) => (
                <button
                  key={d.secs}
                  onClick={() => setDuration(d.secs)}
                  className="relative rounded-xl px-2 py-2.5 text-[13px] font-bold transition-colors"
                >
                  {duration === d.secs && (
                    <motion.span
                      layoutId="dur-active"
                      className="absolute inset-0 rounded-xl bg-[var(--color-mint)]"
                      transition={{ type: "spring", stiffness: 500, damping: 34 }}
                    />
                  )}
                  <span className={`relative z-10 ${duration === d.secs ? "text-[var(--color-canvas)]" : "text-[var(--color-muted)]"}`}>
                    {d.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Live info panel */}
        <AnimatePresence initial={false}>
          {amt > 0 && (
            <motion.div
              key="info"
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: "auto", marginTop: 12 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="rounded-2xl bg-[var(--color-canvas-2)]/60 px-4 py-3">
                <Row label="Flow rate" value={humanRate(perSec)} accent />
                <Row label="Total locked" value={`${amt} USDC`} />
                <Row label="Empties" value={durLabel === "" ? "—" : `in ${durLabel}`} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          variants={item}
          onClick={submit}
          disabled={disabled}
          whileHover={disabled ? {} : { scale: 1.015 }}
          whileTap={disabled ? {} : { scale: 0.985 }}
          className={`mt-3 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-4 text-[15px] font-bold transition-colors ${
            status.kind === "ok"
              ? "bg-[var(--color-mint)] text-[var(--color-canvas)]"
              : status.kind === "err"
                ? "bg-[color-mix(in_oklch,var(--color-warn)_20%,var(--color-canvas-2))] text-[var(--color-warn)]"
                : disabled
                  ? "bg-[var(--color-canvas-2)] text-[var(--color-muted)]"
                  : "mint-glow bg-[var(--color-mint)] text-[var(--color-canvas)]"
          }`}
        >
          {status.kind === "busy" ? (
            <><Loader2 className="h-5 w-5 animate-spin" /> Opening…</>
          ) : status.kind === "ok" ? (
            <><CheckCircle2 className="h-5 w-5" /> Stream open</>
          ) : status.kind === "err" ? (
            <><AlertCircle className="h-5 w-5" /> {status.msg}</>
          ) : !address ? (
            "Connect a wallet first"
          ) : (
            <>Start streaming <ArrowRight className="h-5 w-5" /></>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1 text-[13px]">
      <span className="text-[var(--color-muted)]">{label}</span>
      <span className={`mono font-bold ${accent ? "value-gradient" : "text-[var(--color-ink)]"}`}>{value}</span>
    </div>
  );
}
