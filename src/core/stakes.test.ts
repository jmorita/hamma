import { describe, it, expect } from 'vitest'
import { settle, shortOfDeposit, DEFAULT_STAKES, NO_STAKES } from './stakes'

describe('仮想レート精算', () => {
  const stakes = { ...DEFAULT_STAKES, rate: 100, rakePercent: 5 }

  it('点数にレートを掛ける', () => {
    const { chipDeltas } = settle([10, 0, 0, -10], { ...stakes, rakePercent: 0 })
    expect(chipDeltas).toEqual([1000, 0, 0, -1000])
  })

  it('レーキは和了者の受取からのみ引かれる', () => {
    const { chipDeltas, rake } = settle([10, 0, 0, -10], stakes)
    expect(chipDeltas[0]).toBe(950) // 1000 - 5%
    expect(chipDeltas[3]).toBe(-1000) // 放銃者の支払いは増えない
    expect(rake).toBe(50)
  })

  it('ツモは全員から取るので受取全体にレーキがかかる', () => {
    const { chipDeltas, rake } = settle([21, -7, -7, -7], stakes)
    expect(chipDeltas[0]).toBe(2100 - 105)
    expect(rake).toBe(105)
  })

  it('レーキの分だけチップの総和はマイナスになる (ハウスの取り分)', () => {
    const { chipDeltas, rake } = settle([10, 0, 0, -10], stakes)
    expect(chipDeltas.reduce((a, b) => a + b, 0) + rake).toBe(0)
  })

  it('レートなしなら全て0のまま', () => {
    const { chipDeltas, rake } = settle([10, 0, 0, -10], NO_STAKES)
    expect(chipDeltas).toEqual([0, 0, 0, 0])
    expect(rake).toBe(0)
  })

  it('3人打ちでも席数に合わせて返す', () => {
    const { chipDeltas } = settle([12, -6, -6], { ...stakes, rakePercent: 0 })
    expect(chipDeltas).toEqual([1200, -600, -600])
  })

  it('デポジット不足の席を検出する', () => {
    expect(shortOfDeposit([5000, 500, 1000, 0], { ...stakes, deposit: 1000 })).toEqual([1, 3])
    expect(shortOfDeposit([5000, 2000], { ...stakes, deposit: 1000 })).toEqual([])
  })
})
