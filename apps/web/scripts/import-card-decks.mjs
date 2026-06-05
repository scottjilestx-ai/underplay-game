/**
 * Builds raster card decks under public/cards/decks/{id}/
 * Run from apps/web: node scripts/import-card-decks.mjs
 */
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = path.join(__dirname, "..");
const PUBLIC = path.join(WEB_ROOT, "public", "cards", "decks");
const TMP = path.join(WEB_ROOT, "tmp");
const VECTOR_BASE =
  "https://raw.githubusercontent.com/notpeter/Vector-Playing-Cards/master/cards-svg";
const KENNEY_LARGE = path.join(TMP, "kenney", "PNG", "Cards (large)");

const FACE_W = 360;
const FACE_H = 520;

const RANK_TO_VECTOR = {
  2: "2",
  3: "3",
  4: "4",
  5: "5",
  6: "6",
  7: "7",
  8: "8",
  9: "9",
  10: "10",
  11: "J",
  12: "Q",
  13: "K",
};

const SUIT_SUFFIX = { diamonds: "D", hearts: "H", spades: "S", clubs: "C" };

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function writeJpeg(outPath, input, opts = {}) {
  await sharp(input, opts.density ? { density: opts.density } : undefined)
    .resize(FACE_W, FACE_H, { fit: "cover", position: "centre" })
    .jpeg({ quality: 88, mozjpeg: true })
    .toFile(outPath);
}

async function fetchSvg(name) {
  const url = `${VECTOR_BASE}/${name}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed ${url}: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function buildVectorDeck(deckId, suitKey) {
  const suffix = SUIT_SUFFIX[suitKey];
  const dir = path.join(PUBLIC, deckId);
  const facesDir = path.join(dir, "faces");
  await ensureDir(facesDir);

  for (const [value, rank] of Object.entries(RANK_TO_VECTOR)) {
    const svg = await fetchSvg(`${rank}${suffix}.svg`);
    const padded = String(value).padStart(2, "0");
    await writeJpeg(path.join(facesDir, `${padded}.jpg`), svg, { density: 300 });
  }

  const backSvg = await fetchSvg("Joker1.svg");
  await writeJpeg(path.join(dir, "back.jpg"), backSvg, { density: 300 });

  await copySpecialFaces(deckId);
  console.log(`  ${deckId} (vector ${suitKey})`);
}

async function copySpecialFaces(deckId) {
  const src = path.join(PUBLIC, "bicycle", "faces");
  const dest = path.join(PUBLIC, deckId, "faces");
  for (const name of ["clear.jpg", "skip.jpg"]) {
    await fs.copyFile(path.join(src, name), path.join(dest, name));
  }
}

async function buildKenneyDeck() {
  const deckId = "kenney";
  const dir = path.join(PUBLIC, deckId);
  const facesDir = path.join(dir, "faces");
  await ensureDir(facesDir);

  const suit = "diamonds";
  for (const [value, rank] of Object.entries(RANK_TO_VECTOR)) {
    const kenneyRank =
      rank.length === 1 && rank !== "J" && rank !== "Q" && rank !== "K"
        ? rank.padStart(2, "0")
        : rank;
    const file = path.join(KENNEY_LARGE, `card_${suit}_${kenneyRank}.png`);
    const padded = String(value).padStart(2, "0");
    await writeJpeg(path.join(facesDir, `${padded}.jpg`), file);
  }

  await writeJpeg(path.join(dir, "back.jpg"), path.join(KENNEY_LARGE, "card_back.png"));
  await copySpecialFaces(deckId);
  console.log(`  ${deckId} (Kenney CC0)`);
}

async function buildBicycleDeck() {
  const deckId = "bicycle";
  const dir = path.join(PUBLIC, deckId);
  const facesDir = path.join(dir, "faces");
  await ensureDir(facesDir);

  const legacyFaces = path.join(WEB_ROOT, "public", "cards", "faces");
  const legacyBack = path.join(WEB_ROOT, "public", "cards", "bicycle-back.jpg");

  for (const value of Object.keys(RANK_TO_VECTOR)) {
    const padded = String(value).padStart(2, "0");
    await fs.copyFile(
      path.join(legacyFaces, `${padded}.jpg`),
      path.join(facesDir, `${padded}.jpg`),
    );
  }
  for (const name of ["clear.jpg", "skip.jpg"]) {
    await fs.copyFile(path.join(legacyFaces, name), path.join(facesDir, name));
  }
  await fs.copyFile(legacyBack, path.join(dir, "back.jpg"));
  console.log(`  ${deckId} (restored JPEG)`);
}

async function main() {
  console.log("Importing card decks…");
  await ensureDir(PUBLIC);
  await buildBicycleDeck();
  await buildKenneyDeck();
  for (const suit of ["diamonds", "hearts", "spades", "clubs"]) {
    await buildVectorDeck(`classic-${suit}`, suit);
  }
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});