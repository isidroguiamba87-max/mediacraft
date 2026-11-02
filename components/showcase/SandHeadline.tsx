"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { useMounted } from "@/hooks/useMounted";

interface SandHeadlineProps {
  words: string[];
  /** Controlled index of the word currently shown. */
  index: number;
  className?: string;
  /** Fires true while the pointer is over the word, false when it leaves. */
  onHoverChange?: (hovered: boolean) => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  tx: number;
  ty: number;
  on: boolean;
  red: boolean;
}

/**
 * Big pillar word rendered as a field of sand. The grains settle tightly into
 * the letter shapes; the cursor blasts the grains it passes over and they flow
 * back into place once it leaves. When `index` changes the sand disperses and
 * re-forms into the next word.
 *
 * Server render and reduced-motion both fall back to the words as plain styled
 * text, so the content is always readable without the canvas.
 */
export function SandHeadline({
  words,
  index,
  className,
  onHoverChange,
}: SandHeadlineProps) {
  const mounted = useMounted();
  const reduce = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const indexRef = useRef(index);
  const onHoverRef = useRef(onHoverChange);

  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  useEffect(() => {
    onHoverRef.current = onHoverChange;
  }, [onHoverChange]);

  useEffect(() => {
    if (!mounted || reduce) return;
    if (!canvasRef.current || !wrapRef.current) return;
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Non-null from here; TS loses guard narrowing inside the nested closures.
    const c2d: CanvasRenderingContext2D = ctx;

    const DPR = Math.min(2, window.devicePixelRatio || 1);
    const mobile = window.matchMedia("(max-width: 640px)").matches;
    const STEP = mobile ? 3 : 2; // sampling stride, device px — tighter = sharper
    const DOT = (mobile ? 1.5 : 1.6) * DPR;
    const MAX = mobile ? 5200 : 13000;
    const SPRING = 0.085; // snappier settle → crisper letters
    const FRICTION = 0.82;
    const R = (mobile ? 82 : 150) * DPR; // repel radius
    const FORCE = 20 * DPR; // repel strength
    const SWIRL = 0.5;

    let W = 0;
    let H = 0;
    let raf = 0;
    let disposed = false;
    let rendered = -1;
    let hoverFlag = false;
    const particles: Particle[] = [];
    const cache = new Map<string, Array<{ x: number; y: number }>>();
    const mouse = { x: -9999, y: -9999, active: false };

    const navy = "rgba(0,27,50,1)";
    const red = "rgba(191,38,46,1)";

    function setHover(next: boolean) {
      if (next === hoverFlag) return;
      hoverFlag = next;
      onHoverRef.current?.(next);
    }

    function sample(word: string) {
      const cached = cache.get(word);
      if (cached) return cached;
      let fontPx = Math.min(H * 0.82, (W / Math.max(5, word.length)) * 1.9);
      c2d.font = `700 ${fontPx}px "Noe Display", Georgia, "Times New Roman", serif`;
      // The length-based guess above is only an estimate — real glyph
      // widths vary by word/font, so on narrow (mobile) containers it can
      // overflow and clip at the edges. Measure the actual rendered width
      // and scale down to fit before sampling, so every word stays fully
      // inside the canvas regardless of viewport width.
      const measured = c2d.measureText(word).width;
      const maxWidth = W * 0.94;
      if (measured > maxWidth) {
        fontPx *= maxWidth / measured;
        c2d.font = `700 ${fontPx}px "Noe Display", Georgia, "Times New Roman", serif`;
      }
      c2d.clearRect(0, 0, W, H);
      c2d.textAlign = "center";
      c2d.textBaseline = "middle";
      c2d.fillStyle = "#fff";
      c2d.fillText(word, W / 2, H / 2);
      const data = c2d.getImageData(0, 0, W, H).data;
      c2d.clearRect(0, 0, W, H);

      let pts: Array<{ x: number; y: number }> = [];
      for (let y = 0; y < H; y += STEP) {
        for (let x = 0; x < W; x += STEP) {
          if (data[(y * W + x) * 4 + 3] > 128) pts.push({ x, y });
        }
      }
      for (let i = pts.length - 1; i > 0; i--) {
        const j = (Math.random() * (i + 1)) | 0;
        [pts[i], pts[j]] = [pts[j], pts[i]];
      }
      if (pts.length > MAX) pts = pts.slice(0, MAX);
      cache.set(word, pts);
      return pts;
    }

    function retarget(word: string, snap: boolean) {
      const pts = sample(word);
      while (particles.length < pts.length) {
        particles.push({
          x: W / 2,
          y: H / 2,
          vx: 0,
          vy: 0,
          tx: W / 2,
          ty: H / 2,
          on: false,
          red: Math.random() < 0.12,
        });
      }
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (i < pts.length) {
          p.tx = pts[i].x + (Math.random() - 0.5) * 0.5 * DPR;
          p.ty = pts[i].y + (Math.random() - 0.5) * 0.5 * DPR;
          p.on = true;
          if (snap) {
            p.x = p.tx;
            p.y = p.ty;
          }
        } else {
          // grains with no letter to join fall out through the bottom
          p.on = false;
          p.tx = p.x + (Math.random() - 0.5) * 40 * DPR;
          p.ty = H + 20 * DPR + Math.random() * H * 0.6;
        }
      }
    }

    function resize() {
      const r = wrap.getBoundingClientRect();
      W = Math.max(1, Math.floor(r.width * DPR));
      H = Math.max(1, Math.floor(r.height * DPR));
      canvas.width = W;
      canvas.height = H;
      canvas.style.width = `${r.width}px`;
      canvas.style.height = `${r.height}px`;
      cache.clear();
      rendered = indexRef.current;
      retarget(words[rendered] ?? words[0], true);
    }

    function frame() {
      if (disposed) return;
      if (rendered !== indexRef.current) {
        rendered = indexRef.current;
        retarget(words[rendered] ?? words[0], false);
      }
      c2d.clearRect(0, 0, W, H);
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        let ax = (p.tx - p.x) * SPRING;
        let ay = (p.ty - p.y) * SPRING;
        if (mouse.active) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < R * R) {
            const d = Math.sqrt(d2) || 1;
            const t = 1 - d / R;
            const f = (t * t * FORCE) / d;
            ax += dx * f;
            ay += dy * f;
            ax += -dy * f * SWIRL;
            ay += dx * f * SWIRL;
          }
        }
        p.vx = (p.vx + ax) * FRICTION;
        p.vy = (p.vy + ay) * FRICTION;
        p.x += p.vx;
        p.y += p.vy;
        if (!p.on) continue;
        c2d.fillStyle = p.red ? red : navy;
        c2d.fillRect(p.x, p.y, DOT, DOT);
      }
      raf = requestAnimationFrame(frame);
    }

    function onMove(e: PointerEvent) {
      const r = canvas.getBoundingClientRect();
      mouse.x = (e.clientX - r.left) * DPR;
      mouse.y = (e.clientY - r.top) * DPR;
      mouse.active = true;
      setHover(true);
    }
    function onLeave() {
      mouse.active = false;
      mouse.x = -9999;
      mouse.y = -9999;
      setHover(false);
    }

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerdown", onMove);
    canvas.addEventListener("pointerenter", onMove);
    canvas.addEventListener("pointerleave", onLeave);
    raf = requestAnimationFrame(frame);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerdown", onMove);
      canvas.removeEventListener("pointerenter", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
      setHover(false);
    };
  }, [mounted, reduce, words]);

  const showCanvas = mounted && !reduce;

  return (
    <div ref={wrapRef} className={className}>
      <span className="sr-only">{words.join(", ")}</span>
      {showCanvas ? (
        <canvas
          ref={canvasRef}
          aria-hidden
          className="block h-full w-full cursor-pointer touch-none"
        />
      ) : (
        <div className="flex h-full flex-wrap items-center justify-center gap-x-5 gap-y-1">
          {words.map((w, i) => (
            <span
              key={w}
              className="font-display text-5xl leading-none text-brand-navy sm:text-6xl lg:text-7xl"
            >
              {w}
              {i < words.length - 1 && (
                <span className="mx-1 text-brand-red">·</span>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
