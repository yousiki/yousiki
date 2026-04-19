#!/usr/bin/env node
// Render assets/profile.svg with live tokscale data.
// Scrapes the three public badge SVGs for tokens / cost / rank,
// formats them, then writes a single unified profile SVG.

import fs from "node:fs";
import path from "node:path";

const USER = "yousiki";
const OUT = path.resolve("assets/profile.svg");

async function fetchMetric(metric) {
  const url = `https://tokscale.ai/api/badge/${USER}/svg?metric=${metric}`;
  const res = await fetch(url, { headers: { "cache-control": "no-cache" } });
  if (!res.ok) throw new Error(`fetch ${metric} → ${res.status}`);
  const text = await res.text();
  const match = text.match(/aria-label="Tokscale [^:]+:\s*([^"]+)"/);
  if (!match) throw new Error(`could not parse ${metric} from badge SVG`);
  return match[1].trim();
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
  const [tokensRaw, costRaw, rankRaw] = await Promise.all([
    fetchMetric("tokens"),
    fetchMetric("cost"),
    fetchMetric("rank"),
  ]);

  const data = {
    tokens: abbrev(tokensRaw),
    cost: formatCost(costRaw),
    rank: rankRaw.startsWith("#") ? rankRaw : `#${rankRaw}`,
    updatedAt: new Date().toISOString().slice(0, 16).replace("T", " ") + " UTC",
  };

  console.log(`tokens=${data.tokens}  cost=${data.cost}  rank=${data.rank}`);

  const svg = renderSvg(data);
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, svg);
  console.log(`✓ wrote ${OUT} · ${svg.length} bytes`);
}

function renderSvg({ tokens, cost, rank, updatedAt }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 860" role="img" aria-label="YouSiki — PhD student by day, vibe coder by night · tokscale: ${esc(tokens)} tokens / ${esc(cost)} / rank ${esc(rank)}" width="100%">
  <defs>
    <linearGradient id="pBg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#FAF9F5"/>
      <stop offset="1" stop-color="#F0EEE6"/>
    </linearGradient>
    <radialGradient id="pGlowA" cx="0.85" cy="0.1" r="0.55">
      <stop offset="0" stop-color="#D97757" stop-opacity="0.28"/>
      <stop offset="1" stop-color="#D97757" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="pGlowB" cx="0.1" cy="0.5" r="0.45">
      <stop offset="0" stop-color="#D4A27F" stop-opacity="0.22"/>
      <stop offset="1" stop-color="#D4A27F" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="pGlowC" cx="0.5" cy="0.95" r="0.55">
      <stop offset="0" stop-color="#D97757" stop-opacity="0.2"/>
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

  <!-- backdrop -->
  <rect width="900" height="860" rx="22" fill="url(#pBg)"/>
  <g>
    <circle cx="780" cy="80" r="260" fill="url(#pGlowA)" filter="url(#pSoft)">
      <animate attributeName="r" values="240;280;240" dur="9s" repeatCount="indefinite"/>
    </circle>
    <circle cx="80" cy="430" r="240" fill="url(#pGlowB)" filter="url(#pSoft)">
      <animate attributeName="r" values="220;260;220" dur="11s" repeatCount="indefinite"/>
    </circle>
    <circle cx="460" cy="820" r="280" fill="url(#pGlowC)" filter="url(#pSoft)">
      <animate attributeName="r" values="260;300;260" dur="13s" repeatCount="indefinite"/>
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

  <!-- ═══════════════════ SECTION 1 · WHO ═══════════════════ -->

  <g transform="translate(40,88)">
    <text class="mono muted" font-size="11" letter-spacing="1.5">YOU</text>
    <text y="24" class="sans ink" font-size="17" font-weight="500">who is yousiki?</text>
  </g>

  <line x1="40" y1="140" x2="860" y2="140" stroke="#D97757" stroke-opacity="0.22"/>

  <g transform="translate(40,170)">
    <!-- rotating coral asterisk -->
    <g transform="translate(8,0)">
      <path d="M0 -7 L1.8 -1.8 L7 0 L1.8 1.8 L0 7 L-1.8 1.8 L-7 0 L-1.8 -1.8 Z" class="coral">
        <animateTransform attributeName="transform" type="rotate" values="0;360" dur="18s" repeatCount="indefinite"/>
      </path>
    </g>
    <text x="24" y="4" class="mono muted" font-size="11" letter-spacing="1.5">CLAUDE</text>
  </g>

  <g transform="translate(40,228)">
    <text class="serif ink" font-size="56" font-weight="500" letter-spacing="-1.6">Hi — I'm <tspan class="coral" font-style="italic">YouSiki</tspan>.</text>
    <text y="48" class="serif ink" font-size="26" font-weight="400" letter-spacing="-0.4" fill-opacity="0.82">
      PhD student by day. <tspan class="coral" font-style="italic">Vibe coder</tspan> by night.
    </text>
    <text y="82" class="sans muted" font-size="14" font-style="italic">
      Computer vision &amp; multimodal agents @ <tspan class="ink" font-weight="500" font-style="normal">Peking University</tspan>, Beijing.
    </text>
  </g>

  <!-- chip row -->
  <g transform="translate(40,352)" class="sans">
    <g>
      <rect width="176" height="28" rx="14" fill="#D97757" fill-opacity="0.14"/>
      <text x="15" y="18" font-size="12" class="coral" font-weight="600">✳︎ Peking University</text>
    </g>
    <g transform="translate(186,0)">
      <rect width="108" height="28" rx="14" fill="#141413" fill-opacity="0.06"/>
      <text x="15" y="18" font-size="12" class="ink" font-weight="500">claude code</text>
    </g>
    <g transform="translate(304,0)">
      <rect width="140" height="28" rx="14" fill="#141413" fill-opacity="0.06"/>
      <text x="15" y="18" font-size="12" class="ink" font-weight="500">oh-my-opencode</text>
    </g>
    <g transform="translate(454,0)">
      <rect width="68" height="28" rx="14" fill="#141413" fill-opacity="0.06"/>
      <text x="15" y="18" font-size="12" class="ink" font-weight="500">codex</text>
    </g>
    <g transform="translate(532,0)">
      <rect width="146" height="28" rx="14" fill="#141413" fill-opacity="0.06"/>
      <text x="15" y="18" font-size="12" class="ink" font-weight="500">open source enjoyer</text>
    </g>
  </g>

  <!-- ═══════════════════ SECTION 2 · VIBE CODING ═══════════════════ -->

  <line x1="40" y1="418" x2="860" y2="418" stroke="#D97757" stroke-opacity="0.22"/>

  <g transform="translate(40,448)">
    <g transform="translate(8,0)">
      <path d="M0 -7 L1.8 -1.8 L7 0 L1.8 1.8 L0 7 L-1.8 1.8 L-7 0 L-1.8 -1.8 Z" class="coral">
        <animateTransform attributeName="transform" type="rotate" values="0;360" dur="22s" repeatCount="indefinite"/>
      </path>
    </g>
    <text x="24" y="4" class="mono muted" font-size="11" letter-spacing="2">VIBE · CODING · DASHBOARD</text>
    <text x="820" y="4" class="mono muted" font-size="11" letter-spacing="1.5" text-anchor="end">
      <tspan class="coral" font-weight="600">●</tspan> LIVE · tokscale.ai/u/yousiki
    </text>
  </g>

  <!-- three numbers -->
  <g transform="translate(40,518)">
    <text y="0" class="mono muted" font-size="11" letter-spacing="1.5">TOKENS</text>
    <text y="56" class="serif coral" font-size="60" font-weight="500" letter-spacing="-2">${esc(tokens)}</text>
    <text y="84" class="sans muted" font-size="12" font-style="italic">conjured with agents</text>
  </g>
  <line x1="296" y1="520" x2="296" y2="608" stroke="#D97757" stroke-opacity="0.16" stroke-dasharray="2 4"/>

  <g transform="translate(328,518)">
    <text y="0" class="mono muted" font-size="11" letter-spacing="1.5">SPENT</text>
    <text y="56" class="serif ink" font-size="60" font-weight="500" letter-spacing="-2">${esc(cost)}</text>
    <text y="84" class="sans muted" font-size="12" font-style="italic">cost of thinking out loud</text>
  </g>
  <line x1="600" y1="520" x2="600" y2="608" stroke="#D97757" stroke-opacity="0.16" stroke-dasharray="2 4"/>

  <g transform="translate(632,518)">
    <text y="0" class="mono muted" font-size="11" letter-spacing="1.5">GLOBAL RANK</text>
    <text y="56" class="serif deep-coral" font-size="60" font-weight="500" letter-spacing="-2">${esc(rank)}</text>
    <text y="84" class="sans muted" font-size="12" font-style="italic">on the tokscale leaderboard</text>
  </g>

  <!-- animated sparkline -->
  <g transform="translate(40,626)">
    <path id="spark" d="M0 8 Q40 0 80 6 T160 4 T240 10 T320 2 T400 8 T480 5 T560 9 T640 3 T720 7 T800 2 L820 6"
          fill="none" stroke="#D97757" stroke-width="1.6" stroke-linecap="round" stroke-opacity="0.55"
          stroke-dasharray="1400" stroke-dashoffset="1400">
      <animate attributeName="stroke-dashoffset" values="1400;0" dur="4.5s" begin="0.3s" fill="freeze"/>
      <animate attributeName="stroke-dashoffset" values="0;1400;0" dur="18s" begin="5s" repeatCount="indefinite"/>
    </path>
  </g>

  <!-- ═══════════════════ SECTION 3 · AGENT STACK ═══════════════════ -->

  <line x1="40" y1="660" x2="860" y2="660" stroke="#D97757" stroke-opacity="0.22"/>

  <g transform="translate(40,690)">
    <g transform="translate(8,0)">
      <path d="M0 -7 L1.8 -1.8 L7 0 L1.8 1.8 L0 7 L-1.8 1.8 L-7 0 L-1.8 -1.8 Z" class="coral">
        <animateTransform attributeName="transform" type="rotate" values="0;360" dur="26s" repeatCount="indefinite"/>
      </path>
    </g>
    <text x="24" y="4" class="mono muted" font-size="11" letter-spacing="2">DAILY · AGENT · STACK</text>
    <text x="820" y="4" class="mono muted" font-size="11" letter-spacing="1.5" text-anchor="end">3 · COMPANIONS</text>
  </g>

  <!-- claude code -->
  <g transform="translate(40,738)">
    <circle cx="10" cy="10" r="5" class="coral">
      <animate attributeName="r" values="4.8;5.8;4.8" dur="2.8s" begin="0s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.55;1;0.55" dur="2.8s" begin="0s" repeatCount="indefinite"/>
    </circle>
    <circle cx="10" cy="10" r="11" fill="none" stroke="#D97757" stroke-opacity="0.28"/>
    <text x="32" y="14" class="mono muted" font-size="10" letter-spacing="1.2">PRIMARY AGENT</text>
    <text y="54" class="serif ink" font-size="28" font-weight="500" letter-spacing="-0.5">claude <tspan class="coral" font-style="italic">code</tspan></text>
    <line x1="0" y1="70" x2="44" y2="70" stroke="#141413" stroke-width="2"/>
    <text y="92" class="sans muted" font-size="12" font-style="italic">closes the loop</text>
    <text y="110" class="mono ink" font-size="11" fill-opacity="0.72">opus · sonnet · haiku</text>
  </g>

  <line x1="304" y1="748" x2="304" y2="854" stroke="#D97757" stroke-opacity="0.16" stroke-dasharray="2 4"/>

  <g transform="translate(328,738)">
    <circle cx="10" cy="10" r="5" class="coral">
      <animate attributeName="r" values="4.8;5.8;4.8" dur="2.8s" begin="-0.93s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.55;1;0.55" dur="2.8s" begin="-0.93s" repeatCount="indefinite"/>
    </circle>
    <circle cx="10" cy="10" r="11" fill="none" stroke="#D97757" stroke-opacity="0.28"/>
    <text x="32" y="14" class="mono muted" font-size="10" letter-spacing="1.2">CODING WORKSPACE</text>
    <text y="54" class="serif ink" font-size="28" font-weight="500" letter-spacing="-0.5">oh-my-<tspan class="coral" font-style="italic">opencode</tspan></text>
    <line x1="0" y1="70" x2="44" y2="70" stroke="#141413" stroke-width="2"/>
    <text y="92" class="sans muted" font-size="12" font-style="italic">editor meets agent</text>
    <text y="110" class="mono ink" font-size="11" fill-opacity="0.72">my fork · tmux-native</text>
  </g>

  <line x1="600" y1="748" x2="600" y2="854" stroke="#D97757" stroke-opacity="0.16" stroke-dasharray="2 4"/>

  <g transform="translate(624,738)">
    <circle cx="10" cy="10" r="5" class="coral">
      <animate attributeName="r" values="4.8;5.8;4.8" dur="2.8s" begin="-1.87s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.55;1;0.55" dur="2.8s" begin="-1.87s" repeatCount="indefinite"/>
    </circle>
    <circle cx="10" cy="10" r="11" fill="none" stroke="#D97757" stroke-opacity="0.28"/>
    <text x="32" y="14" class="mono muted" font-size="10" letter-spacing="1.2">CLI COMPANION</text>
    <text y="54" class="serif ink" font-size="28" font-weight="500" letter-spacing="-0.5"><tspan class="coral" font-style="italic">codex</tspan></text>
    <line x1="0" y1="70" x2="44" y2="70" stroke="#141413" stroke-width="2"/>
    <text y="92" class="sans muted" font-size="12" font-style="italic">second opinion I trust</text>
    <text y="110" class="mono ink" font-size="11" fill-opacity="0.72">gpt-5.4 · rescue · bg</text>
  </g>
</svg>
`;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
