import { defineConfig } from 'vite'

export default defineConfig({
  hooks: {
    preinstall: 'npx only-allow pnpm',
  },
})
