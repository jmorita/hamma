/**
 * ルールタブ。
 * 点数まわりは実際に使っている Rules / StakeSettings から表示するので、
 * 設定を変えれば表示も追従し、説明と実装がずれない。
 */
import type { ReactNode } from 'react'
import type { Rules } from '../core/score'
import type { StakeSettings } from '../core/stakes'
import { formatChips } from '../core/stakes'

interface Props {
  rules: Rules
  stakes: StakeSettings
  seatCount: number
}

const Row = ({ k, v }: { k: string; v: ReactNode }) => (
  <tr>
    <th>{k}</th>
    <td>{v}</td>
  </tr>
)

/** 強調したい要点。 */
const B = ({ children }: { children: ReactNode }) => <b>{children}</b>

export const RulesPanel = ({ rules, stakes, seatCount }: Props) => (
  <div className="rules-panel">
    <h3>和了と牌</h3>
    <table>
      <tbody>
        <Row k="和了形" v={<>4メンツ1雀頭ならどんな形でも和了可能。<B>役なし・符なし</B></>} />
        <Row k="例外形" v="4メンツ1雀頭以外の特殊形は七対子・国士無双のみ (門前のみ)" />
        <Row k="使用牌" v={<>136枚。<B>3人打ちでも4人打ちでも枚数は変わらない</B></>} />
        <Row k="赤ドラ" v={<B>数牌の5は全12枚が赤ドラ</B>} />
        <Row k="表ドラ" v={<B>開局時から2枚オープン</B>} />
        <Row k="裏ドラ" v={<B>リーチ和了時に2枚オープン</B>} />
        <Row k="カンドラ" v={<><B>なし</B> (カンしてもドラは増えない)</>} />
        <Row
          k="フリテン"
          v={
            <>
              <B>なし</B> (テンパイしていればいつでも和了れる、リーチ後の見逃しもOK、
              <B>同巡のみ見逃しロンは不可</B>)
            </>
          }
        />
      </tbody>
    </table>

    <h3>点数</h3>
    <table>
      <tbody>
        <Row k="ロン" v={`${rules.ronPoints}点 (放銃者が全額払う)`} />
        <Row k="ツモ" v={`${rules.tsumoPoints}点 (全員が同額払う)`} />
        <Row k="リーチ" v={`${rules.riichiPoints}点`} />
        <Row k="ドラ" v={`1枚につき${rules.doraPoints}点`} />
        <Row k="国士無双" v={`${rules.kokushiPoints}点 (ドラ・リーチと複合しない)`} />
        <Row k="七対子" v="加点なし。ただしドラとは複合する" />
        <Row k="支払い上限" v={`1人あたり ${rules.maxPaymentPerPlayer}点`} />
      </tbody>
    </table>

    <h3>進行</h3>
    <table>
      <tbody>
        <Row k="副露" v={<>ポン・カンのみ。<B>チーはなし</B></>} />
        <Row
          k="カン制限"
          v={`1局で全員合わせて${rules.maxKansPerHand}回まで。${rules.maxKansPerHand}回目以降はカンできない (流局しない)`}
        />
        <Row k="リーチ" v="門前かつテンパイで宣言可。供託棒なし (宣言牌を横に置くだけ)" />
        <Row k="親" v="第一ツモを取るだけ。連荘なし・席替えなし・一局精算" />
        <Row k="ダブロン" v={<><B>なし</B> (頭ハネ)</>} />
        <Row k="流局" v="ツモ山が尽きたら流局。ノーテン罰符なし" />
        <Row k="王牌" v="嶺上牌4枚 + ドラ表示2枚 + 裏ドラ表示2枚の計8枚" />
        <Row
          k="ツモ山"
          v={`王牌8枚を除いた${seatCount === 3 ? '89' : '76'}枚 (${seatCount}人打ち)。カンしても減らない`}
        />
        <Row k="食い替え" v={<>ポンした牌と同じ牌は<B>直後に切れない</B></>} />
      </tbody>
    </table>

    <h3>仮想レート / レーキ</h3>
    <table>
      <tbody>
        <Row k="レート" v={stakes.rate === 0 ? 'なし (点数のみ)' : `1点 = ${formatChips(stakes.rate)}W`} />
        <Row
          k="レーキ"
          v={stakes.rakePercent === 0 ? 'なし' : <B>和了者の受取から {stakes.rakePercent}%</B>}
        />
        <Row k="デポジット" v={stakes.deposit === 0 ? 'なし' : `${formatChips(stakes.deposit)}W`} />
      </tbody>
    </table>
    <p className="note warn">
      扱うのは仮想の額のみで、金銭は一切扱いません
      (日本国内で金銭を賭ければ賭博罪に該当し得ます)。
    </p>

    {seatCount === 3 && (
      <p className="note">3人打ちのため、ツモの支払いは2人ぶん (収入は2倍) になります。</p>
    )}
  </div>
)
