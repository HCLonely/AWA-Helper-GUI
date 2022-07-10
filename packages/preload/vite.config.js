import {chrome} from '../../.electron-vendors.cache.json';
import { preload } from 'unplugin-auto-expose';
import { version, author } from '../../package.json';
const PACKAGE_ROOT = __dirname;

/**
 * @type {import('vite').UserConfig}
 * @see https://vitejs.dev/config/
 */
const config = {
  mode: process.env.MODE,
  root: PACKAGE_ROOT,
  envDir: process.cwd(),
  build: {
    ssr: true,
    sourcemap: 'inline',
    target: `chrome${chrome}`,
    outDir: 'dist',
    assetsDir: '.',
    minify: process.env.MODE !== 'development',
    lib: {
      entry: 'src/index.ts',
      formats: ['cjs'],
    },
    rollupOptions: {
      output: {
        entryFileNames: '[name].cjs',
      },
    },
    emptyOutDir: true,
    brotliSize: false,
  },
  define: {
    __APP_VERSION__: version,
    __APP_AUTHOR__: author.name || author,
  },
  plugins: [
    preload.vite(),
  ],
};

export default config;
