import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react({
    include: '**/*.{jsx,js}',
  })],
  resolve: {
    extensions: ['.jsx', '.js', '.tsx', '.ts']
  },
  build: {
    rollupOptions: {
      // Only present inside the native iOS app (installed there via `npm install
      // @capacitor/keyboard` + `npx cap sync ios`). The web/Vercel build never runs that
      // code path — window.Capacitor?.isNativePlatform?.() guards it — so it doesn't need
      // the package installed to build successfully.
      external: ['@capacitor/keyboard'],
    },
  },
})