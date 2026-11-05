import localFont from 'next/font/local';

/*
 * Self-hosted, Latin subset only (files copied from Fontsource, SIL OFL).
 * next/font adds a size-adjusted fallback, so text does not jump when the
 * real font arrives. The display face and the body faces are preloaded:
 * body text is the largest thing on most pages, so it decides LCP.
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
  preload: true,
  fallback: ['Arial', 'sans-serif'],
});
