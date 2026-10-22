// Precache the exported web app so the PWA works offline. Run via `npm run build:web`.
module.exports = {
  globDirectory: 'dist/',
  globPatterns: ['**/*.{js,html,css,json,png,jpg,ttf,ico}'],
  swDest: 'dist/sw.js',
  maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
  navigateFallback: `${process.env.EXPO_BASE_URL ?? ''}/index.html`,
};
