import { describe, it, expect } from 'vitest'
import { parseHand, tileFromName } from './tiles'
import { scoreHand, countDora, doraTilesFrom, DEFAULT_RULES } from './score'

describe('ドラの数え方', () => {
  it('5は全て赤ドラ', () => {
    expect(countDora(parseHand('555m'), [])).toBe(3)
    expect(countDora(parseHand('5m5p5s'), [])).toBe(3)
    expect(countDora(parseHand('123m'), [])).toBe(0)
  })

  it('表ドラと赤は複合する', () => {
    // 表示牌4m -> ドラ5m。5mは赤でもある。
    const dora = doraTilesFrom([tileFromName('4m')])
    expect(countDora(parseHand('5m'), dora)).toBe(2)
  })

  it('表示牌2枚がどちらも同じドラを指せば2倍', () => {
    const dora = doraTilesFrom([tileFromName('1m'), tileFromName('1m')])
    expect(countDora(parseHand('2m'), dora)).toBe(2)
  })
})

describe('点数計算', () => {
  // 表示牌8p -> ドラ9p。以下の手は9pを2枚持ち、5(赤)を1枚も含まないのでドラちょうど2。
  const dora2 = doraTilesFrom([tileFromName('8p')])

  it('ロンは放銃者が全額払う', () => {
    const r = scoreHand(
      {
        shape: 'standard',
        allTiles: parseHand('234m678m99p123s789s'), // 9p x2 = ドラ2
        byTsumo: false,
        riichi: false,
        doraTiles: dora2,
      },
      3,
    )
    expect(r.perPayer).toBe(6 + 2) // ロン6 + ドラ2
    expect(r.total).toBe(8)
  })

  it('ツモは全員が同額払うので3倍入る', () => {
    const r = scoreHand(
      {
        shape: 'standard',
        allTiles: parseHand('234m678m99p123s789s'),
        byTsumo: true,
        riichi: false,
        doraTiles: dora2,
      },
      3,
    )
    expect(r.perPayer).toBe(2 + 2) // ツモ2 + ドラ2
    expect(r.total).toBe(12)
  })

  it('リーチは2点加算される (ルール表準拠)', () => {
    const r = scoreHand(
      {
        shape: 'standard',
        allTiles: parseHand('234m678m99p123s789s'),
        byTsumo: false,
        riichi: true,
        doraTiles: dora2,
      },
      3,
    )
    expect(r.perPayer).toBe(6 + 2 + 2)
  })

  it('riichiPoints=0 にすると記事中の計算例と一致する', () => {
    const rules = { ...DEFAULT_RULES, riichiPoints: 0 }
    const ron = scoreHand(
      { shape: 'standard', allTiles: parseHand('234m678m99p123s789s'), byTsumo: false, riichi: true, doraTiles: dora2, rules },
      3,
    )
    const tsumo = scoreHand(
      { shape: 'standard', allTiles: parseHand('234m678m99p123s789s'), byTsumo: true, riichi: true, doraTiles: dora2, rules },
      3,
    )
    expect(ron.total).toBe(8) // 記事: 6+1+1=8
    expect(tsumo.total).toBe(12) // 記事: (2+1+1)×3=12
  })

  it('国士無双は20点固定でドラともリーチとも複合しない', () => {
    const r = scoreHand(
      {
        shape: 'kokushi',
        allTiles: parseHand('19m19p19s1234567z1z'),
        byTsumo: false,
        riichi: true,
        doraTiles: doraTilesFrom([tileFromName('9m')]), // -> 1m を持っている
      },
      3,
    )
    expect(r.perPayer).toBe(20)
    expect(r.parts).toEqual([{ label: '国士無双', points: 20 }])
  })

  it('七対子はドラと複合する', () => {
    const r = scoreHand(
      {
        shape: 'chiitoitsu',
        allTiles: parseHand('1122p3344s55m66z77z'), // 5m x2 = 赤ドラ2
        byTsumo: false,
        riichi: false,
        doraTiles: [],
      },
      3,
    )
    expect(r.perPayer).toBe(6 + 2)
  })

  it('1人あたりの支払いは20点で頭打ち', () => {
    // 555m 555p 555s 234m 99p を、表ドラ4m/4p・裏ドラ4s/9p でリーチツモ。
    // 赤9 + 表ドラ(5m3枚+5p3枚) + 裏ドラ(5s3枚+1p0枚) = 18、+ツモ2 +リーチ2 = 22 → 20で頭打ち。
    const r = scoreHand(
      {
        shape: 'standard',
        allTiles: parseHand('555m555p555s234m99p'),
        byTsumo: true,
        riichi: true,
        doraTiles: doraTilesFrom([
          tileFromName('4m'),
          tileFromName('4p'),
          tileFromName('4s'),
          tileFromName('9p'),
        ]),
      },
      3,
    )
    expect(r.perPayer).toBe(20)
    expect(r.capped).toBe(true)
    expect(r.total).toBe(60)
  })
})
