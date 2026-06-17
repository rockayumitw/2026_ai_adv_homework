import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: '/claude-code-training/',
  plugins: [vue()],
})
