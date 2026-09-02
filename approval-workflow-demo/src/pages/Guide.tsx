import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { guideFaq, guideScenarios } from '../data/guide';
import { members } from '../data/sampleData';

interface GuideProps {
  onStartTour: () => void;
}

const SCREENS: { path: string; name: string; can: string; estimate: string }[] = [
  {
    path: '/',
    name: '管理ダッシュボード',
    can: '承認待ち・滞留・契約期限・電子化率をまとめて確認する',
    estimate: '管理ダッシュボード・集計機能（フェーズ3）',
  },
  {
    path: '/requests',
    name: '社内ワークフロー（申請一覧・申請詳細）',
    can: '稟議書と捺印申請を確認し、多段階承認・代理承認・差戻しを行う',
    estimate: '社内ワークフロー機能（フェーズ1）',
  },
  {
    path: '/requests/new',
    name: '新規申請の作成',
    can: '申請内容を入力し、承認ルートの自動判定をその場で確認する',
    estimate: '社内ワークフロー機能（フェーズ1）',
  },
  {
    path: '/esign',
    name: '電子契約',
    can: '署名依頼の送信、署名状況の確認、リマインド、締結証明の発行を行う',
    estimate: '電子契約基本機能（フェーズ1）／電子契約拡張機能・監査ログ・証跡（フェーズ2）',
  },
  {
    path: '/contracts',
    name: '契約台帳',
    can: '締結した契約書を検索・並び替えし、期限と更新を管理する',
    estimate:
      '契約台帳・基本検索／紙・電子契約の一元管理（フェーズ1）、高度な全文検索（フェーズ2）、契約更新・期限管理・アラート強化（フェーズ3）',
  },
  {
    path: '/import',
    name: '紙契約書取込',
    can: '紙で届いた契約書をOCR・AIで項目抽出し、自動振り分けして登録する',
    estimate:
      '紙契約書のPDF登録・ドキュメント管理（フェーズ1）、OCR読み取り・AIによる主要項目の自動抽出・自動振り分け（フェーズ2）',
  },
  {
    path: '/integrations',
    name: '会計システム連携',
    can: '会計システムへの連携状況・履歴・連携項目を確認する',
    estimate: '会計システム連携（フェーズ1）／追加外部システム連携・運用改善（フェーズ3）',
  },
  {
    path: '/settings',
    name: '承認ルート設定',
    can: '承認ルートの条件、不在・代理承認者の設定、ルートのシミュレーション',
    estimate: '内容に応じた承認ルート設定＋多段階承認（フェーズ1）／ワークフロー追加・運用ルール拡張（フェーズ3）',
  },
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
          ガイド付きツアーを始める（約5分）
        </button>
      </div>

      <section className="card card-pad mb-16">
        <div className="section-title">
          <span className="bar" />
          このデモでできること
        </div>
        <p className="fs-13 mb-12">
          紙とハンコで行っている月間100〜150件の承認業務を電子化し、
          <strong>申請 → 多段階承認（不在時は代理承認）→ 電子契約での締結 → 契約台帳での一元管理 → 会計システム連携</strong>
          までを1つのシステムで完結させる想定の業務システムです。
          電子契約は本システム内で完結し、外部システムとの連携は会計システムのみです。
        </p>
        <p className="fs-13 text-sub mb-12">
          各画面が、お見積りのどの機能項目にあたるかを右の列に記載しています。
        </p>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>画面</th>
                <th>できること</th>
                <th>対応する見積項目</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {SCREENS.map(s => (
                <tr key={s.path}>
                  <td className="fw-600" style={{ minWidth: '9em' }}>
                    {s.name}
                  </td>
                  <td className="fs-13">{s.can}</td>
                  <td className="fs-13 text-sub">{s.estimate}</td>
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
      </section>

      <div className="two-col">
        <section className="card card-pad">
          <div className="section-title">
            <span className="bar" />
            デモに登場する担当者（すべて架空）
          </div>
          <p className="fs-13 text-sub mb-12">
            画面右上の「利用者」で切り替えると、その担当者としてログインした状態になります。承認できる申請が変わります。
          </p>
          <div className="table-wrap">
            <table className="data compact">
              <thead>
                <tr>
                  <th>担当者</th>
                  <th>所属・役職</th>
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
                      {m.holdsSeal && '実印の保有者・電子契約の締結者。'}
                      {m.absent && '不在中（承認は代理承認者へ引き継がれます）。'}
                      {!m.holdsSeal && !m.absent && (m.title === '部長' ? '部門長として最初に承認します。' : '申請の起案・代理承認を行います。')}
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
