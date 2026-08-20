import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { TourCourse } from '../components/Tour';
import { glossary, guideFaq, guideScenarios, shortTourSteps, tourSteps, troubles } from '../data/guide';
import { members } from '../data/sampleData';
import { EmptyState } from '../components/EmptyState';

interface GuideProps {
  onStartTour: (course: TourCourse) => void;
  helpVisible: boolean;
  onToggleHelp: () => void;
}

const SCREENS: { path: string; name: string; can: string }[] = [
  { path: '/', name: 'ダッシュボード', can: '今日やること（承認待ち・止まっている書類・署名待ち・期限が近い契約）をまとめて見る' },
  { path: '/requests', name: '申請一覧', can: '社内から出された稟議書・捺印申請を探す、絞り込む' },
  { path: '/requests/new', name: '新規申請', can: '新しい申請をつくる。入力に応じて承認ルートがその場で変わる' },
  { path: '/esign', name: '電子契約', can: '契約書を相手先へ送り、サインの状況を確認する。催促・取消もできる' },
  { path: '/contracts', name: '契約書管理', can: '結んだ契約書を探す、期限が近いものを確認する、更新の申請をつくる' },
  { path: '/import', name: '契約書取込', can: '紙で届いた契約書をAIに読み取らせて登録する' },
  { path: '/integrations', name: '外部連携', can: '会計システムへの連携状況・履歴を確認する。失敗したものをやり直す' },
  { path: '/settings', name: '承認ルート設定', can: '承認する人の条件と、不在のときの代理承認者を設定する' },
];

export function Guide({ onStartTour, helpVisible, onToggleHelp }: GuideProps) {
  const navigate = useNavigate();
  const [openId, setOpenId] = useState<string>(guideScenarios[0].id);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [termKeyword, setTermKeyword] = useState('');
  const [openTrouble, setOpenTrouble] = useState<string>('');

  const terms = useMemo(() => {
    const kw = termKeyword.trim();
    if (kw === '') return glossary;
    return glossary.filter(g => `${g.word}${g.read ?? ''}${g.mean}`.includes(kw));
  }, [termKeyword]);

  const toggleStep = (key: string) => setChecked(prev => ({ ...prev, [key]: !prev[key] }));

  const doneCount = (scenarioId: string, total: number) => {
    let n = 0;
    for (let i = 0; i < total; i += 1) if (checked[`${scenarioId}-${i}`]) n += 1;
    return n;
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">操作ガイド</h1>
          <p className="page-sub">
            はじめての方でも迷わないように、画面の見方・操作の手順・むずかしい言葉の意味・困ったときの対処をまとめています。
          </p>
        </div>
      </div>

      <section className="card card-pad mb-16">
        <div className="section-title">
          <span className="bar" />
          まず、どれかを選んでください
        </div>
        <div className="guide-choice">
          <div className="guide-choice-item">
            <div className="guide-choice-no">1</div>
            <div className="guide-choice-main">
              <div className="guide-choice-title">画面を見ながら案内してほしい（おすすめ）</div>
              <div className="guide-choice-desc">
                各画面へ自動で移動しながら、見る場所・押す場所を1つずつ案内します。途中でやめても、続きから始められます。
              </div>
              <div className="row gap-10 wrap mt-8">
                <button className="btn btn-primary" onClick={() => onStartTour('full')}>
                  詳しい案内を始める（全{tourSteps.length}ステップ・約8分）
                </button>
                <button className="btn btn-secondary" onClick={() => onStartTour('short')}>
                  要点だけ見る（全{shortTourSteps.length}ステップ・約5分）
                </button>
              </div>
            </div>
          </div>

          <div className="guide-choice-item">
            <div className="guide-choice-no">2</div>
            <div className="guide-choice-main">
              <div className="guide-choice-title">手順を読みながら自分で操作したい</div>
              <div className="guide-choice-desc">
                下の「シナリオ別の操作手順」に、押すボタンの名前・場所・押したあとどうなるかを1手順ずつ書いています。
                チェックを付けながら進められます。
              </div>
            </div>
          </div>

          <div className="guide-choice-item">
            <div className="guide-choice-no">3</div>
            <div className="guide-choice-main">
              <div className="guide-choice-title">画面ごとの説明を出したままにしたい</div>
              <div className="guide-choice-desc">
                各画面の上に「この画面でできること」を表示できます。慣れてきたら非表示にできます。
              </div>
              <div className="row gap-10 wrap mt-8">
                <button className="btn btn-secondary" onClick={onToggleHelp}>
                  かんたん説明を{helpVisible ? '非表示にする' : '表示する'}
                </button>
                <span className="fs-12 text-sub">
                  現在: {helpVisible ? '表示中（各画面の上に説明が出ます）' : '非表示'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="card card-pad mb-16">
        <div className="section-title">
          <span className="bar" />
          このデモでできること
        </div>
        <p className="fs-13 mb-12">
          紙とハンコで行っている月間100〜150件の承認業務を電子化し、
          <strong>申請 → 承認（不在時は代理承認）→ 電子契約での締結 → 契約書の保管 → 会計システム連携</strong>
          までを1つのシステムで完結させる想定の業務システムです。
          電子契約は本システム内で完結し、外部システムとつながるのは会計システムだけです。
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
          見出しを押すと手順が開きます。1手順ずつ「どこを見る／押す」「押すとどうなる」を書いています。
          終わった手順の□を押すとチェックが付き、どこまで進んだかがわかります。
        </p>
        <div className="stack gap-10">
          {guideScenarios.map(sc => {
            const open = openId === sc.id;
            const done = doneCount(sc.id, sc.steps.length);
            return (
              <div className={`accordion${open ? ' open' : ''}`} key={sc.id}>
                <button className="accordion-head" onClick={() => setOpenId(open ? '' : sc.id)} aria-expanded={open}>
                  <span>
                    <span className="accordion-title">{sc.title}</span>
                    <span className="accordion-sub">{sc.summary}</span>
                  </span>
                  <span className="row gap-8 wrap" style={{ flexShrink: 0 }}>
                    <span className="tag">所要 約{sc.minutes}分</span>
                    <span className="tag">
                      {done} / {sc.steps.length} 完了
                    </span>
                    <span className="accordion-arrow" aria-hidden="true">
                      {open ? '−' : '+'}
                    </span>
                  </span>
                </button>
                {open && (
                  <div className="accordion-body">
                    <div className="row gap-12 wrap mb-12">
                      <div className="progress" style={{ flex: '1 1 200px' }}>
                        <span style={{ width: `${(done / sc.steps.length) * 100}%` }} />
                      </div>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() =>
                          setChecked(prev => {
                            const next = { ...prev };
                            sc.steps.forEach((_, i) => delete next[`${sc.id}-${i}`]);
                            return next;
                          })
                        }
                        disabled={done === 0}
                      >
                        チェックをすべて外す
                      </button>
                    </div>

                    <ol className="guide-steps">
                      {sc.steps.map((st, i) => {
                        const key = `${sc.id}-${i}`;
                        const isDone = checked[key] === true;
                        return (
                          <li key={key} className={isDone ? 'done' : ''}>
                            <button
                              className={`guide-check${isDone ? ' on' : ''}`}
                              onClick={() => toggleStep(key)}
                              aria-pressed={isDone}
                              aria-label={`手順${i + 1}を完了にする`}
                            >
                              {isDone ? '✓' : i + 1}
                            </button>
                            <div className="guide-main">
                              <div className="guide-text">{st.text}</div>
                              {st.where && (
                                <div className="guide-meta">
                                  <span className="guide-tag">場所</span>
                                  {st.where}
                                </div>
                              )}
                              {st.expect && (
                                <div className="guide-meta">
                                  <span className="guide-tag ok">こうなれば成功</span>
                                  {st.expect}
                                </div>
                              )}
                              {st.path && (
                                <button className="btn btn-ghost btn-sm mt-8" onClick={() => navigate(st.path as string)}>
                                  {st.label ?? 'この画面を開く'}
                                </button>
                              )}
                            </div>
                          </li>
                        );
                      })}
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

      <section className="card card-pad mb-16">
        <div className="section-title">
          <span className="bar" />
          用語のかんたん説明
        </div>
        <p className="fs-13 text-sub mb-12">
          画面に出てくる言葉の意味です。調べたい言葉を入れると、その場で絞り込まれます。
        </p>
        <div className="filter-bar">
          <div className="search">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
            </svg>
            <label className="field-label" htmlFor="term-search" style={{ position: 'absolute', left: '-9999px' }}>
              用語の検索
            </label>
            <input
              id="term-search"
              className="input"
              value={termKeyword}
              onChange={e => setTermKeyword(e.target.value)}
              placeholder="調べたい言葉を入力（例: 締結、代理承認、ハッシュ値）"
            />
          </div>
          <span className="fs-13 text-sub">{terms.length} 件を表示</span>
        </div>
        {terms.length === 0 ? (
          <EmptyState title="該当する用語はありません" desc="別の言葉で探すか、検索欄を空にしてください。" />
        ) : (
          <dl className="glossary">
            {terms.map(g => (
              <div className="glossary-item" key={g.word}>
                <dt>
                  {g.word}
                  {g.read && <span className="glossary-read">（{g.read}）</span>}
                </dt>
                <dd>{g.mean}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>

      <div className="two-col">
        <section className="card card-pad">
          <div className="section-title">
            <span className="bar" />
            困ったときは
          </div>
          <div className="stack gap-8">
            {troubles.map(t => {
              const open = openTrouble === t.q;
              return (
                <div className={`accordion${open ? ' open' : ''}`} key={t.q}>
                  <button
                    className="accordion-head"
                    onClick={() => setOpenTrouble(open ? '' : t.q)}
                    aria-expanded={open}
                  >
                    <span>
                      <span className="accordion-title">{t.q}</span>
                    </span>
                    <span className="accordion-arrow" aria-hidden="true">
                      {open ? '−' : '+'}
                    </span>
                  </button>
                  {open && (
                    <div className="accordion-body">
                      <p className="fs-13" style={{ lineHeight: 1.9 }}>
                        {t.a}
                      </p>
                      {t.path && (
                        <button className="btn btn-secondary btn-sm mt-8" onClick={() => navigate(t.path as string)}>
                          {t.label ?? 'この画面を開く'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <div className="stack gap-12">
          <section className="card card-pad">
            <div className="section-title">
              <span className="bar" />
              デモに登場する担当者（すべて架空）
            </div>
            <p className="fs-13 text-sub mb-12">
              画面右上の「利用者」で切り替えると、その担当者としてログインした状態になります。承認できる書類が変わります。
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
                        {!m.holdsSeal &&
                          !m.absent &&
                          (m.title === '部長' ? '部門長として最初に承認します。' : '申請の起案・代理承認を行います。')}
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
                画面を再読み込みすると、操作した内容はすべて最初の状態に戻ります。商談で何度でも同じ流れを実演できます。
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
