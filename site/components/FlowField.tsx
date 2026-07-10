"use client";

import { useEffect, useRef } from "react";

/**
 * A generative flow field: hundreds of particles advected along a smooth,
 * slowly-morphing vector field biased to the right, so value visibly "flows"
 * across the canvas. Trails are built by fading the previous frame rather than
 * clearing it, which gives the silky current look. Additive blending makes
 * overlaps glow. Honors prefers-reduced-motion with a single static frame.
 */
export function FlowField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    type P = { x: number; y: number; life: number; hue: 0 | 1 };
    let parts: P[] = [];

    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = "rgba(0,0,0,1)";
      const count = Math.floor((w * h) / 1600);
      parts = Array.from({ length: Math.min(900, count) }, () => spawn());
    };

    const spawn = (): P => ({
      x: Math.random() * w,
      y: Math.random() * h,
      life: 40 + Math.random() * 120,
      hue: Math.random() < 0.14 ? 1 : 0,
    });

    // Smooth vector field, biased rightward, morphing over time.
    const angle = (x: number, y: number, t: number) => {
      const a =
        Math.sin(x * 0.0016 + t * 0.15) +
        Math.cos(y * 0.0018 - t * 0.12) +
        Math.sin((x + y) * 0.0011 + t * 0.22);
      // Blend toward 0 (rightward drift) so the whole field reads as flow.
      return a * 0.8 * 0.55;
    };

    const mint = "134, 239, 205";
    const amber = "245, 205, 130";

    const step = (time: number) => {
      const t = time * 0.001;
      // Fade the previous frame toward the canvas colour to leave trails.
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "rgba(14, 30, 30, 0.11)";
      ctx.fillRect(0, 0, w, h);

      ctx.globalCompositeOperation = "lighter";
      ctx.lineWidth = 1.1;
      for (const p of parts) {
        const ang = angle(p.x, p.y, t);
        const vx = Math.cos(ang) + 0.9; // rightward bias
        const vy = Math.sin(ang);
        const nx = p.x + vx * 1.5;
        const ny = p.y + vy * 1.5;

        ctx.strokeStyle = `rgba(${p.hue ? amber : mint}, 0.5)`;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(nx, ny);
        ctx.stroke();

        p.x = nx;
        p.y = ny;
        p.life -= 1;
        if (p.x > w + 4 || p.y < -4 || p.y > h + 4 || p.life <= 0) {
          Object.assign(p, spawn(), { x: Math.random() * w * 0.25, y: Math.random() * h });
        }
      }
      raf = requestAnimationFrame(step);
    };

    resize();
    window.addEventListener("resize", resize);

    if (reduce) {
      // Single calm frame: a few streaks, no animation.
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < 400; i++) {
        const p = spawn();
        for (let k = 0; k < 30; k++) {
          const ang = angle(p.x, p.y, 0);
          const nx = p.x + (Math.cos(ang) + 0.9) * 1.5;
          const ny = p.y + Math.sin(ang) * 1.5;
          ctx.strokeStyle = `rgba(${mint}, 0.18)`;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(nx, ny);
          ctx.stroke();
          p.x = nx;
          p.y = ny;
        }
      }
    } else {
      raf = requestAnimationFrame(step);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={ref} className="absolute inset-0 h-full w-full" aria-hidden />;
}
