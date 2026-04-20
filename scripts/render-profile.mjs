#!/usr/bin/env node
// Render assets/profile.svg + 4 social badges with live tokscale data,
// inlining the contribution snake from a local intermediate SVG.

import fs from "node:fs";
import path from "node:path";

const USER = "yousiki";
const OUT = path.resolve("assets/profile.svg");
const BADGE_DIR = path.resolve("assets/badges");
const SNAKE_PATH = path.resolve("dist/snake.svg");

async function fetchMetric(metric) {
  const url = `https://tokscale.ai/api/badge/${USER}/svg?metric=${metric}`;
  const res = await fetch(url, { headers: { "cache-control": "no-cache" } });
  if (!res.ok) throw new Error(`fetch ${metric} → ${res.status}`);
  const text = await res.text();
  const match = text.match(/aria-label="Tokscale [^:]+:\s*([^"]+)"/);
  if (!match) throw new Error(`could not parse ${metric} from badge SVG`);
  return match[1].trim();
}

async function readSnake() {
  try {
    return await fs.promises.readFile(SNAKE_PATH, "utf8");
  } catch {
    return null;
  }
}

function extractSnakeBody(raw) {
  if (!raw) return null;
  const m = raw.match(/<svg[^>]*>([\s\S]*)<\/svg>/);
  if (!m) return null;
  // Scope CSS: snake SVG uses :root for CSS vars, which would bind to
  // outer svg in a nested context. Rewrite to a class we control.
  return m[1].replace(/:root\s*\{/g, ".sn-root{");
}

function abbrev(numStr) {
  const n = Number(String(numStr).replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(n)) return "—";
  if (n >= 1e9) return `${(n / 1e9).toFixed(n >= 1e10 ? 0 : 1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(n >= 1e4 ? 1 : 2)}K`;
  return n.toLocaleString("en-US");
}

function formatCost(s) {
  const n = Number(String(s).replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(n)) return "—";
  if (n >= 1000) return `$${(n / 1000).toFixed(2)}K`;
  return `$${n.toFixed(2)}`;
}

function formatTokyoTimestamp(date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date).reduce((acc, p) => ((acc[p.type] = p.value), acc), {});
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute} JST`;
}

function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

async function main() {
  const [tokensRaw, costRaw, rankRaw, snakeRaw] = await Promise.all([
    fetchMetric("tokens"),
    fetchMetric("cost"),
    fetchMetric("rank"),
    readSnake(),
  ]);

  const data = {
    tokens: abbrev(tokensRaw),
    cost: formatCost(costRaw),
    rank: rankRaw.startsWith("#") ? rankRaw : `#${rankRaw}`,
    updatedAt: formatTokyoTimestamp(new Date()),
    snake: extractSnakeBody(snakeRaw),
  };

  console.log(`tokens=${data.tokens}  cost=${data.cost}  rank=${data.rank}  snake=${data.snake ? `inlined:${SNAKE_PATH}` : `missing:${SNAKE_PATH}`}`);

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, renderProfile(data));
  console.log(`✓ wrote ${OUT} · ${fs.statSync(OUT).size} bytes`);

  fs.mkdirSync(BADGE_DIR, { recursive: true });
  const badges = [
    { file: "website.svg",  label: "WEBSITE",     value: "siki.moe" },
    { file: "linkedin.svg", label: "LINKEDIN",    value: "yousiki" },
    { file: "scholar.svg",  label: "PUBLICATION", value: "google scholar" },
    { file: "twitter.svg",  label: "TWITTER",     value: "@__yousiki__" },
  ];
  for (const b of badges) {
    fs.writeFileSync(path.join(BADGE_DIR, b.file), renderBadge(b.label, b.value));
  }
  console.log(`✓ wrote ${badges.length} badges to ${BADGE_DIR}/`);
}

function renderProfile({ tokens, cost, rank, updatedAt, snake }) {
  const W = 900;
  const H = 1100; // compressed from 1520
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="YouSiki — PhD student by day, vibe coder by night · ${esc(tokens)} tokens / ${esc(cost)} / rank ${esc(rank)}" width="100%">
  <defs>
    <linearGradient id="pBg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#FAF9F5"/>
      <stop offset="1" stop-color="#F0EEE6"/>
    </linearGradient>
    <radialGradient id="pGlowA" cx="0.9" cy="0.05" r="0.4">
      <stop offset="0" stop-color="#D97757" stop-opacity="0.28"/>
      <stop offset="1" stop-color="#D97757" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="pGlowB" cx="0.08" cy="0.45" r="0.32">
      <stop offset="0" stop-color="#D4A27F" stop-opacity="0.24"/>
      <stop offset="1" stop-color="#D4A27F" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="pGlowC" cx="0.92" cy="0.82" r="0.35">
      <stop offset="0" stop-color="#D97757" stop-opacity="0.22"/>
      <stop offset="1" stop-color="#D97757" stop-opacity="0"/>
    </radialGradient>
    <filter id="pSoft" x="-10%" y="-10%" width="120%" height="120%">
      <feGaussianBlur stdDeviation="28"/>
    </filter>
    <style>
      .serif { font-family: ui-serif, "Source Serif Pro", "Iowan Old Style", Georgia, "Times New Roman", serif; }
      .sans  { font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Inter, system-ui, sans-serif; }
      .mono  { font-family: "SF Mono", ui-monospace, "JetBrains Mono", Menlo, Consolas, monospace; }
      .ink { fill: #141413; }
      .muted { fill: #5E5D59; }
      .coral { fill: #D97757; }
      .deep-coral { fill: #C6613F; }
      .tan { fill: #D4A27F; }
    </style>
  </defs>

  <rect width="${W}" height="${H}" rx="22" fill="url(#pBg)"/>
  <g>
    <circle cx="800" cy="60" r="260" fill="url(#pGlowA)" filter="url(#pSoft)">
      <animate attributeName="r" values="240;280;240" dur="9s" repeatCount="indefinite"/>
    </circle>
    <circle cx="72" cy="500" r="240" fill="url(#pGlowB)" filter="url(#pSoft)">
      <animate attributeName="r" values="220;260;220" dur="11s" repeatCount="indefinite"/>
    </circle>
    <circle cx="820" cy="900" r="240" fill="url(#pGlowC)" filter="url(#pSoft)">
      <animate attributeName="r" values="220;260;220" dur="13s" repeatCount="indefinite"/>
    </circle>
  </g>

  <!-- window chrome -->
  <g transform="translate(28,24)">
    <circle cx="7"  cy="7" r="6" fill="#E8A598"/>
    <circle cx="28" cy="7" r="6" fill="#E8D598"/>
    <circle cx="49" cy="7" r="6" fill="#B8D5A3"/>
    <text x="84" y="11" class="mono muted" font-size="12">~ / yousiki / profile.md</text>
    <text x="840" y="11" class="mono muted" font-size="11" letter-spacing="1.5" text-anchor="end">updated ${esc(updatedAt)}</text>
  </g>

  <!-- ═════════ ABOUT ═════════ -->
  <line x1="40" y1="62" x2="860" y2="62" stroke="#D97757" stroke-opacity="0.22"/>
  ${rotatingStar({ x: 48, y: 86, dur: 18 })}
  <text x="64" y="90" class="mono muted" font-size="11" letter-spacing="2">ABOUT</text>

  <!-- left column: hero text -->
  <g transform="translate(40,140)">
    <text class="serif ink" font-size="46" font-weight="500" letter-spacing="-1.4">Hi — I'm <tspan class="coral" font-style="italic">YouSiki</tspan>.</text>
    <text y="36" class="serif ink" font-size="22" font-weight="400" letter-spacing="-0.3" fill-opacity="0.82">
      <tspan class="coral" font-style="italic">PhD student</tspan> by day. <tspan class="coral" font-style="italic">Vibe coder</tspan> by night.
    </text>
    <text y="68" class="sans muted" font-size="13" font-style="italic">
      Computer vision, <tspan class="ink" font-weight="500" font-style="normal">neuromorphic camera</tspan>, <tspan class="ink" font-weight="500" font-style="normal">world models</tspan> · Beijing &amp; Tokyo.
    </text>
  </g>

  <!-- right column: affiliation chips stacked -->
  <g transform="translate(560,130)" class="sans">
    <g>
      <rect width="300" height="34" rx="17" fill="#D97757" fill-opacity="0.14"/>
      <path d="M20 25 L22 19 L28 17 L22 15 L20 9 L18 15 L12 17 L18 19 Z" fill="#D97757"/>
      <text x="40" y="22" font-size="13" class="coral" font-weight="600">Peking University</text>
      <text x="280" y="22" font-size="11" class="muted" text-anchor="end">Beijing</text>
    </g>
    <g transform="translate(0,44)">
      <rect width="300" height="34" rx="17" fill="#D97757" fill-opacity="0.14"/>
      <path d="M20 25 L22 19 L28 17 L22 15 L20 9 L18 15 L12 17 L18 19 Z" fill="#D97757"/>
      <text x="40" y="22" font-size="13" class="coral" font-weight="600">Shanda AI Research</text>
      <text x="280" y="22" font-size="11" class="muted" text-anchor="end">Tokyo</text>
    </g>
  </g>

  <!-- ═════════ VIBE CODING DASHBOARD ═════════ -->
  <line x1="40" y1="250" x2="860" y2="250" stroke="#D97757" stroke-opacity="0.22"/>
  ${rotatingStar({ x: 48, y: 274, dur: 22 })}
  <text x="64" y="278" class="mono muted" font-size="11" letter-spacing="2">VIBE · CODING · DASHBOARD</text>
  <text x="844" y="278" class="mono muted" font-size="11" letter-spacing="1" text-anchor="end">
    <tspan class="coral" font-weight="600">●</tspan> live · tokscale.ai/u/yousiki
  </text>

  <g transform="translate(40,318)">
    <text y="0" class="mono muted" font-size="11" letter-spacing="1">tokens</text>
    <text y="52" class="serif coral" font-size="54" font-weight="500" letter-spacing="-1.8">${esc(tokens)}</text>
    <text y="76" class="sans muted" font-size="12" font-style="italic">conjured with agents</text>
  </g>
  <line x1="296" y1="322" x2="296" y2="400" stroke="#D97757" stroke-opacity="0.16" stroke-dasharray="2 4"/>
  <g transform="translate(328,318)">
    <text y="0" class="mono muted" font-size="11" letter-spacing="1">spent</text>
    <text y="52" class="serif ink" font-size="54" font-weight="500" letter-spacing="-1.8">${esc(cost)}</text>
    <text y="76" class="sans muted" font-size="12" font-style="italic">cost of thinking out loud</text>
  </g>
  <line x1="604" y1="322" x2="604" y2="400" stroke="#D97757" stroke-opacity="0.16" stroke-dasharray="2 4"/>
  <g transform="translate(636,318)">
    <text y="0" class="mono muted" font-size="11" letter-spacing="1">global rank</text>
    <text y="52" class="serif deep-coral" font-size="54" font-weight="500" letter-spacing="-1.8">${esc(rank)}</text>
    <text y="76" class="sans muted" font-size="12" font-style="italic">on the tokscale leaderboard</text>
  </g>

  <!-- animated sparkline -->
  <g transform="translate(40,416)">
    <path d="M0 8 Q40 0 80 6 T160 4 T240 10 T320 2 T400 8 T480 5 T560 9 T640 3 T720 7 T800 2 L820 6"
          fill="none" stroke="#D97757" stroke-width="1.6" stroke-linecap="round" stroke-opacity="0.55"
          stroke-dasharray="1400" stroke-dashoffset="1400">
      <animate attributeName="stroke-dashoffset" values="1400;0" dur="4.5s" begin="0.3s" fill="freeze"/>
      <animate attributeName="stroke-dashoffset" values="0;1400;0" dur="18s" begin="5s" repeatCount="indefinite"/>
    </path>
  </g>

  <!-- ═════════ VIBE CODING STACK ═════════ -->
  <line x1="40" y1="450" x2="860" y2="450" stroke="#D97757" stroke-opacity="0.22"/>
  ${rotatingStar({ x: 48, y: 474, dur: 26 })}
  <text x="64" y="478" class="mono muted" font-size="11" letter-spacing="2">VIBE · CODING · STACK</text>
  <text x="844" y="478" class="mono muted" font-size="11" letter-spacing="1" text-anchor="end">3 · companions</text>

  ${stackCard({ x: 40,  y: 504, delay: 0,     label: "primary agent", pre: "",        italic: "claude",   post: " code", caption: "best model so far",                 models: "opus · sonnet · haiku" })}
  ${stackCard({ x: 328, y: 504, delay: -0.93, label: "second brain",  pre: "",        italic: "codex",    post: "",      caption: "best consultant & reviewer",        models: "gpt-5.4 xhigh" })}
  ${stackCard({ x: 624, y: 504, delay: -1.87, label: "first love",    pre: "oh-my-",  italic: "opencode", post: "",      caption: "favorite philosophy, open society", models: "glm · kimi · mimo" })}
  <line x1="312" y1="512" x2="312" y2="600" stroke="#D97757" stroke-opacity="0.16" stroke-dasharray="2 4"/>
  <line x1="608" y1="512" x2="608" y2="600" stroke="#D97757" stroke-opacity="0.16" stroke-dasharray="2 4"/>

  <!-- ═════════ TECH STACK ═════════ -->
  <line x1="40" y1="632" x2="860" y2="632" stroke="#D97757" stroke-opacity="0.22"/>
  ${rotatingStar({ x: 48, y: 656, dur: 30 })}
  <text x="64" y="660" class="mono muted" font-size="11" letter-spacing="2">TECH · STACK</text>
  <text x="844" y="660" class="mono muted" font-size="11" letter-spacing="1" text-anchor="end">research · infra</text>

  ${techStack({ y: 684 })}

  <!-- ═════════ CONTRIBUTION CANVAS ═════════ -->
  <line x1="40" y1="772" x2="860" y2="772" stroke="#D97757" stroke-opacity="0.22"/>
  ${rotatingStar({ x: 48, y: 796, dur: 34 })}
  <text x="64" y="800" class="mono muted" font-size="11" letter-spacing="2">CONTRIBUTION · CANVAS</text>
  <text x="844" y="800" class="mono muted" font-size="11" letter-spacing="1.5" text-anchor="end">past year</text>

  ${snakeSection({ y: 822, snake })}

  <!-- ═════════ OUTBOUND LINKS ═════════ -->
  <line x1="40" y1="1024" x2="860" y2="1024" stroke="#D97757" stroke-opacity="0.22"/>
  <g transform="translate(450,1064)" text-anchor="middle">
    <text class="mono muted" font-size="11" letter-spacing="1.5">✳︎ find me elsewhere · links below ·</text>
  </g>
</svg>
`;
}

function rotatingStar({ x, y, dur }) {
  return `
  <g transform="translate(${x},${y})">
    <path d="M0 -6 L1.6 -1.6 L6 0 L1.6 1.6 L0 6 L-1.6 1.6 L-6 0 L-1.6 -1.6 Z" class="coral">
      <animateTransform attributeName="transform" type="rotate" values="0;360" dur="${dur}s" repeatCount="indefinite"/>
    </path>
  </g>`;
}

function stackCard({ x, y, delay, label, pre, italic, post, caption, models }) {
  return `
  <g transform="translate(${x},${y})">
    <circle cx="10" cy="10" r="5" class="coral">
      <animate attributeName="r" values="4.6;5.6;4.6" dur="2.8s" begin="${delay}s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.55;1;0.55" dur="2.8s" begin="${delay}s" repeatCount="indefinite"/>
    </circle>
    <circle cx="10" cy="10" r="11" fill="none" stroke="#D97757" stroke-opacity="0.28"/>
    <text x="32" y="14" class="mono muted" font-size="10" letter-spacing="1">${esc(label)}</text>
    <text y="46" class="serif ink" font-size="26" font-weight="500" letter-spacing="-0.4">${esc(pre)}<tspan class="coral" font-style="italic">${esc(italic)}</tspan>${esc(post)}</text>
    <line x1="0" y1="58" x2="40" y2="58" stroke="#141413" stroke-width="2"/>
    <text y="76" class="sans muted" font-size="12" font-style="italic">${esc(caption)}</text>
    <text y="92" class="mono ink" font-size="11" fill-opacity="0.72">${esc(models)}</text>
  </g>`;
}

function techStack({ y }) {
  const items = [
    { name: "PyTorch",    sub: "most popular" },
    { name: "JAX",        sub: "leading edge" },
    { name: "TensorFlow", sub: "legacy" },
    { name: "Docker",     sub: "deploy everywhere" },
    { name: "Nix",        sub: "reproducible" },
  ];
  const cellW = 152;
  const gap = 12;
  const startX = 40;
  const rowH = 60;
  return `
  <g transform="translate(0,${y})" class="sans">
    ${items.map((it, i) => `
    <g transform="translate(${startX + i * (cellW + gap)},0)">
      <rect width="${cellW}" height="${rowH}" rx="12" fill="#141413" fill-opacity="0.04" stroke="#D97757" stroke-opacity="0.22"/>
      <text x="${cellW / 2}" y="28" class="serif ink" font-size="20" font-weight="500" letter-spacing="-0.3" text-anchor="middle">${esc(it.name)}</text>
      <text x="${cellW / 2}" y="46" class="mono muted" font-size="10" letter-spacing="0.6" text-anchor="middle">${esc(it.sub)}</text>
    </g>`).join("")}
  </g>`;
}

function snakeSection({ y, snake }) {
  if (!snake) {
    return `
  <g transform="translate(40,${y + 30})">
    <text class="mono muted" font-size="12" fill-opacity="0.7">snake generating — check back after the next workflow run</text>
  </g>`;
  }
  return `
  <svg class="sn-root" x="40" y="${y}" width="820" height="180" viewBox="-16 -32 880 192" preserveAspectRatio="xMidYMid meet">
    ${snake}
  </svg>`;
}

function renderBadge(label, value) {
  // Total SVG width 196; inner rect width 180 centered with 8px padding
  // on each side. When 4 badges sit adjacent, padding contributes a
  // 16px visual gap between them, so they don't touch.
  // 4 × 196 = 784, which fits GitHub's ~796px README content column.
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 196 52" role="img" aria-label="${esc(label)}: ${esc(value)}" width="196" height="52">
  <defs>
    <linearGradient id="bBg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#FAF9F5"/>
      <stop offset="1" stop-color="#F0EEE6"/>
    </linearGradient>
    <style>
      .serif { font-family: ui-serif, "Source Serif Pro", Georgia, serif; }
      .mono  { font-family: "SF Mono", ui-monospace, Menlo, Consolas, monospace; }
    </style>
  </defs>
  <rect x="8" y="2" width="180" height="48" rx="10" fill="url(#bBg)" stroke="#D97757" stroke-opacity="0.30"/>
  <path d="M22 26 L24 20 L30 18 L24 16 L22 10 L20 16 L14 18 L20 20 Z" fill="#D97757"/>
  <text x="38" y="22" class="mono" fill="#5E5D59" font-size="10" letter-spacing="1.4">${esc(label)}</text>
  <text x="38" y="40" class="serif" fill="#141413" font-size="15" font-weight="500" letter-spacing="-0.2">${esc(value)}</text>
</svg>
`;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
