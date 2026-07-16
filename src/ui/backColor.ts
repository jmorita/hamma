/** 牌の背の色。 */
export type BackColor = 'blue' | 'purple' | 'yellow' | 'green' | 'black'

export const BACK_COLORS: { id: BackColor; label: string }[] = [
  { id: 'blue', label: '青' },
  { id: 'purple', label: '紫' },
  { id: 'yellow', label: '黄' },
  { id: 'green', label: '緑' },
  { id: 'black', label: '黒' },
]

/** 設定値。'random' は卓を立てるたびに選び直す。 */
export type BackColorSetting = BackColor | 'random'

export const pickBackColor = (setting: BackColorSetting): BackColor =>
  setting === 'random' ? BACK_COLORS[Math.floor(Math.random() * BACK_COLORS.length)].id : setting
