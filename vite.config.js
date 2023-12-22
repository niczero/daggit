import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default ({ mode }) => defineConfig({
  build: {
    emptyOutDir: mode === 'production', // whether to empty the outDir each build
    minify: mode === 'production', // ['esbuild'|'terser'|false]
    outDir: 'dist',
    target: ['es2018'],

    rollupOptions: {
      input: ['src/git-overview.js'],

      output: {
        entryFileNames: '[name].[hash].js',
      },

      treeshake: true,
    },
  },

  optimizeDeps: {
    esbuildOptions: {
      keepNames: mode === 'development',
    },
  },
})
