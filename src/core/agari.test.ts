import { describe, it, expect } from 'vitest'
import { parseHand, toCounts, doraFromIndicator, tileFromName, buildWall } from './tiles'
import { agariShape, isChiitoitsu, isKokushi, waitingTiles, isTenpai } from './agari'

const counts = (s: string) => toCounts(parseHand(s))

describe('牌の基本', () => {
  it('136枚ある', () => {
    expect(buildWall()).toHaveLength(136)
  })

  it('ドラ表示牌は数牌内で巡回する', () => {
    expect(doraFromIndicator(tileFromName('1m'))).toBe(tileFromName('2m'))
    expect(doraFromIndicator(tileFromName('9m'))).toBe(tileFromName('1m'))
    expect(doraFromIndicator(tileFromName('9s'))).toBe(tileFromName('1s'))
  })

  it('風牌と三元牌は別々に巡回する', () => {
    expect(doraFromIndicator(tileFromName('東'))).toBe(tileFromName('南'))
    expect(doraFromIndicator(tileFromName('北'))).toBe(tileFromName('東'))
    expect(doraFromIndicator(tileFromName('白'))).toBe(tileFromName('發'))
    expect(doraFromIndicator(tileFromName('中'))).toBe(tileFromName('白'))
  })
})

describe('和了形', () => {
  it('4メンツ1雀頭ならどんな形でもアガリ (役なし)', () => {
    // リーチ麻雀なら役なしで和了れない形。韓麻では和了れる。
    expect(agariShape(counts('234m567m22p345s678s'), 0)).toBe('standard')
    expect(agariShape(counts('123m456m789m123p11s'), 0)).toBe('standard')
  })

  it('字牌の刻子を含む形', () => {
    expect(agariShape(counts('111z222z333z44z567m'), 0)).toBe('standard')
  })

  it('副露ありでも4メンツ1雀頭', () => {
    // 手牌8枚 + 副露2メンツ
    expect(agariShape(counts('234m567m11p'), 2)).toBe('standard')
  })

  it('形になっていなければ null', () => {
    expect(agariShape(counts('123m456m789m123p12s'), 0)).toBeNull()
    expect(agariShape(counts('19m19p19s1234567z1z'), 0)).not.toBeNull() // 国士
  })

  it('七対子は7種の対子を要求する', () => {
    expect(isChiitoitsu(counts('11223344556677p'))).toBe(true)
    expect(agariShape(counts('11223344556677p'), 0)).toBe('chiitoitsu')
    // 4枚使いは2組の対子とみなさない
    expect(isChiitoitsu(counts('11112233445566p'))).toBe(false)
  })

  it('国士無双', () => {
    expect(isKokushi(counts('19m19p19s1234567z1z'))).toBe(true)
    expect(agariShape(counts('19m19p19s1234567z1z'), 0)).toBe('kokushi')
    // 十三面待ちの和了形も同じ
    expect(isKokushi(counts('19m19p19s1234567z9m'))).toBe(true)
    // 1種欠け
    expect(isKokushi(counts('19m19p11s1234567z1z'))).toBe(false)
  })

  it('副露していると七対子・国士は成立しない', () => {
    expect(agariShape(counts('11223344556677p'), 1)).toBeNull()
  })
})

describe('待ち', () => {
  it('345s+67s は 2s/5s/8s の三面待ちになる', () => {
    // 345s+67s は 2s で 234s+567s に組み替わるため、両面の5s/8sに加えて2sでも和了れる。
    const w = waitingTiles(counts('234m567m22p345s67s'), 0)
    expect(w).toEqual([tileFromName('2s'), tileFromName('5s'), tileFromName('8s')])
  })

  it('単純な両面待ち', () => {
    const w = waitingTiles(counts('234m567m22p789s67s'), 0)
    expect(w).toEqual([tileFromName('5s'), tileFromName('8s')])
  })

  it('シャンポン待ち', () => {
    const w = waitingTiles(counts('234m567m22p345s99s'), 0)
    expect(w).toEqual([tileFromName('2p'), tileFromName('9s')])
  })

  it('4枚使い切った牌では単騎待ちにならない', () => {
    // 234m 567m 222p 345s + 2p単騎。2pは手牌に4枚あるので残り0枚 = 待ちが成立しない。
    const w = waitingTiles(counts('234m567m2222p345s'), 0)
    expect(w).toEqual([])
  })

  it('テンパイでなければ空', () => {
    expect(isTenpai(counts('123m456m789m13p57s'), 0)).toBe(false)
  })
})
