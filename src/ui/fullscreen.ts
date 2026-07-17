/**
 * 全画面表示。
 *
 * スマホはブラウザのURLバー等に高さを取られ、卓が小さくなる。
 * 全画面にすると縦が20〜25%ほど広がるので、そのぶん牌を大きくできる。
 * あわせて横向きに固定できる端末では固定する (韓麻は手牌14枚を横に並べるため
 * 横向きの方が牌を大きく出せる)。
 */

/** 画面の向きを固定できる端末向けのAPI。標準の型定義にはまだ無い。 */
type OrientationLock = ScreenOrientation & {
  lock?: (o: 'landscape' | 'portrait') => Promise<void>
  unlock?: () => void
}

export const isFullscreen = (): boolean => document.fullscreenElement !== null

export const supportsFullscreen = (): boolean =>
  typeof document !== 'undefined' && !!document.documentElement.requestFullscreen

/**
 * iOS かどうか。
 *
 * iOS は Chrome や Firefox も中身が WebKit に強制されるため、
 * ブラウザを問わず全画面APIが無い (実測で requestFullscreen も webkit 版も undefined)。
 * よってブラウザ名では絞らず、iOS 全体を対象にする。
 * 代わりにホーム画面へ追加するとURLバーが消えて全画面相当になるので、その案内を出す。
 */
export const isIos = (): boolean => {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  // iPadOS は UA が Macintosh を名乗るので、タッチの有無で見分ける。
  return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
}

/** ホーム画面から起動した状態 (この場合は既にURLバーが無い)。 */
export const isStandalone = (): boolean =>
  typeof window !== 'undefined' &&
  (window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true)

export const enterFullscreen = async (): Promise<void> => {
  try {
    await document.documentElement.requestFullscreen()
  } catch {
    return // 端末やブラウザが拒否した場合は諦める (iOS Safari など)
  }
  // 全画面のときだけ向きを固定できる。失敗しても全画面自体は維持する。
  const o = screen.orientation as OrientationLock | undefined
  try {
    await o?.lock?.('landscape')
  } catch {
    /* 向きの固定に対応していない端末では何もしない */
  }
}

export const exitFullscreen = async (): Promise<void> => {
  const o = screen.orientation as OrientationLock | undefined
  try {
    o?.unlock?.()
  } catch {
    /* 対応していない端末では何もしない */
  }
  try {
    if (document.fullscreenElement) await document.exitFullscreen()
  } catch {
    /* 既に解除されている場合など */
  }
}

export const toggleFullscreen = (): Promise<void> =>
  isFullscreen() ? exitFullscreen() : enterFullscreen()

/** 全画面の出入りを購読する (ESCで抜けた場合も拾う)。 */
export const onFullscreenChange = (fn: (on: boolean) => void): (() => void) => {
  const h = () => fn(isFullscreen())
  document.addEventListener('fullscreenchange', h)
  return () => document.removeEventListener('fullscreenchange', h)
}
