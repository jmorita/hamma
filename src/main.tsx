import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './ui/App'
import './ui/styles.css'

const root = createRoot(document.getElementById('root')!)

// 開発時のみ、#tiles で牌の見本ページを出す (本番ビルドでは畳み込まれて消える)。
if (import.meta.env.DEV && location.hash === '#tiles') {
  const { TileChart } = await import('./ui/TileChart')
  root.render(
    <StrictMode>
      <TileChart />
    </StrictMode>,
  )
} else {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
