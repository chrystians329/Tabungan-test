import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kayaku.tabungan',
  appName: 'KayaKu',
  webDir: 'dist',
  backgroundColor: '#0B0F17',
  android: {
    allowMixedContent: false,
    webContentsDebuggingEnabled: false,
  },
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SystemBars: {
      // viewport-fit=cover sudah ada di index.html; beri tahu sejak awal agar
      // safe-area inset (status bar) langsung ditangani benar sejak frame pertama.
      initialViewportFitValueHint: 'cover',
    },
  },
};

export default config;
