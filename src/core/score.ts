/**
 * 点数計算。
 *
 * 役も符も無いので、加算するのは「アガリ方 + リーチ + ドラ」だけ。
 *   ロン   6点 (放銃者が全額払う)
 *   ツモ   2点 (全員がそれぞれ払う → 4人打ちなら収入は3倍)
 *   リーチ 2点
 *   ドラ   1枚1点
 *   国士無双 20点 (他と複合しない)
 * 1人あたりの支払いは20点が上限。
 */
import { doraFromIndicator, isRed, type Tile } from './tiles'
import type { AgariShape } from './agari'

export interface Rules {
  ronPoints: number
  tsumoPoints: number
  /**
   * リーチの加点。
   * 記事のルール表は2点だが、記事中の計算例(「リーチ・ドラ2」でロン8点)は
   * リーチを加算していない。表を正とし、0にも切り替えられるようにしてある。
   */
  riichiPoints: number
  doraPoints: number
  kokushiPoints: number
  /** 1人あたりの支払い上限。 */
  maxPaymentPerPlayer: number
  /** 1局で全員が可能なカンの合計回数。 */
  maxKansPerHand: number
}

export const DEFAULT_RULES: Rules = {
  ronPoints: 6,
  tsumoPoints: 2,
  riichiPoints: 2,
  doraPoints: 1,
  kokushiPoints: 20,
  maxPaymentPerPlayer: 20,
  maxKansPerHand: 4,
}

/** ドラ表示牌からドラ牌の集合を作る。 */
export const doraTilesFrom = (indicators: readonly Tile[]): Tile[] =>
  indicators.map(doraFromIndicator)

/**
 * 手牌(副露含む全14枚)のドラ枚数。
 * 赤(=全ての5)と表/裏ドラは重複して数える。
 */
export const countDora = (tiles: readonly Tile[], doraTiles: readonly Tile[]): number => {
  let n = 0
  for (const t of tiles) {
    if (isRed(t)) n++
    for (const d of doraTiles) if (t === d) n++
  }
  return n
}

export interface ScoreInput {
  shape: AgariShape
  /** 副露・カンを含む手牌の全牌。ドラを数える対象。 */
  allTiles: readonly Tile[]
  byTsumo: boolean
  riichi: boolean
  /** 表ドラ + (リーチ和了時のみ)裏ドラ。 */
  doraTiles: readonly Tile[]
  rules?: Rules
}

/**
 * 内訳の1行。
 * count は「ドラ ×2」のような枚数。label に枚数を混ぜると
 * 「ドラ2」+「2点」が「ドラ22点」と読めてしまうので分けて持つ。
 */
export interface ScorePart {
  label: string
  count?: number
  points: number
}

export interface ScoreBreakdown {
  /** 支払い側1人あたりの点数(上限適用後)。 */
  perPayer: number
  /** 和了者の総収入。 */
  total: number
  /** 内訳の説明。 */
  parts: ScorePart[]
  capped: boolean
}

/**
 * 支払い1人あたりの点数を計算する。
 * 4人打ちのツモなら total = perPayer * 3、ロンなら total = perPayer。
 */
export const scoreHand = (input: ScoreInput, opponents: number): ScoreBreakdown => {
  const rules = input.rules ?? DEFAULT_RULES
  const parts: ScorePart[] = []

  let raw: number
  if (input.shape === 'kokushi') {
    // 国士無双はドラともリーチとも複合しない固定20点。
    raw = rules.kokushiPoints
    parts.push({ label: '国士無双', points: rules.kokushiPoints })
  } else {
    const base = input.byTsumo ? rules.tsumoPoints : rules.ronPoints
    parts.push({ label: input.byTsumo ? 'ツモ' : 'ロン', points: base })
    raw = base

    if (input.riichi && rules.riichiPoints > 0) {
      parts.push({ label: 'リーチ', points: rules.riichiPoints })
      raw += rules.riichiPoints
    }

    const dora = countDora(input.allTiles, input.doraTiles)
    if (dora > 0) {
      parts.push({ label: 'ドラ', count: dora, points: dora * rules.doraPoints })
      raw += dora * rules.doraPoints
    }
  }

  const perPayer = Math.min(raw, rules.maxPaymentPerPlayer)
  const payers = input.byTsumo ? opponents : 1
  return {
    perPayer,
    total: perPayer * payers,
    parts,
    capped: perPayer < raw,
  }
}
