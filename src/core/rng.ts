/** シード付き乱数 (mulberry32)。局を再現できるようにするため使う。 */
export interface Rng {
  next(): number
  readonly seed: number
}

export const makeRng = (seed: number): Rng => {
  let a = seed >>> 0
  return {
    seed,
    next() {
      a = (a + 0x6d2b79f5) >>> 0
      let t = a
      t = Math.imul(t ^ (t >>> 15), t | 1)
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    },
  }
}

/** Fisher-Yates。引数の配列を破壊的にシャッフルする。 */
export const shuffle = <T>(arr: T[], rng: Rng): T[] => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}
