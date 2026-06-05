/**
 * Bakes Sketchfab Dumokan "Playing Cards" BaseColor atlas into /cards/decks/sketchfab/
 * Run from apps/web: node scripts/import-sketchfab-deck.mjs
 */
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

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
const BICYCLE_FACES = path.join(WEB_ROOT, "public", "cards", "decks", "bicycle", "faces");

const FACE_W = 360;
const FACE_H = 520;

/** Atlas layout: 13×4 faces (top), gap ~y 2080–2304, 13×4 backs (bottom). */
const ATLAS_W = 4096;
const ATLAS_H = 4096;
const COLS = 13;
const CELL_W = Math.floor(ATLAS_W / COLS);
const FACE_ROW_H = 520;
const BACK_Y = 2304;
const BACK_ROW_H = Math.floor((ATLAS_H - BACK_Y) / 4);
/** Hearts row in atlas (top row). */
const SUIT_ROW = 0;
/** Drop right gutter where the next atlas column bleeds in. */
const FACE_CROP_W = CELL_W - 22;

/** Atlas columns are A,2…K; game values are 2…13 → column index = value − 1. */
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

function backExtract() {
  return {
    left: 0,
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

async function writeJpeg(outPath, input, extract) {
  let pipe = sharp(input);
  if (extract) {
    pipe = pipe.extract(extract);
  }
  await pipe
    .resize(FACE_W, FACE_H, { fit: "cover", position: "centre" })
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
    await writeJpeg(path.join(facesDir, `${padded}.jpg`), atlasPath, faceExtract(value));
    console.log(`  faces/${padded}.jpg`);
  }

  await writeJpeg(path.join(OUT_DIR, "back.jpg"), atlasPath, backExtract());
  console.log("  back.jpg");

  for (const name of ["clear.jpg", "skip.jpg"]) {
    await fs.copyFile(path.join(BICYCLE_FACES, name), path.join(facesDir, name));
    console.log(`  faces/${name} (from bicycle)`);
  }

  console.log("Done — deck ready at public/cards/decks/sketchfab/");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});