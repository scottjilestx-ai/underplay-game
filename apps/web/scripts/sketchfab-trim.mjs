/** Trim near-white atlas gutters before resize. */

export function isInk(r, g, b, threshold = 248) {
  /** Cream card stock in atlas is ~235–245; ink/gold/back art is darker or more saturated. */
  const lum = (r + g + b) / 3;
  if (lum < threshold) return true;
  const sat = Math.max(r, g, b) - Math.min(r, g, b);
  return sat > 18 && lum < 252;
}

export function tightBounds(data, width, height, options = {}) {
  const { inkThreshold = 248, minInkCol = 0.04, capAspect } = options;
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