import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { guideFaq, guideScenarios } from '../data/guide';
import { members, roleMeta } from '../data/sampleData';

interface GuideProps {
  onStartTour: () => void;
}

const SCREENS: { path: string; name: string; can: string }[] = [
  { path: '/requests', name: '申請一覧・申請詳細', can: '稟議書と捺印申請を確認し、多段階承認・差戻しを行う（ログイン後の最初の画面）' },
  { path: '/requests/new', name: '新規申請', can: '申請内容を入力し、承認ルートの自動判定をその場で確認する' },
  { path: '/esign', name: '電子契約', can: '複数署名・署名順・署名期限を設定して送信し、リマインド・再送・取消・締結証明の発行まで行う' },
  { path: '/contracts', name: '契約書管理', can: '紙・電子の契約書を1つの台帳で管理し、台帳項目と契約書本文の全文検索で探す' },
  { path: '/register', name: '契約書取込', can: '受領した契約書PDFをOCRで読み取り、AIが抽出した項目を確認して自動振り分け登録する' },
  { path: '/accounting', name: '会計システム連携', can: '契約金額・賃料をCSVに出力し、出力履歴を確認する' },
  { path: '/users', name: '利用者・権限管理', can: '利用者の権限とアカウントの有効・無効、組織を管理する（管理者のみ）' },
  { path: '/audit', name: '監査ログ', can: 'ログイン・権限変更・承認・締結・CSV出力の証跡をアクセス元つきで確認する（管理者のみ）' },
  { path: '/settings', name: '承認ルート設定', can: '承認ルートの条件確認とシミュレーション（管理者のみ）' },
];

/** フェーズ2で追加した機能（フェーズ1版との差分） */
const PHASE2_FEATURES: { name: string; note: string }[] = [
  { name: '電子契約の拡張機能', note: '3名以上の複数署名、署名順の指定と並び替え、署名欄の自由配置、署名期限の管理、リマインド送信、期限を延長しての再送、送信取消、署名拒否' },
  { name: 'OCRによる紙契約書の読み取り', note: '取り込んだPDFの本文を文字として読み取り、契約書に保存する' },
  { name: 'AIによる契約書主要項目の自動抽出', note: '相手先・契約種別・物件・賃料・契約金額・契約期間を項目ごとの確度つきで抽出する' },
  { name: '契約相手先・契約内容による自動振り分け', note: '保管フォルダとタグを相手先企業名と契約種別から自動決定する' },
  { name: '高度な全文検索', note: '契約書本文を含む全文検索。複数キーワードのAND検索、「-語」による除外、契約金額の下限指定、ヒット箇所の抜粋と強調表示' },
  { name: '監査ログ・証跡・セキュリティ強化', note: 'ログイン・権限変更・承認・締結・CSV出力をアクセス元（IPアドレス／端末）つきで記録。ログイン失敗も記録し、管理者のみ閲覧可。アクセスコードによる本人確認を追加' },
];

/** このデモに含めていない機能（フェーズ3の対象） */
const OUT_OF_SCOPE: { name: string; note: string; phase: string }[] = [
  { phase: 'フェーズ3', name: '過去契約書・既存データ移行', note: '既存の契約書データの一括取込' },
  { phase: 'フェーズ3', name: '契約更新・期限管理・アラート強化', note: '更新期限の通知と更新稟議の自動起票' },
  { phase: 'フェーズ3', name: 'AI抽出精度向上・自動登録', note: '抽出精度の改善と、確認なしでの自動登録' },
  { phase: 'フェーズ3', name: 'ワークフローの追加・運用ルール拡張', note: '承認ルートの種類追加と運用ルールの拡張' },
  { phase: 'フェーズ3', name: '管理ダッシュボード・集計機能', note: '処理件数・電子化率などの集計と可視化' },
  { phase: 'フェーズ3', name: '追加の外部システム連携・運用改善', note: '会計システム以外との連携' },
];

export function Guide({ onStartTour }: GuideProps) {
  const navigate = useNavigate();
  const [openId, setOpenId] = useState<string>(guideScenarios[0].id);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">操作ガイド</h1>
          <p className="page-sub">
            このデモで何をどの順に見せるかをまとめた手引きです。はじめての方は、画面を順に案内するガイド付きツアーからどうぞ。
          </p>
        </div>
        <button className="btn btn-primary" onClick={onStartTour}>
          ガイド付きツアーを始める（約6分）
        </button>
      </div>

      <section className="card card-pad mb-16">
        <div className="section-title">
          <span className="bar" />
          このデモでできること
        </div>
        <p className="fs-13 mb-12">
          紙とハンコで行っている月間100〜150件の承認業務を電子化し、
          <strong>ログイン・権限管理 → 申請 → 多段階承認 → 電子契約での締結 → 紙・電子の契約台帳と全文検索 → 会計システムへのCSV出力</strong>
          までを1つのシステムで完結させる想定の業務システムです。これは<strong>フェーズ1・2の範囲</strong>のデモで、
          電子契約は本システム内で完結し、外部システムとの連携は会計システムのみです。
        </p>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>画面</th>
                <th>できること</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {SCREENS.map(s => (
                <tr key={s.path}>
                  <td className="fw-600" style={{ whiteSpace: 'nowrap' }}>
                    {s.name}
                  </td>
                  <td className="fs-13">{s.can}</td>
                  <td>
                    <button className="btn btn-secondary btn-sm" onClick={() => navigate(s.path)}>
                      この画面を開く
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card card-pad mb-16">
        <div className="section-title">
          <span className="bar" />
          シナリオ別の操作手順
        </div>
        <p className="fs-13 text-sub mb-12">
          見出しを押すと手順が開きます。手順の中の「この画面を開く」で、該当画面へそのまま移動できます。
        </p>
        <div className="stack gap-10">
          {guideScenarios.map(sc => {
            const open = openId === sc.id;
            return (
              <div className={`accordion${open ? ' open' : ''}`} key={sc.id}>
                <button
                  className="accordion-head"
                  onClick={() => setOpenId(open ? '' : sc.id)}
                  aria-expanded={open}
                >
                  <span>
                    <span className="accordion-title">{sc.title}</span>
                    <span className="accordion-sub">{sc.summary}</span>
                  </span>
                  <span className="row gap-8 wrap" style={{ flexShrink: 0 }}>
                    <span className="tag">所要 約{sc.minutes}分</span>
                    <span className="accordion-arrow" aria-hidden="true">
                      {open ? '−' : '+'}
                    </span>
                  </span>
                </button>
                {open && (
                  <div className="accordion-body">
                    <div className="section-title">
                      <span className="bar" />
                      操作手順
                    </div>
                    <ol className="guide-steps">
                      {sc.steps.map((st, i) => (
                        <li key={`${sc.id}-${i}`}>
                          <span className="guide-no">{i + 1}</span>
                          <span className="guide-text">{st.text}</span>
                          {st.path && (
                            <button className="btn btn-ghost btn-sm" onClick={() => navigate(st.path as string)}>
                              {st.label ?? 'この画面を開く'}
                            </button>
                          )}
                        </li>
                      ))}
                    </ol>
                    <div className="divider" />
                    <div className="section-title">
                      <span className="bar" />
                      商談で伝えたいポイント
                    </div>
                    <ul className="point-list">
                      {sc.points.map(p => (
                        <li key={p}>{p}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="divider" />
        <div className="section-title">
          <span className="bar" />
          フェーズ2で追加した機能（フェーズ1版との差分）
        </div>
        <p className="fs-13 text-sub mb-12">
          フェーズ1の範囲に、次の機能を追加しています。
        </p>
        <div className="table-wrap">
          <table className="data compact">
            <thead>
              <tr>
                <th>機能</th>
                <th>内容</th>
              </tr>
            </thead>
            <tbody>
              {PHASE2_FEATURES.map(f => (
                <tr key={f.name}>
                  <td className="fs-13 fw-600">{f.name}</td>
                  <td className="fs-13 text-sub">{f.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="divider" />
        <div className="section-title">
          <span className="bar" />
          このデモに含めていない機能
        </div>
        <p className="fs-13 text-sub mb-12">
          フェーズ3で追加する想定の機能です。今回のデモ画面には含めていません。
        </p>
        <div className="table-wrap">
          <table className="data compact">
            <thead>
              <tr>
                <th>フェーズ</th>
                <th>機能</th>
                <th>内容</th>
              </tr>
            </thead>
            <tbody>
              {OUT_OF_SCOPE.map(o => (
                <tr key={o.name}>
                  <td className="fs-13" style={{ whiteSpace: 'nowrap' }}>{o.phase}</td>
                  <td className="fs-13 fw-600">{o.name}</td>
                  <td className="fs-13 text-sub">{o.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="two-col">
        <section className="card card-pad">
          <div className="section-title">
            <span className="bar" />
            デモに登場する担当者（すべて架空）
          </div>
          <p className="fs-13 text-sub mb-12">
            画面右上の「利用者」で切り替えると、その担当者としてログインした状態になります。権限によって使えるメニューと承認できる申請が変わります。ログイン画面のパスワードはすべて共通のデモ用です。
          </p>
          <div className="table-wrap">
            <table className="data compact">
              <thead>
                <tr>
                  <th>担当者</th>
                  <th>所属・役職</th>
                  <th>権限</th>
                  <th>デモでの役割</th>
                </tr>
              </thead>
              <tbody>
                {members.map(m => (
                  <tr key={m.id}>
                    <td className="fw-600" style={{ whiteSpace: 'nowrap' }}>
                      {m.name}
                    </td>
                    <td className="fs-13">
                      {m.department} {m.title}
                    </td>
                    <td className="fs-13">
                      {roleMeta[m.role].label}
                      {!m.active && <div className="fs-12 text-sub">無効アカウント</div>}
                    </td>
                    <td className="fs-13">
                      {m.holdsSeal && '実印の保有者・電子契約の締結者。'}
                      {!m.holdsSeal &&
                        (m.role === 'admin'
                          ? '利用者・権限と承認ルートを管理します。'
                          : m.role === 'viewer'
                            ? '閲覧のみ。無効アカウントの例として使います。'
                            : m.title === '部長'
                              ? '部門長として最初に承認します。'
                              : '申請の起案を行います。')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card card-pad">
          <div className="section-title">
            <span className="bar" />
            よくある質問
          </div>
          <div className="stack gap-12">
            {guideFaq.map(f => (
              <div key={f.q}>
                <div className="fs-13 fw-600">{f.q}</div>
                <div className="fs-13 text-sub">{f.a}</div>
              </div>
            ))}
          </div>
          <div className="divider" />
          <div className="banner info" style={{ marginBottom: 0 }}>
            <span aria-hidden="true">i</span>
            <div>
              画面を再読み込みすると、操作した内容はすべて初期状態に戻ります。商談で何度でも同じ流れを実演できます。
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
