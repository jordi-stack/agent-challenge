"use client";

import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";

type ProbeStatus = "idle" | "searching" | "complete" | "error";

interface ProbeNode {
  type: "scout" | "analyst" | "sentinel";
  label: string;
  status: ProbeStatus;
  color: string;
}

interface ProbeNodeGraphProps {
  topic: string;
  probes: ProbeNode[];
  synthesizing: boolean;
}

// Rotating scan phrases per probe type
const SCAN_PHRASES: Record<string, string[]> = {
  scout: [
    "Searching web via Tavily...",
    "Crawling documentation...",
    "Parsing search results...",
    "Indexing announcements...",
    "Extracting live sources...",
    "Cross-referencing articles...",
    "Grounding findings...",
  ],
  analyst: [
    "Querying live data...",
    "Searching market feeds...",
    "Fetching on-chain metrics...",
    "Parsing web results...",
    "Aggregating statistics...",
    "Analyzing token flows...",
    "Benchmarking via search...",
  ],
  sentinel: [
    "Searching social feeds...",
    "Scanning community posts...",
    "Parsing web sentiment...",
    "Evaluating narratives...",
    "Tracking discussions...",
    "Gauging dev mood...",
    "Scoring ecosystem health...",
  ],
};

const SYNTH_PHRASES = [
  "Merging probe data...",
  "Correlating findings...",
  "Scoring confidence...",
  "Structuring briefing...",
  "Generating report...",
];

// Pseudo hex data for stream effect
const HEX_CHARS = "0123456789abcdef";
function randomHex(len: number) {
  let s = "";
  for (let i = 0; i < len; i++) s += HEX_CHARS[Math.floor(Math.random() * 16)];
  return s;
}

/** Hook: cycles through phrases while active */
function useCyclingText(phrases: string[], active: boolean, intervalMs = 2200) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (!active) { setIdx(0); return; }
    const iv = setInterval(() => setIdx((i) => (i + 1) % phrases.length), intervalMs);
    return () => clearInterval(iv);
  }, [active, phrases, intervalMs]);
  return phrases[idx];
}

/** Hook: generates cycling hex stream */
function useHexStream(active: boolean) {
  const [hex, setHex] = useState("0x00000000");
  useEffect(() => {
    if (!active) return;
    const iv = setInterval(() => setHex("0x" + randomHex(8)), 150);
    return () => clearInterval(iv);
  }, [active]);
  return hex;
}

/** Hook: tracks "just completed" flash */
function useCompletionFlash(status: ProbeStatus) {
  const prev = useRef(status);
  const [flash, setFlash] = useState(false);
  useEffect(() => {
    if (prev.current === "searching" && status === "complete") {
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 600);
      return () => clearTimeout(t);
    }
    prev.current = status;
  }, [status]);
  return flash;
}

/** Truncate topic into up to 3 lines */
function truncateTopic(topic: string): { lines: string[]; fontSize: number } {
  if (!topic) return { lines: ["Enter topic"], fontSize: 14 };
  if (topic.length <= 30) return { lines: [topic], fontSize: 14 };

  const maxChars = 30;
  const maxLines = 4;
  const words = topic.split(" ");
  const lines: string[] = [];
  let current = "";
  let done = false;

  for (const word of words) {
    if (current && (current + " " + word).length > maxChars) {
      lines.push(current);
      current = word;
      if (lines.length >= maxLines) { done = true; break; }
    } else {
      current = current ? current + " " + word : word;
    }
  }
  if (!done && current) lines.push(current);

  // Add ellipsis if topic was truncated
  if (done) {
    const last = lines[lines.length - 1];
    lines[lines.length - 1] = (last.length > maxChars - 3 ? last.slice(0, maxChars - 3) : last) + "...";
  }

  const fontSize = lines.length >= 4 ? 10 : lines.length >= 3 ? 11 : lines.length >= 2 ? 12 : 14;
  return { lines, fontSize };
}

// Card dimensions
const CARD_W = 190;
const CARD_H = 100;
const CENTER_W = 260;
const CENTER_H = 135;

// Layout positions (wider viewBox: 780x540)
const CENTER = { x: 390, y: 240 };
const PROBE_POSITIONS = [
  { x: 130, y: 70 },
  { x: 650, y: 70 },
  { x: 390, y: 440 },
];

function getEdgePoint(
  fromX: number, fromY: number, fromW: number, fromH: number,
  toX: number, toY: number
) {
  const dx = toX - fromX;
  const dy = toY - fromY;
  const angle = Math.atan2(dy, dx);
  const hw = fromW / 2;
  const hh = fromH / 2;
  const tanA = Math.abs(Math.tan(angle));
  let ex: number, ey: number;
  if (tanA * hw <= hh) {
    ex = dx > 0 ? hw : -hw;
    ey = ex * Math.tan(angle);
  } else {
    ey = dy > 0 ? hh : -hh;
    ex = ey / Math.tan(angle);
  }
  return { x: fromX + ex, y: fromY + ey };
}

// Sub-components to use hooks per probe
function ProbeCard({ probe, pos, index }: { probe: ProbeNode; pos: { x: number; y: number }; index: number }) {
  const isActive = probe.status === "searching";
  const isDone = probe.status === "complete";
  const isError = probe.status === "error";
  const isIdle = probe.status === "idle";

  const scanText = useCyclingText(SCAN_PHRASES[probe.type] || SCAN_PHRASES.scout, isActive);
  const hexStream = useHexStream(isActive);
  const flash = useCompletionFlash(probe.status);

  return (
    <motion.g
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.1 + index * 0.15, type: "spring", stiffness: 100 }}
      style={{ transformOrigin: `${pos.x}px ${pos.y}px` }}
    >
      {/* Active pulse ring */}
      {isActive && (
        <motion.rect
          x={pos.x - CARD_W / 2 - 6}
          y={pos.y - CARD_H / 2 - 6}
          width={CARD_W + 12}
          height={CARD_H + 12}
          rx={14}
          fill="none"
          stroke={probe.color}
          strokeWidth={1}
          animate={{ opacity: [0.3, 0], scale: [1, 1.04] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{ transformOrigin: `${pos.x}px ${pos.y}px` }}
        />
      )}

      {/* Completion flash burst */}
      {flash && (
        <motion.rect
          x={pos.x - CARD_W / 2 - 10}
          y={pos.y - CARD_H / 2 - 10}
          width={CARD_W + 20}
          height={CARD_H + 20}
          rx={16}
          fill={probe.color}
          initial={{ opacity: 0.25 }}
          animate={{ opacity: 0, scale: 1.08 }}
          transition={{ duration: 0.6 }}
          style={{ transformOrigin: `${pos.x}px ${pos.y}px` }}
        />
      )}

      {/* Card glow */}
      {(isActive || isDone) && (
        <rect
          x={pos.x - CARD_W / 2}
          y={pos.y - CARD_H / 2}
          width={CARD_W}
          height={CARD_H}
          rx={12}
          fill={probe.color}
          opacity={isActive ? 0.06 : 0.03}
          filter="url(#glow-md)"
        />
      )}

      {/* Card body */}
      <rect
        x={pos.x - CARD_W / 2}
        y={pos.y - CARD_H / 2}
        width={CARD_W}
        height={CARD_H}
        rx={12}
        fill="var(--card)"
        stroke={probe.color}
        strokeWidth={isActive ? 1.5 : 1}
        strokeOpacity={isIdle ? 0.15 : isActive ? 0.7 : 0.4}
      />

      {/* Inner border accent line at top */}
      <line
        x1={pos.x - CARD_W / 2 + 20}
        y1={pos.y - CARD_H / 2 + 0.5}
        x2={pos.x + CARD_W / 2 - 20}
        y2={pos.y - CARD_H / 2 + 0.5}
        stroke={probe.color}
        strokeWidth={2}
        strokeOpacity={isIdle ? 0.15 : isActive ? 0.8 : 0.5}
        strokeLinecap="round"
      />

      {/* Status dot + label */}
      <circle
        cx={pos.x - CARD_W / 2 + 18}
        cy={pos.y - CARD_H / 2 + 20}
        r={3.5}
        fill={isError ? "#ef4444" : probe.color}
        opacity={isIdle ? 0.4 : 1}
      />
      {isActive && (
        <motion.circle
          cx={pos.x - CARD_W / 2 + 18}
          cy={pos.y - CARD_H / 2 + 20}
          r={3.5}
          fill={probe.color}
          animate={{ r: [3.5, 8], opacity: [0.5, 0] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      )}
      <text
        x={pos.x - CARD_W / 2 + 30}
        y={pos.y - CARD_H / 2 + 24}
        fill={probe.color}
        fontSize={10}
        fontWeight={700}
        letterSpacing={1.5}
        opacity={isIdle ? 0.4 : 1}
      >
        {probe.label}
      </text>

      {/* Divider line */}
      <line
        x1={pos.x - CARD_W / 2 + 14}
        y1={pos.y - CARD_H / 2 + 34}
        x2={pos.x + CARD_W / 2 - 14}
        y2={pos.y - CARD_H / 2 + 34}
        stroke={probe.color}
        strokeWidth={0.5}
        strokeOpacity={0.1}
      />

      {/* Cycling scan text (active) or static status */}
      <text
        x={pos.x - CARD_W / 2 + 18}
        y={pos.y + 5}
        fill={isError ? "#ef4444" : isActive ? probe.color : isDone ? "#a1a1aa" : "#71717a"}
        fontSize={9}
        opacity={isActive ? 1 : 0.9}
        fontFamily="monospace"
      >
        {isActive ? scanText : isDone ? "Data acquired" : isIdle ? "Awaiting dispatch" : "Probe failed"}
      </text>

      {/* Hex data stream when active */}
      {isActive && (
        <text
          x={pos.x - CARD_W / 2 + 18}
          y={pos.y + 19}
          fill={probe.color}
          fontSize={8}
          opacity={0.35}
          fontFamily="monospace"
        >
          {hexStream}
        </text>
      )}

      {/* Progress bar when active */}
      {isActive && (
        <g>
          <rect
            x={pos.x - CARD_W / 2 + 14}
            y={pos.y + CARD_H / 2 - 16}
            width={CARD_W - 28}
            height={3}
            rx={1.5}
            fill="var(--card-border)"
          />
          <motion.rect
            x={pos.x - CARD_W / 2 + 14}
            y={pos.y + CARD_H / 2 - 16}
            height={3}
            rx={1.5}
            fill={probe.color}
            initial={{ width: 0 }}
            animate={{ width: CARD_W - 28 }}
            transition={{ duration: 18, ease: "easeOut" }}
          />
        </g>
      )}

      {/* Completed badge */}
      {isDone && (
        <g>
          <motion.rect
            x={pos.x + CARD_W / 2 - 30}
            y={pos.y - CARD_H / 2 + 10}
            width={20}
            height={14}
            rx={7}
            fill="#10b981"
            initial={flash ? { opacity: 0, scale: 0.5 } : { opacity: 0.9 }}
            animate={{ opacity: 0.9, scale: 1 }}
            transition={{ type: "spring", stiffness: 300 }}
            style={{ transformOrigin: `${pos.x + CARD_W / 2 - 20}px ${pos.y - CARD_H / 2 + 17}px` }}
          />
          <text
            x={pos.x + CARD_W / 2 - 20}
            y={pos.y - CARD_H / 2 + 21}
            textAnchor="middle"
            fill="white"
            fontSize={9}
            fontWeight={700}
          >
            ✓
          </text>
          {/* Source count badge */}
          <text
            x={pos.x - CARD_W / 2 + 18}
            y={pos.y + 19}
            fill="#a1a1aa"
            fontSize={8}
            opacity={0.7}
            fontFamily="monospace"
          >
            {probe.type === "scout" ? "Web sources indexed" : probe.type === "analyst" ? "Live data collected" : "Sentiment analyzed"}
          </text>
        </g>
      )}

      {/* Error indicator */}
      {isError && (
        <g>
          <rect
            x={pos.x + CARD_W / 2 - 30}
            y={pos.y - CARD_H / 2 + 10}
            width={20}
            height={14}
            rx={7}
            fill="#ef4444"
            opacity={0.9}
          />
          <text
            x={pos.x + CARD_W / 2 - 20}
            y={pos.y - CARD_H / 2 + 21}
            textAnchor="middle"
            fill="white"
            fontSize={9}
            fontWeight={700}
          >
            ✕
          </text>
        </g>
      )}
    </motion.g>
  );
}

// Center node with radar sweep
function CenterNode({ topic, synthesizing, anyActive, allDone }: {
  topic: string; synthesizing: boolean; anyActive: boolean; allDone: boolean;
}) {
  const synthText = useCyclingText(SYNTH_PHRASES, synthesizing, 1800);
  const radarAngle = useRef(0);
  const [, forceRender] = useState(0);

  useEffect(() => {
    if (!synthesizing) return;
    let raf: number;
    const tick = () => {
      radarAngle.current = (radarAngle.current + 2) % 360;
      forceRender((n) => n + 1);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [synthesizing]);

  const radarR = 44;
  const radians = (radarAngle.current * Math.PI) / 180;
  const sweepX = CENTER.x + Math.cos(radians) * radarR;
  const sweepY = CENTER.y + Math.sin(radians) * radarR;

  const { lines: topicLines, fontSize: topicFontSize } = truncateTopic(topic);

  return (
    <motion.g
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 100 }}
      style={{ transformOrigin: `${CENTER.x}px ${CENTER.y}px` }}
    >
      {/* Card glow */}
      <rect
        x={CENTER.x - CENTER_W / 2}
        y={CENTER.y - CENTER_H / 2}
        width={CENTER_W}
        height={CENTER_H}
        rx={14}
        fill="#10b981"
        opacity={synthesizing ? 0.1 : anyActive ? 0.06 : 0.04}
        filter="url(#glow-md)"
      />
      {/* Card body */}
      <rect
        x={CENTER.x - CENTER_W / 2}
        y={CENTER.y - CENTER_H / 2}
        width={CENTER_W}
        height={CENTER_H}
        rx={14}
        fill="var(--card)"
        stroke="#10b981"
        strokeWidth={synthesizing ? 2 : 1.5}
        strokeOpacity={synthesizing ? 0.8 : 0.5}
      />

      {/* Top accent line */}
      <line
        x1={CENTER.x - CENTER_W / 2 + 25}
        y1={CENTER.y - CENTER_H / 2 + 0.5}
        x2={CENTER.x + CENTER_W / 2 - 25}
        y2={CENTER.y - CENTER_H / 2 + 0.5}
        stroke="#10b981"
        strokeWidth={2}
        strokeOpacity={synthesizing ? 0.9 : 0.5}
        strokeLinecap="round"
      />

      {/* Radar sweep when synthesizing */}
      {synthesizing && (
        <g>
          <circle cx={CENTER.x} cy={CENTER.y} r={radarR} fill="none" stroke="#10b981" strokeWidth={0.5} strokeOpacity={0.15} />
          <circle cx={CENTER.x} cy={CENTER.y} r={radarR * 0.6} fill="none" stroke="#10b981" strokeWidth={0.3} strokeOpacity={0.1} />
          <line
            x1={CENTER.x} y1={CENTER.y}
            x2={sweepX} y2={sweepY}
            stroke="#10b981" strokeWidth={1.5} strokeOpacity={0.6}
          />
          <circle cx={sweepX} cy={sweepY} r={2} fill="#10b981" opacity={0.8} filter="url(#glow-sm)" />
          {[10, 20, 30, 45, 60].map((offset) => {
            const trailRad = ((radarAngle.current - offset) * Math.PI) / 180;
            return (
              <circle
                key={offset}
                cx={CENTER.x + Math.cos(trailRad) * radarR}
                cy={CENTER.y + Math.sin(trailRad) * radarR}
                r={1.2}
                fill="#10b981"
                opacity={0.3 - offset * 0.004}
              />
            );
          })}
        </g>
      )}

      {/* Status badge */}
      <rect
        x={CENTER.x - 42}
        y={CENTER.y - CENTER_H / 2 + 8}
        width={84}
        height={18}
        rx={9}
        fill="#10b981"
        opacity={0.12}
      />
      <text x={CENTER.x} y={CENTER.y - CENTER_H / 2 + 22} textAnchor="middle" fill="#10b981" fontSize={8} fontWeight={600} letterSpacing={1.5}>
        {synthesizing ? "SYNTHESIZING" : allDone ? "COMPLETE" : anyActive ? "RECEIVING" : "TARGET"}
      </text>

      {/* Topic name - multi-line support */}
      {topicLines.map((line, i) => {
        const lineH = topicFontSize + 4;
        const totalH = topicLines.length * lineH;
        const startY = CENTER.y - totalH / 2 + lineH * 0.7;
        return (
          <text
            key={i}
            x={CENTER.x}
            y={startY + i * lineH}
            textAnchor="middle"
            fill="white"
            fontSize={topicFontSize}
            fontWeight={700}
          >
            {line}
          </text>
        );
      })}

      {/* Cycling synth text */}
      {synthesizing && (
        <text x={CENTER.x} y={CENTER.y + CENTER_H / 2 - 18} textAnchor="middle" fill="#10b981" fontSize={8} opacity={0.6} fontFamily="monospace">
          {synthText}
        </text>
      )}

      {/* Pulse ring when synthesizing */}
      {synthesizing && (
        <>
          <motion.rect
            x={CENTER.x - CENTER_W / 2 - 4}
            y={CENTER.y - CENTER_H / 2 - 4}
            width={CENTER_W + 8}
            height={CENTER_H + 8}
            rx={16}
            fill="none"
            stroke="#10b981"
            strokeWidth={1}
            animate={{ opacity: [0.3, 0], scale: [1, 1.06] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{ transformOrigin: `${CENTER.x}px ${CENTER.y}px` }}
          />
          <motion.rect
            x={CENTER.x - CENTER_W / 2 - 8}
            y={CENTER.y - CENTER_H / 2 - 8}
            width={CENTER_W + 16}
            height={CENTER_H + 16}
            rx={20}
            fill="none"
            stroke="#10b981"
            strokeWidth={0.5}
            animate={{ opacity: [0.15, 0], scale: [1, 1.1] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
            style={{ transformOrigin: `${CENTER.x}px ${CENTER.y}px` }}
          />
        </>
      )}
    </motion.g>
  );
}

export function ProbeNodeGraph({ topic, probes, synthesizing }: ProbeNodeGraphProps) {
  const anyActive = probes.some((p) => p.status === "searching");
  const allDone = probes.every((p) => p.status === "complete");

  return (
    <div className="w-full max-w-3xl mx-auto">
      <svg viewBox="0 0 780 540" className="w-full h-auto">
        <defs>
          <filter id="glow-sm" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="glow-md" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          {probes.map((probe) => (
            <marker
              key={`arrow-${probe.type}`}
              id={`arrow-${probe.type}`}
              viewBox="0 0 10 8"
              refX="9"
              refY="4"
              markerWidth="8"
              markerHeight="6"
              orient="auto"
            >
              <path d="M 0 0 L 10 4 L 0 8 z" fill={probe.color} opacity={0.7} />
            </marker>
          ))}
          <marker id="arrow-center" viewBox="0 0 10 8" refX="9" refY="4" markerWidth="8" markerHeight="6" orient="auto">
            <path d="M 0 0 L 10 4 L 0 8 z" fill="#10b981" opacity={0.7} />
          </marker>
        </defs>

        {/* Grid lines */}
        <g opacity={0.04} stroke="var(--accent)">
          {[100, 200, 300, 400, 500, 600, 700].map((x) => (
            <line key={`vl-${x}`} x1={x} y1={0} x2={x} y2={540} strokeWidth={0.5} />
          ))}
          {[80, 160, 240, 320, 400, 480].map((y) => (
            <line key={`hl-${y}`} x1={0} y1={y} x2={780} y2={y} strokeWidth={0.5} />
          ))}
        </g>

        {/* Connection lines */}
        {probes.map((probe, i) => {
          const pos = PROBE_POSITIONS[i];
          const isActive = probe.status === "searching";
          const isDone = probe.status === "complete";
          const isIdle = probe.status === "idle";

          const fromEdge = getEdgePoint(pos.x, pos.y, CARD_W, CARD_H, CENTER.x, CENTER.y);
          const toEdge = getEdgePoint(CENTER.x, CENTER.y, CENTER_W, CENTER_H, pos.x, pos.y);

          const midX = (fromEdge.x + toEdge.x) / 2;
          const midY = (fromEdge.y + toEdge.y) / 2;
          const offsetX = (fromEdge.y - toEdge.y) * 0.15;
          const offsetY = (toEdge.x - fromEdge.x) * 0.15;
          const cpX = midX + offsetX;
          const cpY = midY + offsetY;
          const pathD = `M ${fromEdge.x} ${fromEdge.y} Q ${cpX} ${cpY} ${toEdge.x} ${toEdge.y}`;

          return (
            <g key={`conn-${probe.type}`}>
              {/* Base path - always animated */}
              <motion.path
                d={pathD}
                fill="none"
                stroke={probe.color}
                strokeWidth={isActive ? 1.5 : isDone ? 1.2 : 0.7}
                strokeOpacity={isActive ? 0.4 : isDone ? 0.3 : 0.12}
                strokeDasharray={isActive ? "8 4" : isDone ? "12 6" : "6 8"}
                animate={{
                  strokeDashoffset: isActive
                    ? [0, -24]
                    : isDone
                      ? [0, -36]
                      : [0, -28],
                }}
                transition={{
                  duration: isActive ? 0.8 : isDone ? 3 : 5,
                  repeat: Infinity,
                  ease: "linear",
                }}
                markerEnd={`url(#arrow-${probe.type})`}
              />

              {/* Animated energy line with pulsing brightness (active only) */}
              {isActive && (
                <motion.path
                  d={pathD}
                  fill="none"
                  stroke={probe.color}
                  strokeWidth={3}
                  filter="url(#glow-sm)"
                  strokeDasharray="16 10"
                  animate={{
                    strokeDashoffset: [0, -52],
                    strokeOpacity: [0.08, 0.2, 0.08],
                  }}
                  transition={{
                    strokeDashoffset: { duration: 1, repeat: Infinity, ease: "linear" },
                    strokeOpacity: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                  }}
                />
              )}

              {/* Data particles - active: fast, many. idle/done: slow, fewer */}
              {isActive && [0, 0.7, 1.4, 2.1, 2.8].map((delay, pi) => (
                <motion.circle
                  key={delay}
                  r={pi % 2 === 0 ? 2.5 : 1.5}
                  fill={probe.color}
                  filter="url(#glow-sm)"
                  opacity={0.8}
                >
                  <animateMotion
                    dur="1.8s"
                    repeatCount="indefinite"
                    begin={`${delay}s`}
                    path={pathD}
                  />
                </motion.circle>
              ))}

              {/* Idle: 1 slow particle */}
              {isIdle && (
                <circle
                  r={1.5}
                  fill={probe.color}
                  opacity={0.25}
                >
                  <animateMotion
                    dur="6s"
                    repeatCount="indefinite"
                    path={pathD}
                  />
                </circle>
              )}

              {/* Done: 2 gentle particles */}
              {isDone && [0, 2.5].map((delay) => (
                <circle
                  key={delay}
                  r={1.8}
                  fill={probe.color}
                  opacity={0.35}
                >
                  <animateMotion
                    dur="4s"
                    repeatCount="indefinite"
                    begin={`${delay}s`}
                    path={pathD}
                  />
                </circle>
              ))}

              {/* Completed glow on path */}
              {isDone && (
                <path
                  d={pathD}
                  fill="none"
                  stroke={probe.color}
                  strokeWidth={2}
                  strokeOpacity={0.1}
                  filter="url(#glow-sm)"
                />
              )}
            </g>
          );
        })}

        {/* Synthesizer output arrows */}
        {synthesizing && (
          <g>
            <motion.line
              x1={CENTER.x} y1={CENTER.y + CENTER_H / 2}
              x2={CENTER.x} y2={CENTER.y + CENTER_H / 2 + 35}
              stroke="#10b981" strokeWidth={2} strokeOpacity={0.3}
              filter="url(#glow-sm)"
              strokeDasharray="6 4"
              animate={{ strokeDashoffset: [0, -20] }}
              transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
              markerEnd="url(#arrow-center)"
            />
          </g>
        )}

        {/* Center node */}
        <CenterNode topic={topic} synthesizing={synthesizing} anyActive={anyActive} allDone={allDone} />

        {/* Probe cards */}
        {probes.map((probe, i) => (
          <ProbeCard key={probe.type} probe={probe} pos={PROBE_POSITIONS[i]} index={i} />
        ))}

        {/* HUD frame corners */}
        <g opacity={0.1} stroke="var(--accent)" strokeWidth={1}>
          <polyline points="15,15 15,40" fill="none" />
          <polyline points="15,15 40,15" fill="none" />
          <polyline points="765,15 765,40" fill="none" />
          <polyline points="765,15 740,15" fill="none" />
          <polyline points="15,525 15,500" fill="none" />
          <polyline points="15,525 40,525" fill="none" />
          <polyline points="765,525 765,500" fill="none" />
          <polyline points="765,525 740,525" fill="none" />
        </g>

        {/* Bottom status bar */}
        <text x={20} y={535} fill="#71717a" fontSize={8} opacity={0.5} letterSpacing={1}>
          PROBE v1.0 // NOSANA NETWORK
        </text>
        <text x={760} y={535} textAnchor="end" fill={anyActive || synthesizing ? "#10b981" : "#71717a"} fontSize={8} opacity={anyActive || synthesizing ? 0.8 : 0.5} letterSpacing={1}>
          {synthesizing ? "● SYNTHESIZING REPORT" : anyActive ? "● PROBES ACTIVE" : allDone ? "● COMPLETE" : "○ STANDBY"}
        </text>
      </svg>
    </div>
  );
}
