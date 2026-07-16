/**
 * 開発用の牌見本。34種すべてと各表示状態を並べて絵柄を確認する。
 * dev サーバーで #tiles を付けると表示される (本番ビルドには含まれない)。
 */
import { TILE_KINDS, tileName } from '../core/tiles'
import { Tile } from './Tile'
import type { Dir } from './Tile'

const all = Array.from({ length: TILE_KINDS }, (_, i) => i)

export const TileChart = () => (
  <div style={{ padding: 20, background: '#1f6b4a', minHeight: '100vh' }}>
    <h2 style={{ color: '#fff', font: 'bold 15px sans-serif' }}>34種</h2>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, max-content)', gap: 6 }}>
      {all.map((t) => (
        <div key={t} style={{ textAlign: 'center' }}>
          <Tile tile={t} />
          <div style={{ color: '#cfe', font: '10px sans-serif', marginTop: 2 }}>{tileName(t)}</div>
        </div>
      ))}
    </div>

    <h2 style={{ color: '#fff', font: 'bold 15px sans-serif', marginTop: 24 }}>席の向き (東を各席で)</h2>
    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
      {(['bottom', 'right', 'top', 'left'] as Dir[]).map((d) => (
        <div key={d} style={{ textAlign: 'center' }}>
          <Tile tile={27} dir={d} />
          <div style={{ color: '#cfe', font: '10px sans-serif' }}>{d}</div>
        </div>
      ))}
    </div>

    <h2 style={{ color: '#fff', font: 'bold 15px sans-serif', marginTop: 24 }}>状態</h2>
    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
      <Tile tile={4} />
      <Tile back />
      <Tile tile={4} small />
      <Tile tile={4} rotated />
      <Tile tile={4} dim />
      <Tile tile={4} selectable />
    </div>

    <h2 style={{ color: '#fff', font: 'bold 15px sans-serif', marginTop: 24 }}>小サイズ (河・他家)</h2>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, max-content)', gap: 3 }}>
      {all.map((t) => (
        <Tile key={t} tile={t} small />
      ))}
    </div>
  </div>
)
