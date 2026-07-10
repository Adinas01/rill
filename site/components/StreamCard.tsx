"use client";

import { useCallback, useEffect, useState } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { formatUnits } from "viem";
import {
  cancelStream,
  readStream,
  statusAt,
  streamedAt,
  withdraw,
  withdrawableAt,
  type Stream,
} from "@/lib/stream";
import { net } from "@/lib/config";

const fmt = (n: bigint) => Number(formatUnits(n, 6)).toFixed(4);

export function StreamCard({ id, onGone }: { id: bigint; onGone: (id: bigint) => void }) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [stream, setStream] = useState<Stream | null>(null);
  const [gone, setGone] = useState(false);
  const [now, setNow] = useState(() => Date.now() / 1000);
  const [busy, setBusy] = useState<"" | "withdraw" | "cancel">("");

  const load = useCallback(async () => {
    if (!publicClient) return;
    try {
      setStream(await readStream({ net, publicClient }, id));
    } catch {
      setGone(true);
      onGone(id);
    }
  }, [publicClient, id, onGone]);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now() / 1000), 200);
    return () => clearInterval(t);
  }, []);

  if (gone || !stream) return null;

  const streamed = streamedAt(stream, now);
  const withdrawable = withdrawableAt(stream, now);
  const status = statusAt(stream, now);
  const pct = Math.min(100, Math.max(0, Number((streamed * 10000n) / stream.deposit) / 100));
  const isRecipient = address?.toLowerCase() === stream.recipient.toLowerCase();
  const isParty = isRecipient || address?.toLowerCase() === stream.sender.toLowerCase();

  async function doWithdraw() {
    if (!walletClient || !publicClient || !address) return;
    setBusy("withdraw");
    try {
      const amt = withdrawableAt(stream!, Date.now() / 1000);
      const tx = await withdraw({ net, publicClient, walletClient, account: address }, id, amt);
      await publicClient.waitForTransactionReceipt({ hash: tx });
      await load();
    } catch {
      /* wallet surfaces it */
    } finally {
      setBusy("");
    }
  }

  async function doCancel() {
    if (!walletClient || !publicClient || !address) return;
    setBusy("cancel");
    try {
      const tx = await cancelStream({ net, publicClient, walletClient, account: address }, id);
      await publicClient.waitForTransactionReceipt({ hash: tx });
      setGone(true);
      onGone(id);
    } catch {
      /* wallet surfaces it */
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="panel rounded-3xl p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="mono text-[13px] font-bold text-[var(--color-muted)]">#{id.toString()}</span>
          <StatusPill status={status} />
        </div>
        <span className="mono text-[12px] text-[var(--color-muted)]">{fmt(stream.deposit)} USDC locked</span>
      </div>

      <div className="mt-5 flex items-end justify-between gap-4">
        <div>
          <div className="mono text-[40px] font-extrabold leading-none tabular-nums tracking-tight value-gradient">
            {fmt(streamed)}
          </div>
          <div className="mt-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--color-muted)]">
            streamed so far
          </div>
        </div>
        <div className="text-right">
          <div className="mono text-[18px] font-bold text-[var(--color-mint)]">{fmt(withdrawable)}</div>
          <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--color-muted)]">withdrawable</div>
        </div>
      </div>

      <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-[var(--color-canvas-2)]">
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            transition: "width 0.2s linear",
            background:
              status === "streaming"
                ? "linear-gradient(90deg, var(--color-mint-deep), var(--color-mint), var(--color-amber))"
                : "var(--color-mint-deep)",
          }}
        />
      </div>

      <div className="mt-4 flex items-center gap-2 text-[12px] text-[var(--color-muted)]">
        <span className="mono">to {stream.recipient.slice(0, 6)}…{stream.recipient.slice(-4)}</span>
        <span className="inline-block h-1 w-1 rounded-full bg-[var(--color-line)]" />
        <span>{isRecipient ? "you receive" : "you send"}</span>
      </div>

      {isParty && (
        <div className="mt-5 flex gap-2.5">
          {isRecipient && (
            <button
              onClick={doWithdraw}
              disabled={busy !== "" || withdrawable === 0n}
              className="btn flex-1 rounded-xl bg-[var(--color-mint)] px-3 py-2.5 text-[13px] font-bold text-[var(--color-canvas)] disabled:opacity-30"
            >
              {busy === "withdraw" ? "Withdrawing…" : "Withdraw"}
            </button>
          )}
          <button
            onClick={doCancel}
            disabled={busy !== ""}
            className="btn flex-1 rounded-xl border border-[var(--color-line)] bg-transparent px-3 py-2.5 text-[13px] font-bold text-[var(--color-ink)] hover:border-[var(--color-warn)] hover:text-[var(--color-warn)] disabled:opacity-30"
          >
            {busy === "cancel" ? "Cancelling…" : "Cancel"}
          </button>
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    streaming: ["Streaming", "var(--color-mint)"],
    pending: ["Pending", "var(--color-muted)"],
    ended: ["Ended", "var(--color-amber)"],
  };
  const [label, color] = map[status] ?? ["", "var(--color-muted)"];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold"
      style={{ color, background: "color-mix(in oklch, currentColor 14%, transparent)" }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
