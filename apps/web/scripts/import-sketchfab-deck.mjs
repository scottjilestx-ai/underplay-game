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

const ATLAS_W = 4096;
const ATLAS_H = 4096;
const COLS = 13;
const FACE_ROWS = 4;
/** Hearts row in atlas (top row). */
const SUIT_ROW = 0;

const cardW = Math.round(ATLAS_W / COLS);
const faceBandH = Math.round(ATLAS_H * 0.52);
const cardH = Math.round(faceBandH / FACE_ROWS);
const backY = faceBandH;
const backH = Math.round((ATLAS_H - faceBandH) / 3);
const backW = Math.round(ATLAS_W / 10);

function colForValue(value) {
  return value - 1;
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
  console.log("Cell:", { cardW, cardH, backY, backW, backH });

  for (let value = 2; value <= 13; value++) {
    const col = colForValue(value);
    const padded = String(value).padStart(2, "0");
    await writeJpeg(path.join(facesDir, `${padded}.jpg`), atlasPath, {
      left: col * cardW,
      top: SUIT_ROW * cardH,
      width: cardW,
      height: cardH,
    });
    console.log(`  faces/${padded}.jpg`);
  }

  await writeJpeg(path.join(OUT_DIR, "back.jpg"), atlasPath, {
    left: 0,
    top: backY,
    width: backW,
    height: backH,
  });
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