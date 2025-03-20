import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'shitauke',
      fileName: 'index'
    },
    rollupOptions: {
      external: [
        'commander',
        'chalk',
        'inquirer',
        'openai',
        '@anthropic-ai/sdk',
        '@google/generative-ai',
        'fs-extra',
        'dotenv'
      ]
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
});
