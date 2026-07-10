"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";

const LINKS = [
  { label: "How it works", href: "/#how" },
  { label: "Use cases", href: "/#use-cases" },
  { label: "Docs", href: "/docs" },
  { label: "GitHub", href: "https://github.com/Adinas01/rill", external: true },
];

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <div className="sticky top-0 z-50">
      <div
        className={`transition-colors duration-300 ${
          scrolled ? "border-b border-[var(--color-line)] bg-[color-mix(in_oklch,var(--color-canvas)_82%,transparent)] backdrop-blur-xl" : ""
        }`}
      >
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <Mark />
            <span className="text-[18px] font-extrabold tracking-tight">Rill</span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {LINKS.map((l) =>
              l.external ? (
                <a
                  key={l.label}
                  href={l.href}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg px-3 py-2 text-[14px] font-semibold text-[var(--color-muted)] transition-colors hover:text-[var(--color-ink)]"
                >
                  {l.label}
                </a>
              ) : (
                <Link
                  key={l.label}
                  href={l.href}
                  className="rounded-lg px-3 py-2 text-[14px] font-semibold text-[var(--color-muted)] transition-colors hover:text-[var(--color-ink)]"
                >
                  {l.label}
                </Link>
              ),
            )}
          </div>

          <div className="flex items-center gap-2">
            <ConnectButton showBalance={false} chainStatus="icon" accountStatus="avatar" />
          </div>
        </nav>
      </div>
    </div>
  );
}

function Mark({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <path d="M3 20c5 0 5-8 10-8s5 8 10 8 6-8 6-8" stroke="var(--color-mint)" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M3 13c5 0 5-6 10-6s5 6 10 6 6-6 6-6" stroke="var(--color-amber)" strokeWidth="1.8" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}
