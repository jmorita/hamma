/**
 * 簡易CPU。
 *
 * 韓麻には役が無いので、方針はほぼ牌効率に尽きる:
 *   - シャンテンを落とさない打牌のうち、受け入れが最大の牌を切る
 *   - 同点なら、ドラ(=5)を残し、孤立字牌から先に切る
 *   - リーチは供託が無く2点付いて裏ドラも見られるので、打てるなら常に打つ
 *   - ポン/カンは役が不要なので、シャンテンが進むなら鳴く
 *     (ただしテンパイに近い門前手はリーチの価値を優先して鳴かない)
 */
import { toCounts, isRed, isHonor, rankOf, isSuit, TILE_KINDS, type Tile } from '../core/tiles'
import { shanten, ukeire } from '../core/shanten'
import {
  calledMeldCount,
  turnOptions,
  selfKanOptions,
  type GameState,
  type Seat,
  type CallOption,
} from '../core/game'

/** 場に見えている牌の枚数 (自分の手牌・全員の副露と捨て牌・ドラ表示牌)。 */
const visibleCounts = (s: GameState, seat: Seat): number[] => {
  const v = new Array(TILE_KINDS).fill(0)
  for (const t of s.players[seat].hand) v[t]++
  for (const p of s.players) {
    for (const t of p.discards) v[t]++
    for (const m of p.melds) {
      const n = m.kind === 'pon' ? 3 : 4
      v[m.tile] += n
    }
  }
  for (const t of s.doraIndicators) v[t]++
  for (let t = 0; t < TILE_KINDS; t++) v[t] = Math.min(v[t], 4)
  return v
}

/** 同点時のタイブレーク。小さいほど「切りたい」牌。 */
const keepValue = (t: Tile, counts: readonly number[]): number => {
  let v = 0
  if (isRed(t)) v += 3 // 5は全て赤ドラ = 1点
  if (isHonor(t)) v -= 1
  else {
    // 端に近いほど使いにくい
    const r = rankOf(t)
    v += Math.min(r, 8 - r) * 0.1
  }
  if (counts[t] >= 2) v += 0.5 // 対子は残す
  // 隣接牌があれば伸びる
  if (isSuit(t)) {
    const r = rankOf(t)
    for (const d of [-2, -1, 1, 2]) {
      const n = t + d
      if (r + d < 0 || r + d > 8) continue
      if (counts[n] > 0) v += 0.3
    }
  }
  return v
}

export interface CpuDiscard {
  tile: Tile
  riichi: boolean
}

/** 手番でのCPUの選択。 */
export const cpuTurnAction = (
  s: GameState,
  seat: Seat,
): { kind: 'tsumo' } | { kind: 'kan'; tile: Tile } | { kind: 'discard'; tile: Tile; riichi: boolean } => {
  const opts = turnOptions(s, seat)
  if (opts.canTsumo) return { kind: 'tsumo' }

  const p = s.players[seat]
  const called = calledMeldCount(p)

  // 暗槓: シャンテンが悪化しないなら打つ。ドラは増えないが嶺上ツモが得られる。
  for (const t of selfKanOptions(s, seat)) {
    const before = shanten(toCounts(p.hand), called)
    const rest = p.hand.filter((x) => x !== t)
    const after = shanten(toCounts(rest), called + 1)
    if (after <= before) return { kind: 'kan', tile: t }
  }

  const visible = visibleCounts(s, seat)
  const counts = toCounts(p.hand)

  // リーチ可能なら常に宣言する。コストが無く、2点と裏ドラが付くため。
  if (opts.riichiTiles.length > 0) {
    const best = pickBest(opts.riichiTiles, counts, called, visible)
    return { kind: 'discard', tile: best, riichi: true }
  }

  const best = pickBest(opts.discardable, counts, called, visible)
  return { kind: 'discard', tile: best, riichi: false }
}

/** 候補の中から、シャンテン最小 → 受け入れ最大 → keepValue最小 で選ぶ。 */
const pickBest = (
  candidates: readonly Tile[],
  counts: number[],
  called: number,
  visible: readonly number[],
): Tile => {
  let best: Tile = candidates[0]
  let bestShanten = Infinity
  let bestUkeire = -1
  let bestKeep = Infinity

  for (const t of candidates) {
    counts[t]--
    const sh = shanten(counts, called)
    const uk = ukeire(counts, called, visible).count
    counts[t]++
    const keep = keepValue(t, counts)

    if (
      sh < bestShanten ||
      (sh === bestShanten && uk > bestUkeire) ||
      (sh === bestShanten && uk === bestUkeire && keep < bestKeep)
    ) {
      best = t
      bestShanten = sh
      bestUkeire = uk
      bestKeep = keep
    }
  }
  return best
}

/** 鳴き/ロンへのCPUの応答。 */
export const cpuCallResponse = (s: GameState, seat: Seat, options: readonly CallOption[]): CallOption => {
  if (options.includes('ron')) return 'ron'

  const p = s.players[seat]
  const tile = s.lastDiscard!.tile
  const called = calledMeldCount(p)
  const counts = toCounts(p.hand)
  const before = shanten(counts, called)

  // 門前でテンパイ・1シャンテンなら、リーチの2点と裏ドラを優先して鳴かない。
  if (called === 0 && before <= 1) return 'pass'

  const tryCall = (remove: number, meldDelta: number): number => {
    counts[tile] -= remove
    const after = shanten(counts, called + meldDelta)
    counts[tile] += remove
    return after
  }

  if (options.includes('minkan') && tryCall(3, 1) < before) return 'minkan'
  if (options.includes('pon') && tryCall(2, 1) < before) return 'pon'
  return 'pass'
}
