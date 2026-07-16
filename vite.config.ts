import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages は https://<user>.github.io/<repo>/ 配下に置かれるため、
// ビルド時に BASE_PATH=/<repo>/ を渡す。ローカル開発では '/' のまま。
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react()],
})
