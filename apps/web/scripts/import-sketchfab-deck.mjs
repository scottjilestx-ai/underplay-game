/**
 * Bakes Sketchfab Dumokan "Playing Cards" BaseColor atlas into /cards/decks/sketchfab/
 * Run from apps/web: node scripts/import-sketchfab-deck.mjs
 */
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";
import { buildSketchfabSpecialFaces } from "./sketchfab-special-faces.mjs";
import { tightBounds } from "./sketchfab-trim.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = path.join(__dirname, "..");
const TEXTURES_DIR = path.join(
  WEB_ROOT,
  "public",
  "cards",
  "decks",
  "sketchfab",
  "source",
  "textures",
);
const OUT_DIR = path.join(WEB_ROOT, "public", "cards", "decks", "sketchfab");

const FACE_W = 360;
const FACE_H = 520;
const CARD_ASPECT = FACE_W / FACE_H;

/** Atlas layout: 13×4 faces (top), gap ~y 2080–2304, 13×4 backs (bottom). */
const ATLAS_W = 4096;
const ATLAS_H = 4096;
const COLS = 13;
const CELL_W = Math.floor(ATLAS_W / COLS);
const FACE_ROW_H = 520;
const BACK_Y = 2304;
const BACK_ROW_H = Math.floor((ATLAS_H - BACK_Y) / 4);
const SUIT_ROW = 0;
const FACE_CROP_W = CELL_W - 22;

function colForValue(value) {
  return value - 1;
}

function faceExtract(value) {
  const col = colForValue(value);
  return {
    left: col * CELL_W,
    top: SUIT_ROW * FACE_ROW_H,
    width: FACE_CROP_W,
    height: FACE_ROW_H,
  };
}

/** Column 7 is the most centered back cell in the atlas (col 0 is shifted right). */
const BACK_COL = 7;

function backExtract() {
  return {
    left: BACK_COL * CELL_W,
    top: BACK_Y,
    width: CELL_W,
    height: BACK_ROW_H,
  };
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function findBaseColorPath() {
  const names = await fs.readdir(TEXTURES_DIR);
  const hit = names.find((n) => n.includes("BaseColo"));
  if (!hit) throw new Error(`BaseColor texture not found in ${TEXTURES_DIR}`);
  return path.join(TEXTURES_DIR, hit);
}

function finalizeEdgeToEdgeBuffer(data, width, height, channels) {
  const bounds = tightBounds(data, width, height, {
    /** Cream stock is ~235–245 lum; crop to printed art so cards fill UI slots. */
    inkThreshold: 220,
    capAspect: CARD_ASPECT,
  });
  return sharp(data, {
    raw: { width, height, channels },
  })
    .extract(bounds)
    .resize(FACE_W, FACE_H, { fit: "cover", position: "centre" });
}

async function writeTrimmedJpeg(outPath, input, extract) {
  const { data, info } = await sharp(input).extract(extract).raw().toBuffer({ resolveWithObject: true });
  await finalizeEdgeToEdgeBuffer(data, info.width, info.height, info.channels)
    .jpeg({ quality: 88, mozjpeg: true })
    .toFile(outPath);
}

async function finalizeJpegFile(outPath) {
  const { data, info } = await sharp(outPath).raw().toBuffer({ resolveWithObject: true });
  await finalizeEdgeToEdgeBuffer(data, info.width, info.height, info.channels)
    .jpeg({ quality: 88, mozjpeg: true })
    .toFile(outPath);
}

async function main() {
  const atlasPath = await findBaseColorPath();
  const facesDir = path.join(OUT_DIR, "faces");
  await ensureDir(facesDir);

  console.log("Atlas:", atlasPath);
  console.log("Grid:", { CELL_W, FACE_CROP_W, FACE_ROW_H, BACK_Y, BACK_ROW_H });

  for (let value = 2; value <= 13; value++) {
    const padded = String(value).padStart(2, "0");
    await writeTrimmedJpeg(path.join(facesDir, `${padded}.jpg`), atlasPath, faceExtract(value));
    console.log(`  faces/${padded}.jpg`);
  }

  await writeTrimmedJpeg(path.join(OUT_DIR, "back.jpg"), atlasPath, backExtract());
  console.log("  back.jpg");

  await buildSketchfabSpecialFaces(facesDir);
  for (const name of ["clear.jpg", "skip.jpg"]) {
    await finalizeJpegFile(path.join(facesDir, name));
  }
  console.log("  faces/clear.jpg (sketchfab special)");
  console.log("  faces/skip.jpg (sketchfab special)");

  console.log("Done — deck ready at public/cards/decks/sketchfab/");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});