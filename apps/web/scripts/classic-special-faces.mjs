/**
 * Clear/skip faces for vector & pixel decks (360×520, edge-to-edge).
 */
import sharp from "sharp";

const W = 360;
const H = 520;

function frame(accent) {
  return `
  <rect width="${W}" height="${H}" fill="#ffffff"/>
  <rect x="8" y="8" width="${W - 16}" height="${H - 16}" rx="12" fill="#ffffff" stroke="#111" stroke-width="3"/>
  <rect x="20" y="20" width="${W - 40}" height="${H - 40}" rx="8" fill="none" stroke="${accent}" stroke-width="2" opacity="0.35"/>
  `;
}

function clearSvg(accent, label) {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    ${frame(accent)}
    <text x="${W / 2}" y="210" text-anchor="middle" font-family="Georgia, serif" font-size="40" font-weight="700" fill="${accent}">${label}</text>
    <text x="${W / 2}" y="300" text-anchor="middle" font-family="Georgia, serif" font-size="18" fill="#333" letter-spacing="2">CLEARS THE PILE</text>
    <path d="M ${W / 2} 330 L ${W / 2 + 50} 400 L ${W / 2 + 20} 400 L ${W / 2} 440 L ${W / 2 - 20} 400 L ${W / 2 - 50} 400 Z" fill="${accent}" opacity="0.85"/>
  </svg>`);
}

function skipSvg(accent, label) {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    ${frame(accent)}
    <text x="${W / 2}" y="210" text-anchor="middle" font-family="Georgia, serif" font-size="36" font-weight="700" fill="${accent}">${label}</text>
    <text x="${W / 2}" y="300" text-anchor="middle" font-family="Georgia, serif" font-size="18" fill="#333" letter-spacing="2">SKIP OPPONENT</text>
    <circle cx="${W / 2}" cy="370" r="46" fill="none" stroke="${accent}" stroke-width="5"/>
    <line x1="${W / 2 - 32}" y1="338" x2="${W / 2 + 32}" y2="402" stroke="${accent}" stroke-width="6" stroke-linecap="round"/>
  </svg>`);
}

const ACCENT = {
  kenney: "#2563eb",
  "classic-diamonds": "#dc2626",
  "classic-hearts": "#dc2626",
  "classic-spades": "#111111",
  "classic-clubs": "#111111",
};

export async function buildClassicSpecialFaces(outDir, deckId) {
  const accent = ACCENT[deckId] ?? "#b45309";
  const pairs = [
    ["clear.jpg", clearSvg(accent, "UNDERCUT")],
    ["skip.jpg", skipSvg(accent, "OVERCUT")],
  ];
  for (const [name, svg] of pairs) {
    await sharp(svg)
      .resize(W, H, { fit: "cover", position: "centre" })
      .jpeg({ quality: 88, mozjpeg: true })
      .toFile(`${outDir}/${name}`);
  }
}