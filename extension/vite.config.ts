import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import fs from 'fs';

// Helper plugin to copy manifest and icons into dist
function extensionAssetsPlugin() {
  return {
    name: 'extension-assets-plugin',
    closeBundle() {
      const distDir = resolve(__dirname, 'dist');
      if (!fs.existsSync(distDir)) {
        fs.mkdirSync(distDir, { recursive: true });
      }

      // Copy manifest.json
      const manifestSrc = resolve(__dirname, 'manifest.json');
      const manifestDest = resolve(distDir, 'manifest.json');
      if (fs.existsSync(manifestSrc)) {
        fs.copyFileSync(manifestSrc, manifestDest);
      }

      // Copy icons folder
      const iconsSrcDir = resolve(__dirname, 'public', 'icons');
      const iconsDestDir = resolve(distDir, 'icons');
      if (fs.existsSync(iconsSrcDir)) {
        if (!fs.existsSync(iconsDestDir)) {
          fs.mkdirSync(iconsDestDir, { recursive: true });
        }
        const files = fs.readdirSync(iconsSrcDir);
        for (const file of files) {
          fs.copyFileSync(resolve(iconsSrcDir, file), resolve(iconsDestDir, file));
        }
      }
    }
  };
}

export default defineConfig({
  base: './',
  plugins: [react(), extensionAssetsPlugin()],
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    rollupOptions: {
      input: {
        sidepanel: resolve(__dirname, 'sidepanel.html'),
        background: resolve(__dirname, 'src/background/index.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
});
