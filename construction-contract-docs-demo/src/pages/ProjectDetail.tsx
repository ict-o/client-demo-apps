import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { ProjectActions } from '../App';
import type { ComplianceItem, ContractTerms, DocKind, Partner, Project, QuoteReadResult } from '../types';
import { DOC_KINDS, DOC_KIND_LABELS, DOC_KIND_PLAIN } from '../types';
import { DocStatusBadge, StatusBadge } from '../components/StatusBadge';
import { DocumentPreview } from '../components/DocumentPreview';
import { EmptyState } from '../components/EmptyState';
import { FlowSteps } from '../components/FlowSteps';
import { Modal } from '../components/Modal';
import { TERMS_TEMPLATE } from '../data/sampleData';
import { calcTotals, lineAmount } from '../utils/calc';
import {
  buildComplianceItems,
  complianceSummary,
  docFlowNote,
  isDocSetComplete,
  isGenerated,
  needsRegenerate,
  partiesOf,
} from '../utils/docs';
import { formatDate, formatDateTime, formatNumber, formatYen } from '../utils/format';

interface Props {
  projects: Project[];
  partners: Partner[];
  actions: ProjectActions;
}

type Tab = 'docs' | 'quote' | 'history';

const TABS: { key: Tab; label: string }[] = [
  { key: 'docs', label: '書類' },
  { key: 'quote', label: '見積書の内容' },
  { key: 'history', label: 'これまでの記録' },
];

export function ProjectDetail({ projects, partners, actions }: Props) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('docs');
  const [preview, setPreview] = useState<DocKind | null>(null);
  const [bundleOpen, setBundleOpen] = useState(false);
  const [replaceOpen, setReplaceOpen] = useState(false);

  const project = projects.find(p => p.id === id);
  const partner = partners.find(p => p.id === project?.partnerId);

  if (!project || !partner) {
    return (
      <div className="card">
        <EmptyState
          title="工事案件が見つかりません"
          desc="一覧から案件を選び直してください。"
          action={<button className="btn btn-primary" onClick={() => navigate('/')}>工事案件の一覧へ戻る</button>}
        />
      </div>
    );
  }

  const totals = calcTotals(project.items, project.discount);
  const compliance = buildComplianceItems(project, partner);
  const summary = complianceSummary(compliance);
  const generated = isGenerated(project);

  /** 「見積書の内容」タブを開き、工事の条件の入力欄まで移動する */
  const openTerms = () => {
    setTab('quote');
    window.setTimeout(() => document.getElementById('terms-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  };
  const regenerate = needsRegenerate(project);

  return (
    <>
      <button className="btn btn-ghost mb-12" onClick={() => navigate('/')}>
        ← 工事案件の一覧へ戻る
      </button>

      <div className="page-head">
        <div>
          <div className="row gap-8 wrap mb-8">
            <span className="fs-14 fw-700 text-sub tnum">{project.no}</span>
            <StatusBadge status={project.status} />
          </div>
          <h1 className="page-title">{project.title}</h1>
          <p className="page-sub">
            {partner.name}／{project.site}／担当 {project.staff}
          </p>
        </div>
        <div className="total-box">
          <div className="total-line"><span>工事代金</span><span className="num">{formatYen(totals.taxable)}</span></div>
          <div className="total-line"><span>消費税（10%）</span><span className="num">{formatYen(totals.tax)}</span></div>
          <div className="total-line grand"><span>請負代金（税込）</span><span className="num">{formatYen(totals.total)}</span></div>
        </div>
      </div>

      <FlowSteps status={project.status} generated={generated} />

      <NextAction
        project={project}
        actions={actions}
        onEditTerms={openTerms}
        onOpenBundle={() => setBundleOpen(true)}
        generated={generated}
        regenerate={regenerate}
      />

      <CheckPanel items={compliance} summary={summary} onGoQuote={openTerms} />

      <div className="tabs" role="tablist" aria-label="案件の詳細">
        {TABS.map(t => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            className={tab === t.key ? 'tab active' : 'tab'}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'docs' && (
        <DocsTab
          project={project}
          partner={partner}
          onPreview={setPreview}
          onOpenBundle={() => setBundleOpen(true)}
        />
      )}

      {tab === 'quote' && (
        <QuoteTab
          key={project.revision}
          project={project}
          partner={partner}
          actions={actions}
          onReplace={() => setReplaceOpen(true)}
        />
      )}

      {tab === 'history' && (
        <div className="card card-pad">
          <h2 className="section-title"><span className="bar" />これまでの記録</h2>
          <div className="timeline">
            {[...project.history].reverse().map(h => (
              <div className="tl-item" key={h.id}>
                <span className="tl-dot" />
                <div className="tl-time">{formatDateTime(h.at)}</div>
                <div className="tl-text"><span className="tl-actor">{h.actorName}</span>：{h.action}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal
        isOpen={preview !== null}
        onClose={() => setPreview(null)}
        title={preview ? `${DOC_KIND_LABELS[preview]}の内容` : ''}
        width={900}
        bodyClassName="print-area"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => window.print()}>この書類を印刷する</button>
            <button className="btn btn-primary" onClick={() => setPreview(null)}>閉じる</button>
          </>
        }
      >
        {preview && <DocumentPreview project={project} partner={partner} kind={preview} />}
      </Modal>

      <BundleModal
        isOpen={bundleOpen}
        onClose={() => setBundleOpen(false)}
        project={project}
        partner={partner}
        onExport={() => {
          actions.exportBundle(project.id, project.no);
          setBundleOpen(false);
        }}
      />

      <ReplaceQuoteModal
        isOpen={replaceOpen}
        onClose={() => setReplaceOpen(false)}
        project={project}
        onReplace={(fileName, read) => {
          actions.replaceQuote(project.id, fileName, read);
          setReplaceOpen(false);
        }}
      />
    </>
  );
}

/* ===== 次にやること ===== */

function NextAction({
  project,
  actions,
  onOpenBundle,
  onEditTerms,
  generated,
  regenerate,
}: {
  project: Project;
  actions: ProjectActions;
  onOpenBundle: () => void;
  onEditTerms: () => void;
  generated: boolean;
  regenerate: boolean;
}) {
  let title: string;
  let desc: string;
  let button: { label: string; onClick: () => void };
  let subButton: { label: string; onClick: () => void } | null = null;
  const bundleButton = { label: '1つのファイルにまとめる', onClick: onOpenBundle };

  if (!generated) {
    title = '注文書・注文請書・基本契約書（約款）を作ります';
    desc = '取り込んだ見積書の内容（取引先・工事名・金額・工期・支払い方法）が、そのまま3つの書類に入ります。入力は必要ありません。';
    button = { label: '3つの書類を作る', onClick: () => actions.generateDocs(project.id) };
  } else if (project.status === 'imported') {
    title = 'お客様から押印済みの注文書と基本契約書（約款）を受け取ってください';
    desc = 'ここで作った注文書と基本契約書（約款）に、お客様の記名押印をいただいてください。お客様が注文書を出さない場合も、この注文書に押印をいただくだけで大丈夫です。受け取ったらボタンを押すと、約款は締結済みになります。';
    button = { label: '注文書・約款を受け取った', onClick: () => actions.receiveSealedDocs(project.id) };
  } else if (project.status === 'ordered') {
    title = '注文請書をお客様へ送ってください';
    desc = 'ここで作った注文請書をそのまま送れます。送ると契約成立になります。';
    button = { label: '注文請書を送った', onClick: () => actions.confirmAcceptance(project.id) };
  } else if (project.status === 'accepted') {
    title = '書類はそろいました。工事が終わったら完了を登録してください';
    desc = '書類4点は「1つのファイルにまとめる」ボタンから、いつでも1つのファイルに出力できます。';
    button = { label: '工事が完了した', onClick: () => actions.completeProject(project.id) };
    subButton = bundleButton;
  } else {
    title = '工事完了まで登録が済んでいます';
    desc = project.bundleFileName
      ? `書類4点は「${project.bundleFileName}」として出力済みです。内容を変えた場合は、もう一度まとめてください。`
      : '書類4点を1つのファイルにまとめて保管してください。';
    button = bundleButton;
  }

  // 工期は任意。決まっていないうちは、いつでも入力できることを案内する
  const noPeriod = !project.terms.startDate || !project.terms.endDate;
  const showPeriodNote = noPeriod && project.status !== 'completed';
  if (showPeriodNote && !subButton) {
    subButton = { label: '工期を入力する', onClick: onEditTerms };
  }

  return (
    <div className="next-card" data-tour="next-action" data-stage={`${project.status}${generated ? '-gen' : ''}`}>
      {regenerate && (
        <div className="alert alert-warning mb-16">
          <span aria-hidden="true">!</span>
          <div>
            <div className="fw-700">見積書の内容が変わっています</div>
            <p className="fs-14 mt-4">
              作成済みの注文書・注文請書・約款が、古い金額・内容のままです。作り直して最新の内容に合わせてください。
            </p>
            <button className="btn btn-warning mt-12" onClick={() => actions.generateDocs(project.id)}>
              3つの書類を作り直す
            </button>
          </div>
        </div>
      )}

      <div className="row between wrap gap-16">
        <div style={{ minWidth: '280px', flex: 1 }}>
          <div className="next-label">次にやること</div>
          <div className="next-title">{title}</div>
          <p className="next-desc">{desc}</p>
          {showPeriodNote && (
            <p className="next-note">
              工期はまだ入っていません。決まったら「工期を入力する」から、いつでも入力できます（注文書を受け取ってからでも大丈夫です）。
            </p>
          )}
        </div>
        <div className="row gap-10 wrap">
          {subButton && (
            <button className="btn btn-secondary btn-lg" onClick={subButton.onClick}>
              {subButton.label}
            </button>
          )}
          <button className="btn btn-primary btn-lg" onClick={button.onClick} data-tour="next-button">
            {button.label}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ===== 書類に必要な項目のチェック ===== */

function CheckPanel({
  items,
  summary,
  onGoQuote,
}: {
  items: ComplianceItem[];
  summary: ReturnType<typeof complianceSummary>;
  onGoQuote: () => void;
}) {
  const [open, setOpen] = useState(false);
  const allOk = summary.ok === summary.total;
  const missing = items.filter(i => !i.ok);

  return (
    <div className={allOk ? 'check-panel ok' : 'check-panel ng'} data-tour="check-panel">
      <div className="row between wrap gap-12">
        <div className="row gap-12">
          <span className="check-mark" aria-hidden="true">{allOk ? '✓' : '!'}</span>
          <div>
            <div className="check-title">
              {allOk
                ? `書類に必要な項目は ${summary.total} 件すべてそろっています`
                : `書類に必要な項目が ${missing.length} 件足りません`}
            </div>
            <div className="fs-14 text-sub">
              {allOk
                ? '注文書・注文請書・約款に書く内容がそろっています。'
                : '足りない項目を入れると、書類がそろいます。'}
            </div>
          </div>
        </div>
        <div className="row gap-10 wrap">
          {!allOk && (
            <button className="btn btn-warning" onClick={onGoQuote}>
              足りない項目を入力する
            </button>
          )}
          <button className="btn btn-secondary" onClick={() => setOpen(!open)} aria-expanded={open}>
            {open ? '項目をとじる' : `${summary.total} 件の項目を見る`}
          </button>
        </div>
      </div>

      {!allOk && !open && (
        <ul className="check-missing">
          {missing.map(m => (
            <li key={m.label}>{m.label}</li>
          ))}
        </ul>
      )}

      {open && (
        <div className="mt-16">
          {items.map(item => (
            <div className="check-row" key={item.label}>
              <span className={item.ok ? 'check-row-mark ok' : 'check-row-mark ng'} aria-hidden="true">
                {item.ok ? '✓' : '!'}
              </span>
              <div className="grow">
                <div className="fs-15 fw-700">{item.label}</div>
                <div className="fs-14 text-sub">{item.ok ? item.value : item.hint}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ===== 書類タブ ===== */

function DocsTab({
  project,
  partner,
  onPreview,
  onOpenBundle,
}: {
  project: Project;
  partner: Partner;
  onPreview: (kind: DocKind) => void;
  onOpenBundle: () => void;
}) {
  const complete = isDocSetComplete(project);
  const missingNames = project.documents.filter(d => d.status === 'none').map(d => DOC_KIND_LABELS[d.kind]);

  return (
    <>
      <div className="card card-pad mb-16">
        <div className="row between wrap gap-16">
          <div>
            <h2 className="section-title"><span className="bar" />書類4点を1つのファイルにまとめる</h2>
            <p className="fs-14 text-sub">
              見積書・注文書・注文請書・基本契約書（約款）を1つのファイルにまとめて、案件番号で保管できます。
            </p>
            {project.bundleFileName && (
              <p className="fs-14 mt-8 text-success fw-600">出力済み：{project.bundleFileName}</p>
            )}
          </div>
          {complete ? (
            <button className="btn btn-primary" onClick={onOpenBundle}>
              1つのファイルにまとめる
            </button>
          ) : (
            <button className="btn btn-primary" disabled title="注文書・注文請書・約款を作ると使えます">
              1つのファイルにまとめる
            </button>
          )}
        </div>
        {!complete && (
          <p className="fs-14 text-sub mt-8">
            ※ 4点すべてがそろうと使えます（まだ作っていない書類：{missingNames.join('・')}）
          </p>
        )}
      </div>

      <div className="doc-grid" data-tour="doc-cards">
        {DOC_KINDS.map(kind => {
          const doc = project.documents.find(d => d.kind === kind)!;
          const missing = doc.status === 'none';

          return (
            <div key={kind} className={`doc-card ${missing ? 'missing' : doc.status === 'sealed' ? 'ready' : ''}`}>
              <div className="row between gap-8 wrap">
                <span className="doc-name">{DOC_KIND_LABELS[kind]}</span>
                <DocStatusBadge kind={kind} status={doc.status} />
              </div>
              <div className="doc-plain">{DOC_KIND_PLAIN[kind]}</div>
              <div className="doc-no tnum">{doc.no || '書類番号は作成時に付きます'}</div>
              <p className="fs-14 text-sub grow">{docFlowNote(kind, partner)}</p>
              <div className="fs-13 text-muted">
                {doc.issuedOn ? `${kind === 'quote' ? '取込日' : '作成日'}：${formatDate(doc.issuedOn)}` : 'まだ作っていません'}
                {doc.autoGenerated && !missing ? '／見積書から自動作成' : ''}
              </div>
              {missing ? (
                <p className="fs-14 text-sub doc-hint">上の「次にやること」から作成できます。</p>
              ) : (
                <button className="btn btn-secondary btn-block" onClick={() => onPreview(kind)}>
                  書類の中身を見る
                </button>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

/* ===== 見積書の内容タブ ===== */

function QuoteTab({
  project,
  partner,
  actions,
  onReplace,
}: {
  project: Project;
  partner: Partner;
  actions: ProjectActions;
  onReplace: () => void;
}) {
  const totals = calcTotals(project.items, project.discount);
  const [draft, setDraft] = useState<ContractTerms>(project.terms);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const locked = project.status === 'completed';

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(project.terms), [draft, project.terms]);
  const set = (patch: Partial<ContractTerms>) => setDraft(prev => ({ ...prev, ...patch }));
  const template = TERMS_TEMPLATE;

  const save = () => {
    const e: Record<string, string> = {};
    // 工期は任意。両方入っているときだけ前後関係を確かめる
    if (draft.startDate && draft.endDate && draft.endDate < draft.startDate) {
      e.endDate = '終わる日は始める日より後にしてください';
    }
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    actions.updateTerms(project.id, {
      ...draft,
      nonWorkingDays: draft.nonWorkingDays.trim(),
      paymentMethod: draft.paymentMethod.trim(),
    });
  };

  return (
    <>
      <div className="card card-pad mb-16">
        <div className="row between wrap gap-16 mb-16">
          <div>
            <h2 className="section-title"><span className="bar" />取り込んだ見積書</h2>
            <div className="row gap-10 wrap">
              <span className="file-icon" aria-hidden="true">XLS</span>
              <span>
                <span className="fs-15 fw-700 block">{project.sourceFile.name}</span>
                <span className="fs-13 text-sub">
                  取込日時 {formatDateTime(project.sourceFile.importedAt)}／見積書番号 {project.documents[0].no}
                </span>
              </span>
            </div>
          </div>
          {!locked && (
            <button className="btn btn-secondary" onClick={onReplace}>
              見積書を差し替える
            </button>
          )}
        </div>

        <p className="fs-14 text-sub mb-12">
          明細は見積書から読み取った内容です。金額や工事内容を変えるときは、Excel の見積書を直して差し替えてください。
        </p>

        <div className="table-wrap mb-16">
          <table className="data">
            <thead>
              <tr>
                <th>工種・品名</th>
                <th>仕様・規格</th>
                <th className="num">数量</th>
                <th>単位</th>
                <th className="num">単価</th>
                <th className="num">金額</th>
              </tr>
            </thead>
            <tbody>
              {project.items.map(item => (
                <tr key={item.id}>
                  <td className="fw-600">{item.name}</td>
                  <td className="fs-13 text-sub">{item.spec}</td>
                  <td className="num">{formatNumber(item.quantity)}</td>
                  <td>{item.unit}</td>
                  <td className="num">{formatYen(item.unitPrice)}</td>
                  <td className="num fw-600">{formatYen(lineAmount(item))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="row end">
          <div className="total-box">
            <div className="total-line"><span>小計</span><span className="num">{formatYen(totals.subtotal)}</span></div>
            {totals.discount > 0 && (
              <div className="total-line"><span>値引き</span><span className="num">-{formatYen(totals.discount)}</span></div>
            )}
            <div className="total-line"><span>消費税（10%）</span><span className="num">{formatYen(totals.tax)}</span></div>
            <div className="total-line grand"><span>請負代金（税込）</span><span className="num">{formatYen(totals.total)}</span></div>
          </div>
        </div>
      </div>

      <div className="card card-pad">
        <h2 className="section-title" id="terms-form"><span className="bar" />工事の条件（書類に印字されます）</h2>

        {locked ? (
          <div className="alert alert-info">
            <span aria-hidden="true">i</span>
            <div>工事完了として登録済みのため、内容の変更はできません。</div>
          </div>
        ) : (
          <p className="fs-14 text-sub mb-16">
            入力するのはこの4つだけです。保存すると、注文書・注文請書・約款の記載が新しくなります。工期は決まったときに、いつでも入力できます。
          </p>
        )}

        <div className="form-grid">
          <div className="field">
            <label className="field-label" htmlFor="q-start">工事を始める日<span className="opt">任意</span></label>
            <input
              id="q-start"
              type="date"
              className={errors.startDate ? 'input invalid' : 'input'}
              value={draft.startDate}
              disabled={locked}
              onChange={e => set({ startDate: e.target.value })}
            />
            {errors.startDate && <span className="field-error">{errors.startDate}</span>}
          </div>
          <div className="field">
            <label className="field-label" htmlFor="q-end">工事が終わる日<span className="opt">任意</span></label>
            <input
              id="q-end"
              type="date"
              className={errors.endDate ? 'input invalid' : 'input'}
              value={draft.endDate}
              disabled={locked}
              onChange={e => set({ endDate: e.target.value })}
            />
            {errors.endDate && <span className="field-error">{errors.endDate}</span>}
          </div>
        </div>

        <div className="field">
          <label className="field-label" htmlFor="q-nonwork">工事ができない日・時間帯</label>
          <input
            id="q-nonwork"
            className="input"
            value={draft.nonWorkingDays}
            disabled={locked}
            onChange={e => set({ nonWorkingDays: e.target.value })}
          />
        </div>

        <div className="field">
          <label className="field-label" htmlFor="q-pay">代金の支払い方法</label>
          <input
            id="q-pay"
            className="input"
            value={draft.paymentMethod}
            disabled={locked}
            onChange={e => set({ paymentMethod: e.target.value })}
          />
          {!locked && (
            <p className="field-hint">
              取引先に登録された支払条件：{partner.paymentTerms || '未登録'}
              {partner.paymentTerms && (
                <button
                  className="btn btn-secondary btn-sm ml-8"
                  onClick={() => set({ paymentMethod: `引渡し後、${partner.paymentTerms}` })}
                >
                  この内容を入れる
                </button>
              )}
            </p>
          )}
        </div>

        <div className="alert alert-info">
          <span aria-hidden="true">i</span>
          <div>
            <div className="fw-700">検査・引渡し・遅延利息などは入力不要です</div>
            <p className="fs-14 mt-4">
              「{template.name}」の定型条項（全 {template.clauses.length} 条）が自動で書類に入ります。
              内容は「書類」タブの基本契約書（約款）で確認できます。
            </p>
          </div>
        </div>

        {!locked && (
          <div className="row end gap-10 wrap mt-16">
            <button className="btn btn-secondary" onClick={() => { setDraft(project.terms); setErrors({}); }} disabled={!dirty}>
              変更をやめる
            </button>
            <button className="btn btn-primary" onClick={save} disabled={!dirty}>
              工事の条件を保存する
            </button>
          </div>
        )}
        {!locked && !dirty && (
          <p className="fs-14 text-sub mt-8" style={{ textAlign: 'right' }}>保存済みの内容が表示されています。</p>
        )}
      </div>
    </>
  );
}

/* ===== 書類一式の出力 ===== */

function BundleModal({
  isOpen,
  onClose,
  project,
  partner,
  onExport,
}: {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  partner: Partner;
  onExport: () => void;
}) {
  const parties = partiesOf(partner);
  const fileName = `${project.no}_工事関係書類一式.pdf`;
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="書類4点を1つのファイルにまとめます"
      width={640}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>やめる</button>
          <button className="btn btn-primary" onClick={onExport}>この内容で出力する</button>
        </>
      }
    >
      <p className="fs-15 mb-12">
        ファイル名：<span className="fw-700">{fileName}</span>
      </p>
      <ol className="bundle-list">
        <li>表紙（{project.no}／{project.title}）</li>
        {DOC_KINDS.map(kind => {
          const doc = project.documents.find(d => d.kind === kind)!;
          return <li key={kind}>{DOC_KIND_LABELS[kind]}（{doc.no}）</li>;
        })}
      </ol>
      <div className="alert alert-info mt-16">
        <span aria-hidden="true">i</span>
        <div>
          注文者：{parties.orderer.name}／受注者：{parties.contractor.name}
          <p className="mt-4">
            出力したファイルは案件番号で保管してください。
          </p>
        </div>
      </div>
    </Modal>
  );
}

/* ===== 見積書の差し替え ===== */

/**
 * 「Excel の見積書を直して保存し直した」状況を再現する。
 * 現在の明細に追加分を足した改訂版を作り、取り込み直すと金額と書類が連動して変わる。
 */
function revisedQuote(project: Project): { fileName: string; read: QuoteReadResult; addedName: string } {
  const rev = project.revision + 1;
  const base = project.sourceFile.name.replace(/(_改訂\d+)?\.xlsx$/, '');
  const addedName = '追加工事（現場調査による追加分）';
  const unitPrice = Math.max(50000, Math.round((calcTotals(project.items, project.discount).subtotal * 0.08) / 1000) * 1000);
  return {
    fileName: `${base}_改訂${rev}.xlsx`,
    addedName,
    read: {
      partnerId: project.partnerId,
      title: project.title,
      site: project.site,
      scope: project.scope,
      quotedOn: project.quotedOn,
      quoteExpiry: project.quoteExpiry,
      items: [
        ...project.items,
        {
          id: `add-${rev}`,
          name: addedName,
          spec: '現場調査で判明した不足分の施工・材料共',
          quantity: 1,
          unit: '式',
          unitPrice,
        },
      ],
      discount: project.discount,
      startDate: project.terms.startDate,
      endDate: project.terms.endDate,
      nonWorkingDays: project.terms.nonWorkingDays,
    },
  };
}

function ReplaceQuoteModal({
  isOpen,
  onClose,
  project,
  onReplace,
}: {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onReplace: (fileName: string, read: QuoteReadResult) => void;
}) {
  const revised = revisedQuote(project);
  const before = calcTotals(project.items, project.discount);
  const after = calcTotals(revised.read.items, revised.read.discount);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="見積書を差し替えます"
      width={640}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>やめる</button>
          <button className="btn btn-primary" onClick={() => onReplace(revised.fileName, revised.read)}>
            この見積書に差し替える
          </button>
        </>
      }
    >
      <p className="fs-15 mb-12">共有フォルダに保存されている、新しい見積書ファイルです。</p>

      <div className="row gap-12 replace-file">
        <span className="file-icon" aria-hidden="true">XLS</span>
        <span>
          <span className="fs-15 fw-700 block">{revised.fileName}</span>
          <span className="fs-13 text-sub">「{revised.addedName}」が1行増えています</span>
        </span>
      </div>

      <div className="compare mt-16">
        <div className="compare-col">
          <div className="compare-label">いまの請負代金</div>
          <div className="compare-value">{formatYen(before.total)}</div>
        </div>
        <span className="compare-arrow" aria-hidden="true">→</span>
        <div className="compare-col after">
          <div className="compare-label">差し替え後</div>
          <div className="compare-value">{formatYen(after.total)}</div>
        </div>
      </div>

      <div className="alert alert-warning mt-16">
        <span aria-hidden="true">!</span>
        <div>
          差し替えると金額と明細が変わります。作成済みの注文書・注文請書・約款は、作り直しが必要になります
          （画面上に案内が出ます）。
        </div>
      </div>
    </Modal>
  );
}
