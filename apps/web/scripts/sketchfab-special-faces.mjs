/**
 * Renders Sketchfab-themed clear.jpg and skip.jpg (360×520).
 */
import sharp from "sharp";

const W = 360;
const H = 520;

const GOLD = "#b8922a";
const GOLD_LIGHT = "#d4af37";
const INK = "#1a1410";
const RED = "#b91c1c";
const RED_DARK = "#7f1d1d";
const PAPER = "#f2ebe0";

function meanderPath(x, y, w, h) {
  const s = 8;
  const n = Math.floor(w / s);
  const m = Math.floor(h / s);
  let d = `M ${x} ${y}`;
  for (let i = 0; i < n; i++) d += ` h ${s} v ${s} h ${-s} v ${s}`;
  for (let i = 0; i < m; i++) d += ` v ${s} h ${s} v ${-s} h ${s}`;
  for (let i = 0; i < n; i++) d += ` h ${-s} v ${-s} h ${s} v ${-s}`;
  for (let i = 0; i < m; i++) d += ` v ${-s} h ${-s} v ${s} h ${-s}`;
  return d + " Z";
}

function cardFrame() {
  return `
  <defs>
    <filter id="paper" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="3" seed="8" result="n"/>
      <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.9  0 0 0 0 0.88  0 0 0 0 0.82  0 0 0 0.12 0"/>
      <feBlend in="SourceGraphic" in2="n" mode="multiply"/>
    </filter>
    <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${GOLD_LIGHT}"/>
      <stop offset="100%" stop-color="${GOLD}"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="${PAPER}" filter="url(#paper)"/>
  <rect x="10" y="10" width="${W - 20}" height="${H - 20}" rx="14" fill="${PAPER}" stroke="${INK}" stroke-width="2.5"/>
  <path d="${meanderPath(18, 18, W - 36, H - 36)}" fill="none" stroke="url(#goldGrad)" stroke-width="2.2" opacity="0.95"/>
  <rect x="28" y="28" width="${W - 56}" height="${H - 56}" rx="10" fill="none" stroke="${INK}" stroke-width="0.8" opacity="0.35"/>
  `;
}

function clearSvg() {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    ${cardFrame()}
    <ellipse cx="${W / 2}" cy="248" rx="118" ry="168" fill="${INK}" opacity="0.06"/>
    <path d="M ${W / 2 - 90} 140 L ${W / 2} 108 L ${W / 2 + 90} 140 L ${W / 2 + 72} 360 L ${W / 2 - 72} 360 Z"
      fill="url(#goldGrad)" stroke="${INK}" stroke-width="2"/>
    <text x="${W / 2}" y="218" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif"
      font-size="34" font-weight="700" fill="${INK}" letter-spacing="2">UNDERCUT</text>
    <g transform="translate(${W / 2}, 290)">
      <path d="M 0 -42 L 28 32 L 10 32 L 0 58 L -10 32 L -28 32 Z" fill="${GOLD}" stroke="${INK}" stroke-width="1.2"/>
      <rect x="-36" y="38" width="72" height="10" rx="2" fill="${INK}" opacity="0.15"/>
      <rect x="-30" y="32" width="60" height="8" rx="1" fill="#fff" stroke="${INK}" stroke-width="0.6"/>
      <rect x="-24" y="26" width="48" height="7" rx="1" fill="#fff" stroke="${INK}" stroke-width="0.6"/>
      <rect x="-18" y="20" width="36" height="6" rx="1" fill="#fff" stroke="${INK}" stroke-width="0.6"/>
    </g>
    <text x="${W / 2}" y="400" text-anchor="middle" font-family="Georgia, serif"
      font-size="15" font-weight="700" fill="${GOLD}" letter-spacing="3">CLEARS THE PILE</text>
  </svg>`);
}

function skipSvg() {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    ${cardFrame()}
    <ellipse cx="${W / 2}" cy="255" rx="115" ry="160" fill="${RED}" opacity="0.05"/>
    <rect x="52" y="118" width="${W - 104}" height="280" rx="16" fill="none" stroke="${RED_DARK}" stroke-width="2.5"/>
    <path d="M 72 150 Q ${W / 2} 120 ${W - 72} 150" fill="none" stroke="${RED}" stroke-width="3"/>
    <text x="${W / 2}" y="210" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif"
      font-size="38" font-weight="700" fill="${RED}" stroke="${INK}" stroke-width="0.6" letter-spacing="1">OVERCUT</text>
    <g transform="translate(${W / 2}, 300)">
      <circle r="52" fill="none" stroke="${RED}" stroke-width="5"/>
      <path d="M -32 -18 A 40 40 0 1 1 28 32" fill="none" stroke="${RED}" stroke-width="4" stroke-linecap="round"/>
      <path d="M 32 18 A 40 40 0 1 1 -28 -32" fill="none" stroke="${RED}" stroke-width="4" stroke-linecap="round"/>
      <line x1="-38" y1="38" x2="42" y2="-42" stroke="${RED}" stroke-width="6" stroke-linecap="round"/>
      <line x1="-48" y1="8" x2="-58" y2="8" stroke="${RED}" stroke-width="3" stroke-linecap="round"/>
      <line x1="-48" y1="16" x2="-58" y2="16" stroke="${RED}" stroke-width="3" stroke-linecap="round"/>
      <line x1="-48" y1="24" x2="-58" y2="24" stroke="${RED}" stroke-width="3" stroke-linecap="round"/>
    </g>
    <text x="${W / 2}" y="410" text-anchor="middle" font-family="Georgia, serif"
      font-size="14" font-weight="700" fill="${INK}" opacity="0.75" letter-spacing="2">SKIP OPPONENT</text>
  </svg>`);
}

export async function buildSketchfabSpecialFaces(outDir, textureJpeg) {
  const paper = await sharp(textureJpeg)
    .resize(W, H, { fit: "cover", position: "centre" })
    .modulate({ brightness: 1.05, saturation: 0.35 })
    .blur(1.2)
    .toBuffer();

  const pairs = [
    ["clear.jpg", clearSvg()],
    ["skip.jpg", skipSvg()],
  ];

  for (const [name, svg] of pairs) {
    const overlay = await sharp(svg).png().toBuffer();
    await sharp(paper)
      .composite([{ input: overlay, blend: "over" }])
      .jpeg({ quality: 88, mozjpeg: true })
      .toFile(`${outDir}/${name}`);
  }
}