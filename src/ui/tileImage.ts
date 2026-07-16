/**
 * 牌の画像。麻雀豆腐 (https://majandofu.com) が無料配布している牌画像素材を使う。
 * 実ファイルは public/tiles/ に置いてあり、66x90px。
 *
 * ファイル名と牌の対応は実物を見て確認したもので、素直な連番ではない点に注意:
 *   - 字牌: ji1..ji4 = 東南西北 / ji5 = 發 / ji6 = 白 / ji7 = 中
 *   - 赤5:  aka1 = 赤5筒 / aka2 = 赤5索 / aka3 = 赤5萬
 */
import { HONOR, isRed, rankOf, suitOf, type Tile } from '../core/tiles'

// GitHub Pages のようにサブディレクトリ配下へ公開すると '/tiles/...' は
// ドメイン直下を指してしまい全て404になる。base を必ず前置きする。
const file = (name: string) => `${import.meta.env.BASE_URL}tiles/${name}-66-90-l.png`

/** 字牌 27..33 (東南西北白發中) → 画像名。 */
const HONOR_FILES = ['ji1', 'ji2', 'ji3', 'ji4', 'ji6', 'ji5', 'ji7']

/** 赤5の画像名。韓麻では5が全て赤なので、5は常にこれを使う。 */
const AKA_FILES = ['aka3', 'aka1', 'aka2'] // 萬, 筒, 索

const SUIT_NAMES = ['man', 'pin', 'sou']

export const tileImage = (t: Tile): string => {
  if (t >= HONOR) return file(HONOR_FILES[t - HONOR])
  const suit = suitOf(t)
  const rank = rankOf(t) + 1
  if (isRed(t)) return file(AKA_FILES[suit])
  return file(`${SUIT_NAMES[suit]}${rank}`)
}

/** 事前読み込み。初回描画で牌が一瞬抜けるのを防ぐ。 */
export const preloadTiles = (): void => {
  for (let t = 0; t < 34; t++) {
    const img = new Image()
    img.src = tileImage(t)
  }
}
