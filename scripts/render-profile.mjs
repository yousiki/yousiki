#!/usr/bin/env node
// Render assets/profile.svg + 4 social badges with live tokscale data,
// inlining the contribution snake from the output branch.

import fs from "node:fs";
import path from "node:path";

const USER = "yousiki";
const OUT = path.resolve("assets/profile.svg");
const BADGE_DIR = path.resolve("assets/badges");
const SNAKE_URL = `https://raw.githubusercontent.com/${USER}/${USER}/output/snake.svg`;

async function fetchMetric(metric) {
  const url = `https://tokscale.ai/api/badge/${USER}/svg?metric=${metric}`;
  const res = await fetch(url, { headers: { "cache-control": "no-cache" } });
  if (!res.ok) throw new Error(`fetch ${metric} → ${res.status}`);
  const text = await res.text();
  const match = text.match(/aria-label="Tokscale [^:]+:\s*([^"]+)"/);
  if (!match) throw new Error(`could not parse ${metric} from badge SVG`);
  return match[1].trim();
}

async function fetchSnake() {
  try {
    const res = await fetch(SNAKE_URL, { headers: { "cache-control": "no-cache" } });
    if (!res.ok) return null;
    return await res.text();
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
  const scoped = m[1].replace(/:root\s*\{/g, ".sn-root{");
  return scoped;
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

function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

async function main() {
  const [tokensRaw, costRaw, rankRaw, snakeRaw] = await Promise.all([
    fetchMetric("tokens"),
    fetchMetric("cost"),
    fetchMetric("rank"),
    fetchSnake(),
  ]);

  const data = {
    tokens: abbrev(tokensRaw),
    cost: formatCost(costRaw),
    rank: rankRaw.startsWith("#") ? rankRaw : `#${rankRaw}`,
    updatedAt: new Date().toISOString().slice(0, 16).replace("T", " ") + " UTC",
    snake: extractSnakeBody(snakeRaw),
  };

  console.log(`tokens=${data.tokens}  cost=${data.cost}  rank=${data.rank}  snake=${data.snake ? "inlined" : "missing"}`);

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, renderProfile(data));
  console.log(`✓ wrote ${OUT} · ${fs.statSync(OUT).size} bytes`);

  fs.mkdirSync(BADGE_DIR, { recursive: true });
  const badges = [
    { file: "website.svg", label: "WEBSITE", value: "siki.moe" },
    { file: "linkedin.svg", label: "LINKEDIN", value: "yousiki" },
    { file: "scholar.svg", label: "SCHOLAR", value: "publications" },
    { file: "twitter.svg", label: "TWITTER", value: "@__yousiki__" },
  ];
  for (const b of badges) {
    fs.writeFileSync(path.join(BADGE_DIR, b.file), renderBadge(b.label, b.value));
  }
  console.log(`✓ wrote ${badges.length} badges to ${BADGE_DIR}/`);
}

function renderProfile({ tokens, cost, rank, updatedAt, snake }) {
  const H = 1520;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 ${H}" role="img" aria-label="YouSiki — PhD student by day, vibe coder by night · ${esc(tokens)} tokens / ${esc(cost)} / rank ${esc(rank)}" width="100%">
  <defs>
    <linearGradient id="pBg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#FAF9F5"/>
      <stop offset="1" stop-color="#F0EEE6"/>
    </linearGradient>
    <radialGradient id="pGlowA" cx="0.85" cy="0.05" r="0.45">
      <stop offset="0" stop-color="#D97757" stop-opacity="0.30"/>
      <stop offset="1" stop-color="#D97757" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="pGlowB" cx="0.08" cy="0.42" r="0.35">
      <stop offset="0" stop-color="#D4A27F" stop-opacity="0.26"/>
      <stop offset="1" stop-color="#D4A27F" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="pGlowC" cx="0.92" cy="0.75" r="0.4">
      <stop offset="0" stop-color="#D97757" stop-opacity="0.24"/>
      <stop offset="1" stop-color="#D97757" stop-opacity="0"/>
    </radialGradient>
    <filter id="pSoft" x="-10%" y="-10%" width="120%" height="120%">
      <feGaussianBlur stdDeviation="32"/>
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

  <rect width="900" height="${H}" rx="22" fill="url(#pBg)"/>
  <g>
    <circle cx="780" cy="80" r="280" fill="url(#pGlowA)" filter="url(#pSoft)">
      <animate attributeName="r" values="260;300;260" dur="9s" repeatCount="indefinite"/>
    </circle>
    <circle cx="80" cy="640" r="260" fill="url(#pGlowB)" filter="url(#pSoft)">
      <animate attributeName="r" values="240;280;240" dur="11s" repeatCount="indefinite"/>
    </circle>
    <circle cx="820" cy="1140" r="260" fill="url(#pGlowC)" filter="url(#pSoft)">
      <animate attributeName="r" values="240;280;240" dur="13s" repeatCount="indefinite"/>
    </circle>
  </g>

  <!-- window chrome -->
  <g transform="translate(32,28)">
    <circle cx="7"  cy="7" r="6" fill="#E8A598"/>
    <circle cx="28" cy="7" r="6" fill="#E8D598"/>
    <circle cx="49" cy="7" r="6" fill="#B8D5A3"/>
    <text x="84" y="11" class="mono muted" font-size="12">~ / yousiki / profile.md</text>
    <text x="836" y="11" class="mono muted" font-size="11" letter-spacing="1.5" text-anchor="end">updated ${esc(updatedAt)}</text>
  </g>

  <!-- ═════ ABOUT ═════ -->
  ${sectionHeader({ y: 88, label: "ABOUT", right: "", rotDur: 18 })}
  <g transform="translate(40,180)">
    <text class="serif ink" font-size="56" font-weight="500" letter-spacing="-1.6">Hi — I'm <tspan class="coral" font-style="italic">YouSiki</tspan>.</text>
    <text y="48" class="serif ink" font-size="26" font-weight="400" letter-spacing="-0.4" fill-opacity="0.82">
      PhD student by day. <tspan class="coral" font-style="italic">Vibe coder</tspan> by night.
    </text>
    <text y="84" class="sans muted" font-size="15" font-style="italic">
      Computer vision &amp; <tspan class="ink" font-weight="500" font-style="normal">world models</tspan> · based in Beijing &amp; Tokyo.
    </text>
  </g>
  ${affiliationChips({ y: 316 })}

  <!-- ═════ VIBE CODING DASHBOARD ═════ -->
  ${sectionHeader({ y: 400, label: "VIBE · CODING · DASHBOARD", right: `<tspan class="coral" font-weight="600">●</tspan> LIVE · tokscale.ai/u/yousiki`, rotDur: 22 })}
  ${dashboardNumbers({ y: 488, tokens, cost, rank })}
  ${sparkline({ y: 596 })}

  <!-- ═════ VIBE CODING STACK ═════ -->
  ${sectionHeader({ y: 668, label: "VIBE · CODING · STACK", right: "3 · COMPANIONS", rotDur: 26 })}
  ${stackCard({ x: 40,  y: 760, delay: 0,     label: "PRIMARY AGENT", name: "claude", italic: "code",        caption: "best model so far",               models: "opus · sonnet · haiku" })}
  ${stackCard({ x: 328, y: 760, delay: -0.93, label: "SECOND BRAIN",  name: "",       italic: "codex",        caption: "best consultant & reviewer",       models: "gpt-5.4 xhigh" })}
  ${stackCard({ x: 624, y: 760, delay: -1.87, label: "FIRST LOVE",    name: "oh-my-",  italic: "opencode",   caption: "favorite philosophy, open society", models: "GLM · Mimo · Kimi · …" })}
  <line x1="312" y1="770" x2="312" y2="890" stroke="#D97757" stroke-opacity="0.16" stroke-dasharray="2 4"/>
  <line x1="608" y1="770" x2="608" y2="890" stroke="#D97757" stroke-opacity="0.16" stroke-dasharray="2 4"/>

  <!-- ═════ TECH STACK ═════ -->
  ${sectionHeader({ y: 940, label: "TECH · STACK", right: "research · infra · shell", rotDur: 30 })}
  ${techStack({ y: 1020 })}

  <!-- ═════ CONTRIBUTION CANVAS ═════ -->
  ${sectionHeader({ y: 1140, label: "CONTRIBUTION · CANVAS", right: "past year", rotDur: 34 })}
  ${snakeSection({ y: 1200, snake })}

  <!-- ═════ OUTBOUND LINKS ═════ -->
  <line x1="40" y1="1430" x2="860" y2="1430" stroke="#D97757" stroke-opacity="0.22"/>
  ${outboundNote({ y: 1480 })}
</svg>
`;
}

function sectionHeader({ y, label, right, rotDur }) {
  const rightText = right
    ? `<text x="820" y="4" class="mono muted" font-size="11" letter-spacing="1.5" text-anchor="end">${right}</text>`
    : "";
  return `
  <line x1="40" y1="${y - 40}" x2="860" y2="${y - 40}" stroke="#D97757" stroke-opacity="0.22"/>
  <g transform="translate(48,${y})">
    <g transform="translate(0,0)">
      <path d="M0 -7 L1.8 -1.8 L7 0 L1.8 1.8 L0 7 L-1.8 1.8 L-7 0 L-1.8 -1.8 Z" class="coral">
        <animateTransform attributeName="transform" type="rotate" values="0;360" dur="${rotDur}s" repeatCount="indefinite"/>
      </path>
    </g>
    <text x="16" y="4" class="mono muted" font-size="11" letter-spacing="2">${label}</text>
    ${rightText}
  </g>`;
}

function affiliationChips({ y }) {
  return `
  <g transform="translate(40,${y})" class="sans">
    <g>
      <rect width="180" height="30" rx="15" fill="#D97757" fill-opacity="0.14"/>
      <text x="15" y="19" font-size="12" class="coral" font-weight="600">✳︎ Peking University</text>
    </g>
    <g transform="translate(192,0)">
      <rect width="238" height="30" rx="15" fill="#D97757" fill-opacity="0.14"/>
      <text x="15" y="19" font-size="12" class="coral" font-weight="600">✳︎ Shanda AI Research · Tokyo</text>
    </g>
  </g>`;
}

function dashboardNumbers({ y, tokens, cost, rank }) {
  return `
  <g transform="translate(40,${y})">
    <text y="0" class="mono muted" font-size="11" letter-spacing="1.5">TOKENS</text>
    <text y="62" class="serif coral" font-size="64" font-weight="500" letter-spacing="-2">${esc(tokens)}</text>
    <text y="92" class="sans muted" font-size="13" font-style="italic">conjured with agents</text>
  </g>
  <line x1="296" y1="${y + 6}" x2="296" y2="${y + 96}" stroke="#D97757" stroke-opacity="0.16" stroke-dasharray="2 4"/>
  <g transform="translate(328,${y})">
    <text y="0" class="mono muted" font-size="11" letter-spacing="1.5">SPENT</text>
    <text y="62" class="serif ink" font-size="64" font-weight="500" letter-spacing="-2">${esc(cost)}</text>
    <text y="92" class="sans muted" font-size="13" font-style="italic">cost of thinking out loud</text>
  </g>
  <line x1="604" y1="${y + 6}" x2="604" y2="${y + 96}" stroke="#D97757" stroke-opacity="0.16" stroke-dasharray="2 4"/>
  <g transform="translate(636,${y})">
    <text y="0" class="mono muted" font-size="11" letter-spacing="1.5">GLOBAL RANK</text>
    <text y="62" class="serif deep-coral" font-size="64" font-weight="500" letter-spacing="-2">${esc(rank)}</text>
    <text y="92" class="sans muted" font-size="13" font-style="italic">on the tokscale leaderboard</text>
  </g>`;
}

function sparkline({ y }) {
  return `
  <g transform="translate(40,${y})">
    <path d="M0 8 Q40 0 80 6 T160 4 T240 10 T320 2 T400 8 T480 5 T560 9 T640 3 T720 7 T800 2 L820 6"
          fill="none" stroke="#D97757" stroke-width="1.6" stroke-linecap="round" stroke-opacity="0.55"
          stroke-dasharray="1400" stroke-dashoffset="1400">
      <animate attributeName="stroke-dashoffset" values="1400;0" dur="4.5s" begin="0.3s" fill="freeze"/>
      <animate attributeName="stroke-dashoffset" values="0;1400;0" dur="18s" begin="5s" repeatCount="indefinite"/>
    </path>
  </g>`;
}

function stackCard({ x, y, delay, label, name, italic, caption, models }) {
  return `
  <g transform="translate(${x},${y})">
    <circle cx="10" cy="10" r="5" class="coral">
      <animate attributeName="r" values="4.8;5.8;4.8" dur="2.8s" begin="${delay}s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.55;1;0.55" dur="2.8s" begin="${delay}s" repeatCount="indefinite"/>
    </circle>
    <circle cx="10" cy="10" r="11" fill="none" stroke="#D97757" stroke-opacity="0.28"/>
    <text x="32" y="14" class="mono muted" font-size="10" letter-spacing="1.2">${esc(label)}</text>
    <text y="54" class="serif ink" font-size="28" font-weight="500" letter-spacing="-0.5">${esc(name)}<tspan class="coral" font-style="italic">${esc(italic)}</tspan></text>
    <line x1="0" y1="70" x2="44" y2="70" stroke="#141413" stroke-width="2"/>
    <text y="92" class="sans muted" font-size="12" font-style="italic">${esc(caption)}</text>
    <text y="110" class="mono ink" font-size="11" fill-opacity="0.72">${esc(models)}</text>
  </g>`;
}

function techStack({ y }) {
  const items = [
    { name: "PyTorch",    sub: "models" },
    { name: "JAX",        sub: "research" },
    { name: "TensorFlow", sub: "legacy" },
    { name: "Docker",     sub: "deploy" },
    { name: "Nix",        sub: "reproducible" },
  ];
  const cellW = 152;
  const gap = 12;
  const startX = 40;
  return `
  <g transform="translate(0,${y})" class="sans">
    ${items.map((it, i) => `
    <g transform="translate(${startX + i * (cellW + gap)},0)">
      <rect width="${cellW}" height="74" rx="14" fill="#141413" fill-opacity="0.04" stroke="#D97757" stroke-opacity="0.22"/>
      <text x="${cellW / 2}" y="34" class="serif ink" font-size="22" font-weight="500" letter-spacing="-0.4" text-anchor="middle">${esc(it.name)}</text>
      <text x="${cellW / 2}" y="56" class="mono muted" font-size="10" letter-spacing="1.5" text-anchor="middle">${esc(it.sub.toUpperCase())}</text>
    </g>`).join("")}
  </g>`;
}

function snakeSection({ y, snake }) {
  if (!snake) {
    return `
  <g transform="translate(40,${y})">
    <text class="mono muted" font-size="12" fill-opacity="0.7">snake generating — check back after the next workflow run</text>
  </g>`;
  }
  // Snake native viewBox is "-16 -32 880 192". Embed as nested svg into 820×180 region.
  return `
  <svg class="sn-root" x="40" y="${y}" width="820" height="180" viewBox="-16 -32 880 192" preserveAspectRatio="xMidYMid meet">
    ${snake}
  </svg>`;
}

function outboundNote({ y }) {
  return `
  <g transform="translate(450,${y})" text-anchor="middle">
    <text class="mono muted" font-size="11" letter-spacing="1.5">✳︎ find me elsewhere · links below ·</text>
  </g>`;
}

function renderBadge(label, value) {
  // 200 × 52: sized so four badges fit the GitHub profile README
  // column (narrower than a full page thanks to the sidebar).
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 52" role="img" aria-label="${esc(label)}: ${esc(value)}" width="200" height="52">
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
  <rect width="200" height="52" rx="10" fill="url(#bBg)" stroke="#D97757" stroke-opacity="0.28"/>
  <path d="M16 26 L18 20 L24 18 L18 16 L16 10 L14 16 L8 18 L14 20 Z" fill="#D97757"/>
  <text x="32" y="22" class="mono" fill="#5E5D59" font-size="10" letter-spacing="1.4">${esc(label)}</text>
  <text x="32" y="40" class="serif" fill="#141413" font-size="16" font-weight="500" letter-spacing="-0.2">${esc(value)}</text>
</svg>
`;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
