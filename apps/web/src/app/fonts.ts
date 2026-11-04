import localFont from 'next/font/local';

/*
 * Self-hosted, Latin subset only (files copied from Fontsource, SIL OFL).
 * next/font adds a size-adjusted fallback, so text does not jump when the
 * real font arrives. Only the display face is preloaded, as the brief asks.
 */
export const archivoDisplay = localFont({
  src: [{ path: '../fonts/archivo-latin-800-normal.woff2', weight: '800', style: 'normal' }],
  variable: '--font-archivo-display',
  display: 'swap',
  preload: true,
  fallback: ['Arial', 'sans-serif'],
});

export const archivo = localFont({
  src: [
    { path: '../fonts/archivo-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../fonts/archivo-latin-600-normal.woff2', weight: '600', style: 'normal' },
  ],
  variable: '--font-archivo',
  display: 'swap',
  preload: false,
  fallback: ['Arial', 'sans-serif'],
});

export const plexMono = localFont({
  src: [
    { path: '../fonts/ibm-plex-mono-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../fonts/ibm-plex-mono-latin-500-normal.woff2', weight: '500', style: 'normal' },
  ],
  variable: '--font-plex-mono',
  display: 'swap',
  preload: false,
  fallback: ['Courier New', 'monospace'],
});
