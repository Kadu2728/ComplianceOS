/**
 * The owner's symbol (D15) as a vector: three concentric strokes, the inner two joined into one
 * hairpin, all cut on a radial line at ±28°. Rebuilt from the approved raster (outer radius 50,
 * stroke 7.8, ring centres 20.7 / 33.3 / 46.1, bridge 7.5) — see brand-system §07. The same path
 * is the public master `public/brand/symbol.svg` (a test keeps them identical).
 */
export const SYMBOL_VIEWBOX = "0 0 94.15 100";
export const SYMBOL_PATH =
  "M94.15 26.53A50 50 0 1 0 94.15 73.47L87.26 69.81A42.2 42.2 0 1 1 87.26 30.19Z" +
  "M82.85 32.54A37.2 37.2 0 1 0 82.85 67.46L64.83 57.89A16.8 16.8 0 1 1 64.83 42.11Z" +
  "M71.58 30.03A29.4 29.4 0 1 0 71.58 69.97L67.17 67.62A24.6 24.6 0 1 1 67.17 32.38Z";
/** Width / height of the symbol. */
export const SYMBOL_RATIO = 94.15 / 100;
