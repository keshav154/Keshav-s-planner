import { defineConfig } from 'vite'
// ...existing imports...

export default defineConfig({
  plugins: [
    // ...existing plugins...
    ...(process.env.VITE_PWA_DISABLED ? [] : [VitePWA({ /* pwa config */ })])
  ],
  // ...existing config...
})
