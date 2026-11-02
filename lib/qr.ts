/**
 * Deterministic, visually-plausible "QR code" SVG — NOT a real, scannable
 * QR code. Good enough for a UI mock (ticket/credential previews); swap
 * for a real QR library once check-in actually needs to scan these.
 */
export function makeQrSvg(seed: string): string {
  const n = 25;
  const cell = 8;
  const pad = 16;
  const size = n * cell + pad * 2;

  let s = 0;
  for (const c of seed) s = (s * 31 + c.charCodeAt(0)) >>> 0;
  function rnd() {
    s = (s * 1103515245 + 12345) >>> 0;
    return (s >>> 16) / 65536;
  }

  function finder(x: number, y: number) {
    return (
      `<rect x="${pad + x * cell}" y="${pad + y * cell}" width="${7 * cell}" height="${7 * cell}" fill="#001B32"/>` +
      `<rect x="${pad + (x + 1) * cell}" y="${pad + (y + 1) * cell}" width="${5 * cell}" height="${5 * cell}" fill="#fff"/>` +
      `<rect x="${pad + (x + 2) * cell}" y="${pad + (y + 2) * cell}" width="${3 * cell}" height="${3 * cell}" fill="#BF262E"/>`
    );
  }

  let dots = "";
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const inFinder = (x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9);
      if (inFinder) continue;
      if (rnd() > 0.55) {
        dots += `<rect x="${pad + x * cell}" y="${pad + y * cell}" width="${cell}" height="${cell}" fill="#001B32"/>`;
      }
    }
  }
  dots += finder(0, 0) + finder(n - 7, 0) + finder(0, n - 7);

  return `<svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="QR code"><rect width="${size}" height="${size}" rx="10" fill="#fff"/>${dots}</svg>`;
}
