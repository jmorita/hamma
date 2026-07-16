/**
 * 牌の表現。
 *
 * 韓麻は数牌の5が「全て」赤（計12枚）なので、赤ドラは牌種から一意に決まる。
 * よって個々の牌に赤フラグを持たせる必要がなく、牌は種類ID 0..33 だけで表せる。
 *
 *   0..8   1m..9m
 *   9..17  1p..9p
 *  18..26  1s..9s
 *  27..33  東 南 西 北 白 發 中
 */
export type Tile = number

export const TILE_KINDS = 34
export const TILE_COUNT = 136

export const MAN = 0
export const PIN = 9
export const SOU = 18
export const HONOR = 27

/** 赤ドラ = 全ての5。 */
export const RED_TILES: readonly Tile[] = [MAN + 4, PIN + 4, SOU + 4]

export const isHonor = (t: Tile): boolean => t >= HONOR
export const isSuit = (t: Tile): boolean => t < HONOR
/** 同一スーツ内での数字 0..8 (= 実際の数-1)。字牌には使わないこと。 */
export const rankOf = (t: Tile): number => t % 9
export const suitOf = (t: Tile): number => Math.floor(t / 9)
export const isRed = (t: Tile): boolean => isSuit(t) && rankOf(t) === 4

const TILE_NAMES = [
  '1m', '2m', '3m', '4m', '5m', '6m', '7m', '8m', '9m',
  '1p', '2p', '3p', '4p', '5p', '6p', '7p', '8p', '9p',
  '1s', '2s', '3s', '4s', '5s', '6s', '7s', '8s', '9s',
  '東', '南', '西', '北', '白', '發', '中',
]

export const tileName = (t: Tile): string => TILE_NAMES[t]

/** "1m" / "東" 等から牌IDへ。テスト・デバッグ用。 */
export const tileFromName = (name: string): Tile => {
  const i = TILE_NAMES.indexOf(name)
  if (i < 0) throw new Error(`unknown tile: ${name}`)
  return i
}

/**
 * "123m456p789s11z" 形式のショートハンドを牌の配列へ。
 * 字牌は 1z..7z (東南西北白發中)。テスト用。
 */
export const parseHand = (s: string): Tile[] => {
  const out: Tile[] = []
  let digits: number[] = []
  for (const ch of s) {
    if (ch >= '0' && ch <= '9') {
      digits.push(Number(ch))
      continue
    }
    const base = ch === 'm' ? MAN : ch === 'p' ? PIN : ch === 's' ? SOU : ch === 'z' ? HONOR : -1
    if (base < 0) throw new Error(`unknown suit char: ${ch}`)
    for (const d of digits) {
      if (d < 1) throw new Error(`invalid rank 0 in "${s}" (韓麻に赤牌の別表現は無い)`)
      out.push(base + d - 1)
    }
    digits = []
  }
  if (digits.length) throw new Error(`trailing digits in "${s}"`)
  return out
}

/** 牌配列 -> 種類ごとの枚数(長さ34)。 */
export const toCounts = (tiles: readonly Tile[]): number[] => {
  const c = new Array(TILE_KINDS).fill(0)
  for (const t of tiles) c[t]++
  return c
}

/** 枚数配列 -> 牌配列(昇順)。 */
export const fromCounts = (counts: readonly number[]): Tile[] => {
  const out: Tile[] = []
  for (let t = 0; t < TILE_KINDS; t++) for (let i = 0; i < counts[t]; i++) out.push(t)
  return out
}

/** 136枚の山（未シャッフル）。 */
export const buildWall = (): Tile[] => {
  const out: Tile[] = []
  for (let t = 0; t < TILE_KINDS; t++) for (let i = 0; i < 4; i++) out.push(t)
  return out
}

/** ドラ表示牌 -> ドラ。9m->1m, 北->東, 中->白 と巡回する。 */
export const doraFromIndicator = (indicator: Tile): Tile => {
  if (isSuit(indicator)) {
    const r = rankOf(indicator)
    return indicator - r + ((r + 1) % 9)
  }
  // 風牌 27..30 (東南西北) と三元牌 31..33 (白發中) は別々に巡回する。
  if (indicator <= HONOR + 3) return HONOR + ((indicator - HONOR + 1) % 4)
  return HONOR + 4 + ((indicator - (HONOR + 4) + 1) % 3)
}
