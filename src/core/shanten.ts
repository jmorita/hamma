/**
 * シャンテン数。CPUの牌効率判断に使う。
 * -1 = 和了, 0 = テンパイ。
 *
 * 手牌全体を1回のDFSで探索すると組み合わせが爆発するため、
 * 萬子/筒子/索子/字牌の4グループに分けて別々に分解し、結果を合成する。
 * グループ内の分解結果は牌姿をキーにメモ化できるので、
 * 受け入れ計算のように似た手を何度も評価する用途で効く。
 */
import { TILE_KINDS, type Tile } from './tiles'
import { KOKUSHI_TILES } from './agari'

/** グループの分解結果: index = メンツ数, value = そのとき取れる部分形の最大数 (-1 = 不可能)。 */
type GroupDecomp = number[]

const MAX_BLOCKS = 4

const decompCache = new Map<string, GroupDecomp>()

/**
 * 1グループ (数牌9種 or 字牌7種) の分解。
 * c はグループ分だけを切り出した枚数配列。
 */
const decompose = (c: number[], allowRuns: boolean): GroupDecomp => {
  const len = c.length
  const key = (allowRuns ? 'r' : 'h') + c.join('')
  const hit = decompCache.get(key)
  if (hit) return hit

  const res: GroupDecomp = new Array(MAX_BLOCKS + 1).fill(-1)

  const rec = (i: number, melds: number, partials: number): void => {
    if (partials > res[melds]) res[melds] = partials
    if (melds + partials >= MAX_BLOCKS) return
    while (i < len && c[i] === 0) i++
    if (i >= len) return

    // 刻子
    if (c[i] >= 3) {
      c[i] -= 3
      rec(i, melds + 1, partials)
      c[i] += 3
    }
    // 順子
    if (allowRuns && i + 2 < len && c[i + 1] > 0 && c[i + 2] > 0) {
      c[i]--; c[i + 1]--; c[i + 2]--
      rec(i, melds + 1, partials)
      c[i]++; c[i + 1]++; c[i + 2]++
    }
    // 対子
    if (c[i] >= 2) {
      c[i] -= 2
      rec(i, melds, partials + 1)
      c[i] += 2
    }
    // 両面 / 辺張
    if (allowRuns && i + 1 < len && c[i + 1] > 0) {
      c[i]--; c[i + 1]--
      rec(i, melds, partials + 1)
      c[i]++; c[i + 1]++
    }
    // 嵌張
    if (allowRuns && i + 2 < len && c[i + 2] > 0) {
      c[i]--; c[i + 2]--
      rec(i, melds, partials + 1)
      c[i]++; c[i + 2]++
    }
    // 浮き牌として捨てる
    c[i]--
    rec(i, melds, partials)
    c[i]++
  }

  rec(0, 0, 0)
  decompCache.set(key, res)
  return res
}

const groupsOf = (c: readonly number[]): GroupDecomp[] => [
  decompose(c.slice(0, 9), true),
  decompose(c.slice(9, 18), true),
  decompose(c.slice(18, 27), true),
  decompose(c.slice(27, 34), false),
]

/** 各グループから (メンツ, 部分形) を選び、メンツ+部分形 <= limit の下で 2*メンツ+部分形 を最大化する。 */
const combine = (groups: readonly GroupDecomp[], limit: number): number => {
  let best = 0
  const rec = (gi: number, melds: number, partials: number): void => {
    if (gi === groups.length) {
      const v = 2 * melds + partials
      if (v > best) best = v
      return
    }
    const g = groups[gi]
    for (let m = 0; m <= MAX_BLOCKS; m++) {
      if (g[m] < 0) continue
      if (melds + partials + m > limit) break
      for (let p = 0; p <= g[m]; p++) {
        if (melds + partials + m + p > limit) break
        rec(gi + 1, melds + m, partials + p)
      }
    }
  }
  rec(0, 0, 0)
  return best
}

/** 4メンツ1雀頭形のシャンテン数。 */
export const standardShanten = (counts: readonly number[], calledMelds: number): number => {
  const c = counts.slice()
  const limit = MAX_BLOCKS - calledMelds
  let best = Infinity

  const evaluate = (hasPair: boolean) => {
    const blocks = combine(groupsOf(c), limit)
    const s = 8 - 2 * calledMelds - blocks - (hasPair ? 1 : 0)
    if (s < best) best = s
  }

  // 雀頭を固定しない場合 (4メンツ+単騎など)
  evaluate(false)
  // 雀頭を1つ抜いてから残りを分解する
  for (let t = 0; t < TILE_KINDS; t++) {
    if (c[t] < 2) continue
    c[t] -= 2
    evaluate(true)
    c[t] += 2
  }
  return best
}

/** 七対子のシャンテン数。副露していると成立しない。 */
export const chiitoitsuShanten = (counts: readonly number[]): number => {
  let pairs = 0
  let kinds = 0
  for (let t = 0; t < TILE_KINDS; t++) {
    if (counts[t] === 0) continue
    kinds++
    if (counts[t] >= 2) pairs++
  }
  // 4枚持ちがあると種類が足りず、その分だけ余計に手数がかかる。
  return 6 - pairs + Math.max(0, 7 - kinds)
}

/** 国士無双のシャンテン数。 */
export const kokushiShanten = (counts: readonly number[]): number => {
  let kinds = 0
  let hasPair = false
  for (const t of KOKUSHI_TILES) {
    if (counts[t] > 0) kinds++
    if (counts[t] >= 2) hasPair = true
  }
  return 13 - kinds - (hasPair ? 1 : 0)
}

/** 3形すべてを見た最小シャンテン数。 */
export const shanten = (counts: readonly number[], calledMelds: number): number => {
  let best = standardShanten(counts, calledMelds)
  if (calledMelds === 0) {
    best = Math.min(best, chiitoitsuShanten(counts), kokushiShanten(counts))
  }
  return best
}

/**
 * 13枚の手牌に対する有効牌(受け入れ)と、その残り枚数の合計。
 * visible は場に見えている牌の枚数(自分の手牌・副露・捨て牌・ドラ表示牌)。
 */
export const ukeire = (
  counts: number[],
  calledMelds: number,
  visible: readonly number[],
): { tiles: Tile[]; count: number } => {
  const base = shanten(counts, calledMelds)
  const tiles: Tile[] = []
  let count = 0
  for (let t = 0; t < TILE_KINDS; t++) {
    const remaining = 4 - visible[t]
    if (remaining <= 0) continue
    if (counts[t] >= 4) continue
    counts[t]++
    const s = shanten(counts, calledMelds)
    counts[t]--
    if (s < base) {
      tiles.push(t)
      count += remaining
    }
  }
  return { tiles, count }
}
