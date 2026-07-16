import { describe, it, expect } from 'vitest'
import { parseHand, toCounts, TILE_KINDS } from './tiles'
import { shanten, standardShanten, chiitoitsuShanten, kokushiShanten, ukeire } from './shanten'

const counts = (s: string) => toCounts(parseHand(s))

describe('シャンテン数', () => {
  it('和了形は -1', () => {
    expect(standardShanten(counts('234m567m22p345s678s'), 0)).toBe(-1)
  })

  it('テンパイは 0', () => {
    expect(standardShanten(counts('234m567m22p345s67s'), 0)).toBe(0)
    // 4メンツ + 浮き牌 = 単騎テンパイ
    expect(standardShanten(counts('123m456m789m123p5s'), 0)).toBe(0)
  })

  it('嵌張が残っていてもテンパイはテンパイ', () => {
    // 234m 567m 345s + 22p雀頭 + 57s嵌張 → 6s待ち
    expect(standardShanten(counts('234m567m22p345s57s'), 0)).toBe(0)
  })

  it('1シャンテン', () => {
    // 3メンツ + 44p雀頭 + 孤立牌2枚。どちらかを対子にすればテンパイ。
    expect(standardShanten(counts('111m222m333m44p19s'), 0)).toBe(1)
  })

  it('5ブロックあっても雀頭が無ければテンパイにならない', () => {
    // 123m456m789m + 13p嵌張 + 57s嵌張。ブロックは5つあるが雀頭が無い。
    expect(standardShanten(counts('123m456m789m13p57s'), 0)).toBe(1)
  })

  it('バラバラの配牌は大きな値になる', () => {
    expect(standardShanten(counts('147m258p369s1234z'), 0)).toBeGreaterThan(4)
  })

  it('副露分を勘定に入れる', () => {
    // 2メンツ副露 + 手牌7枚 = テンパイ
    expect(standardShanten(counts('234m567m1p'), 2)).toBe(0)
    expect(standardShanten(counts('234m567m11p'), 2)).toBe(-1)
  })

  it('七対子', () => {
    expect(chiitoitsuShanten(counts('11223344556677p'))).toBe(-1)
    expect(chiitoitsuShanten(counts('1122334455668p'))).toBe(0)
    // 4枚持ちは種類が足りない分だけ余計にかかる
    expect(chiitoitsuShanten(counts('1111223344556p'))).toBe(2)
  })

  it('国士無双', () => {
    expect(kokushiShanten(counts('19m19p19s1234567z1z'))).toBe(-1)
    // 十三面待ち
    expect(kokushiShanten(counts('19m19p19s1234567z'))).toBe(0)
    expect(kokushiShanten(counts('19m19p19s123456z2m'))).toBe(1)
  })

  it('shanten() は3形の最小値を返す', () => {
    // 対子だらけの手。七対子テンパイだが、標準形では遠い。
    const c = counts('1199m1199p1199s1z')
    expect(chiitoitsuShanten(c)).toBe(0)
    expect(standardShanten(c, 0)).toBeGreaterThan(0)
    expect(shanten(c, 0)).toBe(0)
  })
})

describe('受け入れ', () => {
  const noneVisible = new Array(TILE_KINDS).fill(0)

  it('三面待ちの受け入れ枚数', () => {
    // 234m567m22p345s67s は 2s/5s/8s 待ち。何も見えていなければ 4×3 = 12枚。
    const r = ukeire(counts('234m567m22p345s67s'), 0, noneVisible)
    expect(r.count).toBe(12)
  })

  it('見えている牌は受け入れから引かれる', () => {
    const visible = new Array(TILE_KINDS).fill(0)
    const c = counts('234m567m22p345s67s')
    for (let t = 0; t < TILE_KINDS; t++) visible[t] = c[t]
    const r = ukeire(c, 0, visible)
    // 5s は自分の手牌に1枚あるので残り3枚、2s と 8s は4枚ずつ → 3 + 4 + 4 = 11
    expect(r.count).toBe(11)
  })
})
