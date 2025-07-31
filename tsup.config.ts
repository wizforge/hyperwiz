import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  outDir: 'dist',
  minify: true,
  treeshake: true,
  splitting: false,
  banner: {
    js: '/*! hyperwiz (c) 2025 Parth Tyagi - Apache 2.0 License */',
  },
});
