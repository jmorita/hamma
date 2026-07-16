/**
 * 和了形の判定。
 *
 * 韓麻には役が無いため、必要なのは「形になっているか」だけ:
 *   - 4メンツ1雀頭 (どんな組み合わせでも可)
 *   - 七対子
 *   - 国士無双
 * 副露している場合、七対子・国士無双は成立しない。
 */
import { TILE_KINDS, isSuit, rankOf, type Tile } from './tiles'

/** 国士無双の対象牌 (老頭牌9種 + 字牌7種)。 */
export const KOKUSHI_TILES: readonly Tile[] = [
  0, 8, 9, 17, 18, 26, 27, 28, 29, 30, 31, 32, 33,
]
const KOKUSHI_SET = new Set(KOKUSHI_TILES)
export const isKokushiTile = (t: Tile): boolean => KOKUSHI_SET.has(t)

export type AgariShape = 'standard' | 'chiitoitsu' | 'kokushi'

/**
 * counts から meldsNeeded 個のメンツを抜き出せるか。
 * counts は破壊的に使い、呼び出し後に復元される。
 */
const canFormMelds = (counts: number[], meldsNeeded: number): boolean => {
  if (meldsNeeded === 0) return counts.every((n) => n === 0)

  // 残っている最小の牌は必ず何らかのメンツの先頭になる。
  let i = 0
  while (i < TILE_KINDS && counts[i] === 0) i++
  if (i >= TILE_KINDS) return false

  // 刻子
  if (counts[i] >= 3) {
    counts[i] -= 3
    const ok = canFormMelds(counts, meldsNeeded - 1)
    counts[i] += 3
    if (ok) return true
  }

  // 順子
  if (isSuit(i) && rankOf(i) <= 6 && counts[i + 1] > 0 && counts[i + 2] > 0) {
    counts[i]--
    counts[i + 1]--
    counts[i + 2]--
    const ok = canFormMelds(counts, meldsNeeded - 1)
    counts[i]++
    counts[i + 1]++
    counts[i + 2]++
    if (ok) return true
  }

  return false
}

/** 4メンツ1雀頭が成立しているか。calledMelds は副露済みメンツ数。 */
export const isStandardAgari = (counts: number[], calledMelds: number): boolean => {
  const need = 4 - calledMelds
  for (let t = 0; t < TILE_KINDS; t++) {
    if (counts[t] < 2) continue
    counts[t] -= 2
    const ok = canFormMelds(counts, need)
    counts[t] += 2
    if (ok) return true
  }
  return false
}

/** 七対子。4枚使いは2組の対子とみなさない (7種であることを要求する)。 */
export const isChiitoitsu = (counts: readonly number[]): boolean => {
  let pairs = 0
  for (let t = 0; t < TILE_KINDS; t++) {
    if (counts[t] === 0) continue
    if (counts[t] !== 2) return false
    pairs++
  }
  return pairs === 7
}

/** 国士無双 (十三面待ちも同じ扱い)。 */
export const isKokushi = (counts: readonly number[]): boolean => {
  let pair = 0
  for (let t = 0; t < TILE_KINDS; t++) {
    if (counts[t] === 0) continue
    if (!isKokushiTile(t)) return false
    if (counts[t] === 2) pair++
    else if (counts[t] !== 1) return false
  }
  if (pair !== 1) return false
  let kinds = 0
  for (const t of KOKUSHI_TILES) if (counts[t] > 0) kinds++
  return kinds === 13
}

/**
 * 和了しているか。成立していれば形を、していなければ null を返す。
 * counts は14枚(副露分を除く)の手牌。
 */
export const agariShape = (counts: number[], calledMelds: number): AgariShape | null => {
  if (calledMelds === 0) {
    if (isKokushi(counts)) return 'kokushi'
    if (isChiitoitsu(counts)) return 'chiitoitsu'
  }
  if (isStandardAgari(counts, calledMelds)) return 'standard'
  return null
}

export const isAgari = (counts: number[], calledMelds: number): boolean =>
  agariShape(counts, calledMelds) !== null

/**
 * 13枚の手牌の待ち牌一覧。テンパイでなければ空配列。
 * 韓麻にはフリテンが無いので、これがそのまま「アガれる牌」になる。
 */
export const waitingTiles = (counts: number[], calledMelds: number): Tile[] => {
  const out: Tile[] = []
  for (let t = 0; t < TILE_KINDS; t++) {
    if (counts[t] >= 4) continue // 4枚見えていればその牌では上がれない
    counts[t]++
    if (isAgari(counts, calledMelds)) out.push(t)
    counts[t]--
  }
  return out
}

export const isTenpai = (counts: number[], calledMelds: number): boolean =>
  waitingTiles(counts, calledMelds).length > 0
