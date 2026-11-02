"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMotionValueEvent, useReducedMotion, useScroll } from "framer-motion";

interface Node {
  x: number;
  y: number;
}

/**
 * A single "electric current" from the top of the page down to the MediaCraft
 * mark at the centre of the services orbit (`[data-thread-target]`).
 *
 * The drawn length tracks the scroll: the glowing head stays roughly at the
 * middle of the viewport, so as you scroll you watch the current extend down
 * past each section. Each station node lights as the head passes its height,
 * and when the head reaches the mark it ignites (`.is-lit` on the target). The
 * path is rebuilt from live element positions and length↔y is sampled into a
 * lookup table for the tracking. Under reduced motion everything is drawn and
 * lit statically, with no travelling head.
 */
export function ScrollThread({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<SVGPathElement>(null);
  const currentRef = useRef<SVGPathElement>(null);
  const headRef = useRef<SVGGElement>(null);
  const nodeRefs = useRef<Array<SVGGElement | null>>([]);
  const starElRef = useRef<HTMLElement | null>(null);
  const lenRef = useRef(1);
  const starYRef = useRef(0);
  const cTopRef = useRef(0);
  const lutRef = useRef<Array<{ len: number; y: number }>>([]);

  const [dims, setDims] = useState({ w: 0, h: 0 });
  const [d, setD] = useState("");
  const [nodes, setNodes] = useState<Node[]>([]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const rebuild = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const W = el.clientWidth;
    const H = el.scrollHeight;
    if (!W || !H) return;

    const cRect = el.getBoundingClientRect();
    const cTop = cRect.top + window.scrollY;
    const cLeft = cRect.left + window.scrollX;
    cTopRef.current = cTop;

    const target = el.querySelector<HTMLElement>("[data-thread-target]");
    let endX = W / 2;
    let starY = H;
    const tr = target?.getBoundingClientRect();
    if (target && tr && (tr.width > 0 || tr.height > 0)) {
      starElRef.current = target;
      starY = tr.top + window.scrollY + tr.height / 2 - cTop;
      endX = tr.left + window.scrollX + tr.width / 2 - cLeft;
    } else {
      // target hidden (e.g. the hub is display:none on small screens)
      starElRef.current = null;
    }
    starYRef.current = starY;

    const margin = Math.min(48, W * 0.05);
    const clampX = (x: number) => Math.max(margin, Math.min(W - margin, x));
    const maxAmp = W < 640 ? 0.32 : 0.44;

    const stations = Array.from(
      el.querySelectorAll<HTMLElement>("[data-thread-station]"),
    );

    // The hero (first station) carries no thread — the current only begins once
    // the hero has scrolled past, so the path starts at the hero's bottom edge.
    const startY = stations[0]
      ? stations[0].offsetTop + stations[0].offsetHeight
      : 0;

    const pts: Array<{ x: number; y: number }> = [{ x: W / 2, y: startY }];
    const nodePts: Node[] = [];

    stations.forEach((s, i) => {
      if (i === 0) return;
      const top = s.offsetTop;
      const h = s.offsetHeight;
      const amp = maxAmp - 0.05 * Math.abs(Math.sin(i * 1.4));
      const side = i % 2 === 0 ? -1 : 1;
      const enter = { x: clampX(W / 2 + side * amp * W), y: top + h * 0.28 };
      const exit = {
        x: clampX(W / 2 - side * amp * W * 0.82),
        y: top + h * 0.74,
      };
      const cy = top + h * 0.42;
      if (enter.y < starY) pts.push(enter);
      if (exit.y < starY) pts.push(exit);
      if (cy < starY - 24) nodePts.push({ x: enter.x, y: cy });
    });
    pts.push({ x: endX, y: starY });

    let path = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1];
      const b = pts[i];
      const my = (a.y + b.y) / 2;
      path += ` C ${a.x.toFixed(1)} ${my.toFixed(1)}, ${b.x.toFixed(1)} ${my.toFixed(1)}, ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
    }

    setDims({ w: W, h: H });
    setD(path);
    setNodes(nodePts);
  }, []);

  useEffect(() => {
    rebuild();
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(rebuild);
    ro.observe(el);
    const onLoad = () => rebuild();
    window.addEventListener("load", onLoad);
    const timers = [setTimeout(rebuild, 300), setTimeout(rebuild, 1200)];
    return () => {
      ro.disconnect();
      window.removeEventListener("load", onLoad);
      timers.forEach(clearTimeout);
      starElRef.current?.classList.remove("is-lit");
    };
  }, [rebuild]);

  const draw = useCallback(() => {
    const path = currentRef.current;
    if (!path) return;
    const len = lenRef.current;
    const lut = lutRef.current;
    if (len < 2 || lut.length < 2) return;

    const vh = window.innerHeight || 800;
    // Where the "head" should be: a touch below the middle of the viewport.
    const targetY = reduce
      ? starYRef.current + 1
      : window.scrollY + vh * 0.52 - cTopRef.current;

    // Length along the path at that y (path y is monotonic increasing).
    let L: number;
    if (targetY <= lut[0].y) L = 0;
    else if (targetY >= lut[lut.length - 1].y) L = len;
    else {
      L = len;
      for (let i = 1; i < lut.length; i++) {
        if (lut[i].y >= targetY) {
          const a = lut[i - 1];
          const b = lut[i];
          const t = (targetY - a.y) / Math.max(0.001, b.y - a.y);
          L = a.len + t * (b.len - a.len);
          break;
        }
      }
    }
    L = Math.max(0, Math.min(len, L));
    const frac = L / len;

    const offset = `${len - L}`;
    path.style.strokeDashoffset = offset;
    if (glowRef.current) glowRef.current.style.strokeDashoffset = offset;

    if (headRef.current) {
      let pt: DOMPoint | null = null;
      try {
        pt = path.getPointAtLength(L);
      } catch {
        pt = null;
      }
      if (pt) {
        headRef.current.setAttribute("transform", `translate(${pt.x} ${pt.y})`);
        headRef.current.style.opacity =
          !reduce && frac > 0.004 && frac < 0.99 ? "1" : "0";
      }
    }

    nodes.forEach((n, i) => {
      const g = nodeRefs.current[i];
      if (!g) return;
      g.style.opacity = targetY >= n.y - 10 ? "1" : "0.22";
      g.style.setProperty(
        "--spark",
        !reduce && Math.abs(targetY - n.y) < vh * 0.14 ? "1" : "0",
      );
    });

    starElRef.current?.classList.toggle(
      "is-lit",
      targetY >= starYRef.current - 6,
    );
  }, [nodes, reduce]);

  // Measure path length, sample length↔y, repaint whenever geometry changes.
  useEffect(() => {
    const path = currentRef.current;
    if (!path || !d) return;
    const len = path.getTotalLength() || 1;
    lenRef.current = len;
    const da = `${len}`;
    path.style.strokeDasharray = da;
    if (glowRef.current) glowRef.current.style.strokeDasharray = da;

    const N = 72;
    const lut: Array<{ len: number; y: number }> = [];
    for (let i = 0; i < N; i++) {
      const l = (i / (N - 1)) * len;
      let y = 0;
      try {
        y = path.getPointAtLength(l).y;
      } catch {
        y = i === 0 ? 0 : lut[i - 1].y;
      }
      lut.push({ len: l, y });
    }
    lutRef.current = lut;

    draw();
  }, [d, draw]);

  useMotionValueEvent(scrollYProgress, "change", () => draw());

  useEffect(() => {
    const onScroll = () => draw();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [draw]);

  const vb = `0 0 ${dims.w || 1} ${dims.h || 1}`;

  return (
    <div ref={containerRef} className="relative">
      {/* On top of the content but translucent, so the current reads as if it
          were woven *behind* everything — visible the whole way down. */}
      <svg
        className="pointer-events-none absolute inset-0 z-0 h-full w-full"
        viewBox={vb}
        preserveAspectRatio="none"
        fill="none"
        aria-hidden
      >
        <defs>
          <filter id="thread-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="9" />
          </filter>
        </defs>

        <path
          d={d}
          stroke="rgba(0,27,50,0.14)"
          strokeWidth={2.5}
          strokeDasharray="1 8"
          strokeLinecap="round"
        />
        <path
          ref={glowRef}
          d={d}
          stroke="#bf262e"
          strokeWidth={14}
          strokeLinecap="round"
          opacity={0.16}
          filter="url(#thread-glow)"
        />
        <path
          ref={currentRef}
          d={d}
          stroke="#bf262e"
          strokeWidth={3}
          strokeLinecap="round"
          opacity={0.68}
        />

        {nodes.map((n, i) => (
          <g
            key={i}
            ref={(g) => {
              nodeRefs.current[i] = g;
            }}
            transform={`translate(${n.x} ${n.y})`}
            style={{ opacity: 0.2 }}
          >
            <circle
              r={20}
              fill="#bf262e"
              opacity={0.2}
              filter="url(#thread-glow)"
              style={{ transform: "scale(var(--spark, 0))" }}
            />
            <circle r={6} fill="#bf262e" />
            <circle r={2.2} fill="#fff" />
          </g>
        ))}

        <g ref={headRef} style={{ opacity: 0 }}>
          <circle r={22} fill="#bf262e" opacity={0.3} filter="url(#thread-glow)" />
          <circle r={7} fill="#bf262e" />
          <circle r={2.6} fill="#fff" />
        </g>
      </svg>

      <div className="relative z-10">{children}</div>
    </div>
  );
}
