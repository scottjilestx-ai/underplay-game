/**
 * Atlas deck bake helpers — reuse for any texture-atlas card deck import.
 *
 * Checklist when adding a new atlas-based deck:
 * 1. Export size is always 360×520 (matches PlayingCard / DeckCardImage slots).
 * 2. Crop to printed art, not paper stock: cream atlas gutters are ~235–245 lum;
 *    use inkThreshold ~220 (not 234+) or cards look inset with white gutters in play.
 * 3. After atlas cell extract, run tightBounds + cover resize so JPEGs fill the frame.
 * 4. Pick a centered atlas cell for the back — column 0 is often off-center; scan
 *    columns and use the most balanced one (see findBestCenteredColumn).
 * 5. Bake edge-to-edge first; UI also uses CARD_IMAGE_CLASS (scale bleed) in cardImageStyle.ts.
 * 6. Verify with a quick margin audit before commit (see auditDeckMargins).
 */
import sharp from "sharp";

export const DECK_FACE_W = 360;
export const DECK_FACE_H = 520;
export const DECK_CARD_ASPECT = DECK_FACE_W / DECK_FACE_H;

/** Cream card stock in atlases; art/gold/ink is darker or more saturated. */
export const INK_THRESHOLD_CREAM_STOCK = 220;

export function isInk(r, g, b, threshold = INK_THRESHOLD_CREAM_STOCK) {
  const lum = (r + g + b) / 3;
  if (lum < threshold) return true;
  const sat = Math.max(r, g, b) - Math.min(r, g, b);
  return sat > 18 && lum < 252;
}

export function tightBounds(data, width, height, options = {}) {
  const {
    inkThreshold = INK_THRESHOLD_CREAM_STOCK,
    minInkCol = 0.04,
    capAspect,
  } = options;
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 3;
      if (isInk(data[i], data[i + 1], data[i + 2], inkThreshold)) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX <= minX || maxY <= minY) {
    return { left: 0, top: 0, width, height };
  }

  const rowH = maxY - minY + 1;
  const minColInk = Math.max(4, Math.floor(rowH * minInkCol));
  let cardRight = minX;
  for (let x = maxX; x >= minX; x--) {
    let ink = 0;
    for (let y = minY; y <= maxY; y++) {
      const i = (y * width + x) * 3;
      if (isInk(data[i], data[i + 1], data[i + 2], inkThreshold)) ink++;
    }
    if (ink >= minColInk) {
      cardRight = x;
      break;
    }
  }

  const margin = 1;
  minX = Math.max(0, minX - margin);
  minY = Math.max(0, minY - margin);
  cardRight = Math.min(width - 1, cardRight + margin);
  maxY = Math.min(height - 1, maxY + margin);

  let cropW = cardRight - minX + 1;
  const cropH = maxY - minY + 1;
  if (capAspect && cropH > 0) {
    const idealW = Math.round(cropH * capAspect);
    if (cropW > idealW + 2) cropW = idealW;
  }

  return { left: minX, top: minY, width: cropW, height: cropH };
}

export function finalizeEdgeToEdgeBuffer(data, width, height, channels, options = {}) {
  const {
    inkThreshold = INK_THRESHOLD_CREAM_STOCK,
    capAspect = DECK_CARD_ASPECT,
    outW = DECK_FACE_W,
    outH = DECK_FACE_H,
  } = options;
  const bounds = tightBounds(data, width, height, { inkThreshold, capAspect });
  return sharp(data, { raw: { width, height, channels } })
    .extract(bounds)
    .resize(outW, outH, { fit: "cover", position: "centre" });
}

/** Pick the atlas column whose back cell is most horizontally centered. */
export async function findBestCenteredColumn(atlasPath, extractForCol) {
  const scores = [];
  for (let col = 0; col < 13; col++) {
    const { data, info } = await sharp(atlasPath)
      .extract(extractForCol(col))
      .raw()
      .toBuffer({ resolveWithObject: true });
    const { width, height } = info;
    let minX = width;
    let maxX = 0;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 3;
        if (isInk(data[i], data[i + 1], data[i + 2])) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
        }
      }
    }
    if (maxX <= minX) continue;
    const balance = Math.min(minX, width - maxX - 1);
    scores.push({ col, balance, minX, maxX });
  }
  scores.sort((a, b) => b.balance - a.balance);
  return scores[0]?.col ?? 0;
}

/** Log content-fill % for baked JPEGs (art bounds at cream threshold). */
export async function auditDeckMargins(filePaths, inkThreshold = INK_THRESHOLD_CREAM_STOCK) {
  for (const filePath of filePaths) {
    const { data, info } = await sharp(filePath).raw().toBuffer({ resolveWithObject: true });
    const { width, height } = info;
    let minX = width;
    let minY = height;
    let maxX = 0;
    let maxY = 0;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 3;
        if (isInk(data[i], data[i + 1], data[i + 2], inkThreshold)) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    const cw = maxX - minX + 1;
    const ch = maxY - minY + 1;
    const name = filePath.split(/[/\\]/).pop();
    console.log(
      `  ${name}: ${((cw / width) * 100).toFixed(0)}%w × ${((ch / height) * 100).toFixed(0)}%h art`,
    );
  }
}