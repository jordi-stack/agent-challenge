"use client";

import { useRef, useEffect } from "react";
import { useDotGrid } from "./dot-grid-context";

interface Dot {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  vx: number;
  vy: number;
  size: number;
  blinkPhase: number;
  blinkSpeed: number;
}

interface BurstParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: { r: number; g: number; b: number };
}

const SPACING = 35;
const BASE_COLOR = { r: 16, g: 185, b: 129 };
const DRIFT_SPEED = 0.12;
const RETURN_FORCE = 0.008;
const FLOW_FORCE = 1.2;
const FLOW_RADIUS = 350;
const LINE_DIST = 55;

export function DotGridCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dotsRef = useRef<Dot[]>([]);
  const burstRef = useRef<BurstParticle[]>([]);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);
  const burstTriggeredRef = useRef(false);
  const contextRef = useRef({
    flowTarget: null as { x: number; y: number } | null,
    intensity: 0,
    probeStreams: [] as { x: number; y: number; color: { r: number; g: number; b: number }; active: boolean }[],
    completionBurst: false,
  });
  const { flowTarget, intensity, probeStreams, completionBurst } = useDotGrid();

  useEffect(() => {
    contextRef.current.flowTarget = flowTarget;
    contextRef.current.intensity = intensity;
    contextRef.current.probeStreams = probeStreams;
    contextRef.current.completionBurst = completionBurst;
  }, [flowTarget, intensity, probeStreams, completionBurst]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: false });
    if (!ctx) return;

    function initDots() {
      const dpr = window.devicePixelRatio || 1;
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      canvas!.style.width = `${w}px`;
      canvas!.style.height = `${h}px`;
      ctx!.scale(dpr, dpr);

      const isMobile = w < 768;
      const spacing = isMobile ? 45 : SPACING;
      const dots: Dot[] = [];

      for (let x = 0; x < w + spacing; x += spacing) {
        for (let y = 0; y < h + spacing; y += spacing) {
          dots.push({
            x: x + (Math.random() - 0.5) * 6,
            y: y + (Math.random() - 0.5) * 6,
            baseX: x,
            baseY: y,
            vx: (Math.random() - 0.5) * DRIFT_SPEED,
            vy: (Math.random() - 0.5) * DRIFT_SPEED,
            size: 1 + Math.random() * 0.8,
            blinkPhase: Math.random() * Math.PI * 2,
            blinkSpeed: 0.3 + Math.random() * 0.7,
          });
        }
      }
      dotsRef.current = dots;
    }

    initDots();

    let resizeTimer: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(initDots, 200);
    };
    window.addEventListener("resize", handleResize);

    let rippleRadius = 0;
    const RIPPLE_MAX = 500;
    const RIPPLE_SPEED = 3.5;

    function spawnBurst(cx: number, cy: number) {
      const particles: BurstParticle[] = [];
      const colors = [
        BASE_COLOR,
        { r: 34, g: 211, b: 238 },   // cyan
        { r: 167, g: 139, b: 250 },   // purple
        { r: 245, g: 158, b: 11 },    // amber
      ];
      for (let i = 0; i < 60; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 5;
        particles.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          maxLife: 0.8 + Math.random() * 0.7,
          size: 1.5 + Math.random() * 2.5,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
      burstRef.current = particles;
    }

    function animate() {
      if (!ctx || !canvas) return;
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const { flowTarget: ft, intensity: inten, probeStreams: streams, completionBurst: burst } = contextRef.current;
      const dots = dotsRef.current;
      timeRef.current += 0.016;
      const t = timeRef.current;

      const breathe = Math.sin(t * 0.8) * 0.04;
      const isActive = ft !== null && inten > 0;

      // Trigger burst once
      if (burst && !burstTriggeredRef.current && ft) {
        burstTriggeredRef.current = true;
        spawnBurst(ft.x, ft.y);
      }
      if (!burst) {
        burstTriggeredRef.current = false;
      }

      // Ripple
      if (isActive) {
        rippleRadius += RIPPLE_SPEED;
        if (rippleRadius > RIPPLE_MAX) rippleRadius = 0;
      } else {
        rippleRadius = 0;
      }

      // Precompute dot colors and alphas
      const dotAlphas: number[] = new Array(dots.length);
      const dotColors: { r: number; g: number; b: number }[] = new Array(dots.length);
      const dotSizes: number[] = new Array(dots.length);

      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];

        // Physics
        dot.vx += (Math.random() - 0.5) * 0.03;
        dot.vy += (Math.random() - 0.5) * 0.03;
        dot.vx += (dot.baseX - dot.x) * RETURN_FORCE;
        dot.vy += (dot.baseY - dot.y) * RETURN_FORCE;

        if (isActive && ft) {
          const dx = ft.x - dot.x;
          const dy = ft.y - dot.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < FLOW_RADIUS && dist > 15) {
            const force = (FLOW_FORCE * inten * (1 - dist / FLOW_RADIUS)) / dist;
            dot.vx += dx * force * 0.015;
            dot.vy += dy * force * 0.015;
          }
        }

        dot.vx *= 0.94;
        dot.vy *= 0.94;
        dot.x += dot.vx;
        dot.y += dot.vy;

        // Color & alpha
        let alpha = 0.2 + breathe;
        let extraSize = 0;
        let cR = BASE_COLOR.r;
        let cG = BASE_COLOR.g;
        let cB = BASE_COLOR.b;

        if (isActive && ft) {
          const dx = ft.x - dot.x;
          const dy = ft.y - dot.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < FLOW_RADIUS) {
            const proximity = 1 - dist / FLOW_RADIUS;
            alpha = 0.15 + 0.6 * inten * proximity;
            extraSize = 1.0 * inten * proximity;

            // White shift near center
            const ws = proximity * proximity * inten * 0.4;
            cR = Math.min(255, cR + (255 - cR) * ws);
            cG = Math.min(255, cG + (255 - cG) * ws);
            cB = Math.min(255, cB + (255 - cB) * ws);
          }

          // Probe color streams: tint dots near each probe source
          for (let s = 0; s < streams.length; s++) {
            const stream = streams[s];
            if (!stream.active) continue;
            const sdx = stream.x - dot.x;
            const sdy = stream.y - dot.y;
            const sdist = Math.sqrt(sdx * sdx + sdy * sdy);
            const streamRadius = 180;
            if (sdist < streamRadius) {
              const sp = 1 - sdist / streamRadius;
              const blend = sp * sp * 0.6;
              cR = cR * (1 - blend) + stream.color.r * blend;
              cG = cG * (1 - blend) + stream.color.g * blend;
              cB = cB * (1 - blend) + stream.color.b * blend;
              alpha = Math.max(alpha, 0.2 + 0.35 * sp);
            }
          }

          // Ripple flash
          if (rippleRadius > 0) {
            const dist2 = Math.sqrt((ft.x - dot.x) ** 2 + (ft.y - dot.y) ** 2);
            const distToRipple = Math.abs(dist2 - rippleRadius);
            if (distToRipple < 30) {
              const rippleHit = 1 - distToRipple / 30;
              const rippleAlpha = 1 - rippleRadius / RIPPLE_MAX;
              alpha += 0.35 * rippleHit * rippleAlpha * inten;
              extraSize += 0.6 * rippleHit * rippleAlpha;
            }
          }
        } else {
          // Idle blinks
          const blink = Math.sin(t * dot.blinkSpeed + dot.blinkPhase);
          if (blink > 0.92) {
            const bs = (blink - 0.92) / 0.08;
            alpha += 0.3 * bs;
            extraSize += 0.5 * bs;
          }
        }

        dotAlphas[i] = Math.min(alpha, 0.9);
        dotColors[i] = { r: Math.round(cR), g: Math.round(cG), b: Math.round(cB) };
        dotSizes[i] = dot.size + extraSize;
      }

      // --- Draw constellation lines ---
      ctx.lineWidth = 0.5;
      for (let i = 0; i < dots.length; i++) {
        const a = dots[i];
        for (let j = i + 1; j < dots.length; j++) {
          const b = dots[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const distSq = dx * dx + dy * dy;
          const maxDist = isActive ? LINE_DIST + 10 : LINE_DIST;

          if (distSq < maxDist * maxDist) {
            const dist = Math.sqrt(distSq);
            const lineFade = 1 - dist / maxDist;

            // Use average color and alpha of the two dots, but dimmer
            const avgAlpha = (dotAlphas[i] + dotAlphas[j]) * 0.5;
            let lineAlpha: number;

            if (isActive) {
              // Brighter lines when active, following flow direction
              lineAlpha = lineFade * avgAlpha * 0.35;
            } else {
              // Very subtle constellation in idle
              lineAlpha = lineFade * 0.06;
            }

            if (lineAlpha > 0.01) {
              const cI = dotColors[i];
              const cJ = dotColors[j];
              const lr = (cI.r + cJ.r) >> 1;
              const lg = (cI.g + cJ.g) >> 1;
              const lb = (cI.b + cJ.b) >> 1;

              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.strokeStyle = `rgba(${lr},${lg},${lb},${lineAlpha})`;
              ctx.stroke();
            }
          }
        }
      }

      // --- Draw dots ---
      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];
        const r = dotSizes[i];
        const alpha = dotAlphas[i];
        const c = dotColors[i];

        ctx.beginPath();
        ctx.arc(dot.x, dot.y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${c.r},${c.g},${c.b},${alpha})`;
        ctx.fill();

        // Glow halo
        if (alpha > 0.4) {
          ctx.beginPath();
          ctx.arc(dot.x, dot.y, r + 2.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${c.r},${c.g},${c.b},${(alpha - 0.4) * 0.25})`;
          ctx.fill();
        }
      }

      // --- Ripple ring ---
      if (isActive && ft && rippleRadius > 10) {
        const rippleAlpha = (1 - rippleRadius / RIPPLE_MAX) * 0.12 * inten;
        if (rippleAlpha > 0.005) {
          ctx.beginPath();
          ctx.arc(ft.x, ft.y, rippleRadius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${BASE_COLOR.r},${BASE_COLOR.g},${BASE_COLOR.b},${rippleAlpha})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }

      // --- Burst particles ---
      const particles = burstRef.current;
      if (particles.length > 0) {
        let alive = 0;
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.vx *= 0.97;
          p.vy *= 0.97;
          p.life -= 0.016 / p.maxLife;

          if (p.life > 0) {
            const a = p.life * 0.8;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${p.color.r},${p.color.g},${p.color.b},${a})`;
            ctx.fill();

            // Trail glow
            if (a > 0.3) {
              ctx.beginPath();
              ctx.arc(p.x, p.y, p.size * p.life + 3, 0, Math.PI * 2);
              ctx.fillStyle = `rgba(${p.color.r},${p.color.g},${p.color.b},${(a - 0.3) * 0.15})`;
              ctx.fill();
            }
            alive++;
          }
        }
        if (alive === 0) burstRef.current = [];
      }

      animRef.current = requestAnimationFrame(animate);
    }

    animRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
    />
  );
}
