import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { ProjectActions } from '../App';
import type { ContractTerms, DocKind, Partner, Project } from '../types';
import { DEAL_KIND_LABELS, DOC_KINDS, DOC_KIND_LABELS } from '../types';
import { DocStatusBadge, StatusBadge } from '../components/StatusBadge';
import { DocumentPreview } from '../components/DocumentPreview';
import { EmptyState } from '../components/EmptyState';
import { Modal } from '../components/Modal';
import { TERMS_TEMPLATES } from '../data/sampleData';
import { calcTotals, lineAmount } from '../utils/calc';
import {
  buildComplianceItems,
  complianceSummary,
  docFlowNote,
  isDocSetComplete,
  needsRegenerate,
  partiesOf,
} from '../utils/docs';
import { formatDate, formatDateTime, formatYen } from '../utils/format';

interface Props {
  projects: Project[];
  partners: Partner[];
  actions: ProjectActions;
  onToast: (message: string, type?: 'success' | 'info' | 'error') => void;
}

type Tab = 'docs' | 'items' | 'terms' | 'compliance' | 'history';

const TABS: { key: Tab; label: string }[] = [
  { key: 'docs', label: '書類セット' },
  { key: 'items', label: '見積明細' },
  { key: 'terms', label: '契約条件' },
  { key: 'compliance', label: '法令チェック' },
  { key: 'history', label: '履歴' },
];

export function ProjectDetail({ projects, partners, actions, onToast }: Props) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('docs');
  const [preview, setPreview] = useState<DocKind | null>(null);
  const [bundleOpen, setBundleOpen] = useState(false);

  const project = projects.find(p => p.id === id);
  const partner = partners.find(p => p.id === project?.partnerId);

  if (!project || !partner) {
    return (
      <div className="card">
        <EmptyState
          title="工事案件が見つかりません"
          desc="一覧から案件を選び直してください。"
          action={<button className="btn btn-primary btn-sm" onClick={() => navigate('/')}>工事案件一覧へ戻る</button>}
        />
      </div>
    );
  }

  const totals = calcTotals(project.items, project.discount);
  const compliance = buildComplianceItems(project, partner);
  const summary = complianceSummary(compliance);
  const generated = project.documents.filter(d => d.kind !== 'quote').every(d => d.status !== 'none');
  const regenerate = needsRegenerate(project);
  const parties = partiesOf(project, partner);

  return (
    <>
      <button className="btn btn-ghost btn-sm mb-12" onClick={() => navigate('/')}>
        ← 工事案件一覧へ戻る
      </button>

      <div className="page-head">
        <div>
          <div className="row gap-8 wrap mb-8">
            <span className="fs-13 fw-600 text-sub" style={{ fontVariantNumeric: 'tabular-nums' }}>{project.no}</span>
            <span className={project.dealKind === 'order' ? 'tag tag-order' : 'tag tag-receive'}>
              {DEAL_KIND_LABELS[project.dealKind]}
            </span>
            <StatusBadge status={project.status} dealKind={project.dealKind} />
          </div>
          <h1 className="page-title">{project.title}</h1>
          <div className="page-sub">
            {partner.name}／{project.site}／担当 {project.staff}
          </div>
        </div>
        <div className="total-box">
          <div className="total-line"><span>工事代金</span><span className="num">{formatYen(totals.taxable)}</span></div>
          <div className="total-line"><span>消費税（10%）</span><span className="num">{formatYen(totals.tax)}</span></div>
          <div className="total-line grand"><span>請負代金（税込）</span><span className="num">{formatYen(totals.total)}</span></div>
        </div>
      </div>

      <NextActionPanel
        project={project}
        partner={partner}
        actions={actions}
        generated={generated}
        regenerate={regenerate}
        onOpenTab={setTab}
      />

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
            {t.key === 'compliance' && summary.ok < summary.total && (
              <span className="tag" style={{ marginLeft: '6px', background: 'var(--error-light)', color: 'var(--error)' }}>
                {summary.total - summary.ok}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === 'docs' && (
        <DocsTab
          project={project}
          partner={partner}
          actions={actions}
          onPreview={setPreview}
          onOpenBundle={() => setBundleOpen(true)}
        />
      )}

      {tab === 'items' && <ItemsTab project={project} actions={actions} onToast={onToast} />}

      {/* 保存のたびに改訂番号が上がるため、key を変えて入力欄を保存済みの内容へ揃える */}
      {tab === 'terms' && <TermsTab key={project.revision} project={project} partner={partner} actions={actions} />}

      {tab === 'compliance' && (
        <ComplianceTab items={compliance} summary={summary} onGoTerms={() => setTab('terms')} />
      )}

      {tab === 'history' && (
        <div className="card card-pad">
          <div className="section-title"><span className="bar" />操作履歴</div>
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
        title={preview ? `${DOC_KIND_LABELS[preview]}のプレビュー` : ''}
        width={880}
        bodyClassName="print-area"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => window.print()}>この書類を印刷</button>
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
        parties={parties}
        onExport={() => {
          actions.exportBundle(project.id, project.no);
          setBundleOpen(false);
        }}
      />
    </>
  );
}

/* ===== 次のアクション ===== */

function NextActionPanel({
  project,
  partner,
  actions,
  generated,
  regenerate,
  onOpenTab,
}: {
  project: Project;
  partner: Partner;
  actions: ProjectActions;
  generated: boolean;
  regenerate: boolean;
  onOpenTab: (tab: Tab) => void;
}) {
  const isReceive = project.dealKind === 'receive';

  let title: string;
  let desc: string;
  let button: { label: string; onClick: () => void } | null = null;

  if (project.status === 'draft') {
    title = isReceive ? '見積書を発注者へ送付してください' : '協力会社から受領した見積書を確定してください';
    desc = isReceive
      ? `${partner.name} へ見積書を送付すると、注文書・注文請書・約款の自動生成に進めます。`
      : `${partner.name} から受領した見積内容を確定すると、注文書・注文請書・約款の自動生成に進めます。`;
    button = { label: isReceive ? '見積書を送付する' : '受領見積を確定する', onClick: () => actions.submitQuote(project.id, !isReceive) };
  } else if (!generated) {
    title = '注文書・注文請書・基本契約書（約款）を自動生成できます';
    desc = '見積書の内容（工事名・工事場所・請負代金・工期・契約条件）がそのまま3書類へ反映されます。';
    button = { label: '見積書から3書類を自動生成する', onClick: () => actions.generateDocs(project.id) };
  } else if (project.status === 'quoted') {
    title = isReceive ? '押印済みの注文書を受領してください' : '注文書を協力会社へ送付してください';
    desc = isReceive
      ? '発注者が注文書を発行しない場合は、自動生成した注文書に記名押印をいただくことで対応できます。'
      : `${partner.name} へ注文書を送付し、注文請書の返送を受けると契約成立です。`;
    button = isReceive
      ? { label: '押印済み注文書の受領を登録する', onClick: () => actions.receiveSealed(project.id, 'order') }
      : { label: '注文書を送付する', onClick: () => actions.sendDoc(project.id, 'order') };
  } else if (project.status === 'ordered') {
    title = isReceive ? '注文請書を送付して受注確定にしてください' : '押印済みの注文請書を受領してください';
    desc = isReceive
      ? '自動生成済みの注文請書をそのまま送付できます。送付と同時に約款も締結済みとして記録されます。'
      : `${partner.name} から返送された注文請書を登録すると、約款とあわせて契約成立として記録されます。`;
    button = isReceive
      ? { label: '注文請書を送付して受注確定にする', onClick: () => actions.confirmAcceptance(project.id) }
      : { label: '押印済み注文請書の受領を登録する', onClick: () => actions.receiveSealed(project.id, 'acceptance') };
  } else if (project.status === 'accepted') {
    title = '契約書類は揃っています。工事完了後に引渡しを登録してください';
    desc = '書類一式（見積書・注文書・注文請書・約款）は「書類セット」タブから1ファイルで出力できます。';
    button = { label: '工事完了・引渡しを登録する', onClick: () => actions.completeProject(project.id) };
  } else {
    title = '工事完了・引渡しまで登録済みです';
    desc = '書類一式は建設業法上の保存対象です。「書類セット」タブから1ファイルで出力・保管してください。';
  }

  return (
    <div className="card card-pad mb-16">
      {regenerate && (
        <div className="alert alert-warning mb-16">
          <span aria-hidden="true">!</span>
          <div>
            <div className="fw-600">見積内容が変更されています</div>
            <div className="fs-12 mt-4">
              自動生成済みの注文書・注文請書・約款が古い内容のままです。再生成して記載金額・条件を最新に合わせてください。
            </div>
            <button className="btn btn-warning btn-sm mt-8" onClick={() => actions.generateDocs(project.id)}>
              3書類を再生成する
            </button>
          </div>
        </div>
      )}

      <div className="row between wrap gap-16">
        <div style={{ minWidth: '260px', flex: 1 }}>
          <div className="section-title" style={{ marginBottom: '6px' }}><span className="bar" />次のアクション</div>
          <div className="fs-15 fw-600">{title}</div>
          <div className="fs-12 text-sub mt-4">{desc}</div>
        </div>
        <div className="row gap-10 wrap">
          {button && (
            <button className="btn btn-primary btn-lg" onClick={button.onClick}>
              {button.label}
            </button>
          )}
          <button className="btn btn-secondary" onClick={() => onOpenTab('compliance')}>
            法令チェックを確認
          </button>
        </div>
      </div>
    </div>
  );
}

/* ===== 書類セットタブ ===== */

function DocsTab({
  project,
  partner,
  actions,
  onPreview,
  onOpenBundle,
}: {
  project: Project;
  partner: Partner;
  actions: ProjectActions;
  onPreview: (kind: DocKind) => void;
  onOpenBundle: () => void;
}) {
  const complete = isDocSetComplete(project);

  return (
    <>
      <div className="card card-pad mb-16">
        <div className="row between wrap gap-16">
          <div>
            <div className="section-title" style={{ marginBottom: '6px' }}><span className="bar" />書類一式の管理</div>
            <div className="fs-13 text-sub">
              見積書・注文書・注文請書・基本契約書（約款）を1つのファイルにまとめて保管・提出できます。
            </div>
            {project.bundleFileName && (
              <div className="fs-12 mt-8" style={{ color: 'var(--success)' }}>
                出力済み：{project.bundleFileName}
              </div>
            )}
          </div>
          <div className="row gap-10 wrap">
            {complete ? (
              <button className="btn btn-primary" onClick={onOpenBundle}>
                書類一式（4点）を1ファイルで出力
              </button>
            ) : (
              <span title="注文書・注文請書・約款を自動生成すると出力できます">
                <button className="btn btn-primary" disabled>
                  書類一式（4点）を1ファイルで出力
                </button>
              </span>
            )}
          </div>
        </div>
        {!complete && (
          <div className="fs-12 text-sub mt-8">
            ※ 4点すべてが作成済みになると出力できます（未作成：
            {project.documents.filter(d => d.status === 'none').map(d => DOC_KIND_LABELS[d.kind]).join('・')}）
          </div>
        )}
      </div>

      <div className="doc-grid">
        {DOC_KINDS.map(kind => {
          const doc = project.documents.find(d => d.kind === kind)!;
          const missing = doc.status === 'none';
          const isReceive = project.dealKind === 'receive';

          // 書類ごとの追加操作（押しても何も起きないボタンは置かない）
          let extra: { label: string; onClick: () => void } | null = null;
          if (!missing) {
            if (kind === 'order' && doc.status === 'created') {
              extra = isReceive
                ? { label: '押印受領を登録', onClick: () => actions.receiveSealed(project.id, 'order') }
                : { label: '注文書を送付', onClick: () => actions.sendDoc(project.id, 'order') };
            } else if (kind === 'order' && doc.status === 'sent' && !isReceive) {
              extra = { label: '押印受領を登録', onClick: () => actions.receiveSealed(project.id, 'order') };
            } else if (kind === 'acceptance' && doc.status === 'created') {
              extra = isReceive
                ? { label: '注文請書を送付', onClick: () => actions.sendDoc(project.id, 'acceptance') }
                : { label: '押印受領を登録', onClick: () => actions.receiveSealed(project.id, 'acceptance') };
            } else if (kind === 'acceptance' && doc.status === 'sent' && !isReceive) {
              extra = { label: '押印受領を登録', onClick: () => actions.receiveSealed(project.id, 'acceptance') };
            } else if (kind === 'terms' && doc.status !== 'sealed') {
              extra = { label: '締結済みとして登録', onClick: () => actions.receiveSealed(project.id, 'terms') };
            } else if (kind === 'quote' && doc.status === 'created') {
              extra = {
                label: isReceive ? '見積書を送付' : '受領見積を確定',
                onClick: () => actions.submitQuote(project.id, !isReceive),
              };
            }
          }

          return (
            <div key={kind} className={`doc-card ${missing ? 'missing' : doc.status === 'sealed' ? 'ready' : ''}`}>
              <div className="row between gap-8">
                <span className="doc-name">{DOC_KIND_LABELS[kind]}</span>
                <DocStatusBadge status={doc.status} />
              </div>
              <div className="doc-no">{doc.no || '書類番号は自動生成時に採番されます'}</div>
              <div className="fs-12 text-sub" style={{ minHeight: '52px' }}>
                {docFlowNote(project, kind, partner)}
              </div>
              <div className="fs-11 text-muted">
                {doc.issuedOn ? `作成日：${formatDate(doc.issuedOn)}` : '未作成'}
                {doc.autoGenerated && !missing ? '／見積書から自動生成' : ''}
              </div>
              <div className="row gap-8 wrap mt-8">
                {missing ? (
                  <button className="btn btn-secondary btn-sm" onClick={() => actions.generateDocs(project.id)}>
                    見積書から自動生成する
                  </button>
                ) : (
                  <>
                    <button className="btn btn-secondary btn-sm" onClick={() => onPreview(kind)}>
                      プレビュー
                    </button>
                    {extra && (
                      <button className="btn btn-primary btn-sm" onClick={extra.onClick}>
                        {extra.label}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

/* ===== 見積明細タブ ===== */

function ItemsTab({
  project,
  actions,
  onToast,
}: {
  project: Project;
  actions: ProjectActions;
  onToast: (message: string, type?: 'success' | 'info' | 'error') => void;
}) {
  const totals = calcTotals(project.items, project.discount);
  const locked = project.status === 'completed';

  return (
    <div className="card card-pad">
      <div className="section-title"><span className="bar" />見積明細（見積書 {project.documents[0].no}）</div>
      {locked ? (
        <div className="alert alert-info mb-16">
          <span aria-hidden="true">i</span>
          <div>工事完了として登録済みの案件のため、明細は閲覧のみとなります。</div>
        </div>
      ) : (
        <div className="fs-12 text-sub mb-12">
          数量・単価を変更すると金額・消費税・請負代金が即時に再計算されます。変更後は注文書・注文請書・約款の再生成が必要です。
        </div>
      )}

      <div className="table-wrap mb-16">
        <table className="items">
          <thead>
            <tr>
              <th style={{ minWidth: '170px' }}>工種・品名</th>
              <th style={{ minWidth: '190px' }}>仕様・規格</th>
              <th style={{ width: '90px' }}>数量</th>
              <th style={{ width: '84px' }}>単位</th>
              <th style={{ width: '116px' }}>単価</th>
              <th style={{ width: '120px' }} className="num">金額</th>
              {!locked && <th style={{ width: '60px' }}>操作</th>}
            </tr>
          </thead>
          <tbody>
            {project.items.map(item => (
              <tr key={item.id}>
                {locked ? (
                  <>
                    <td>{item.name}</td>
                    <td>{item.spec}</td>
                    <td className="num">{item.quantity}</td>
                    <td>{item.unit}</td>
                    <td className="num">{formatYen(item.unitPrice)}</td>
                  </>
                ) : (
                  <>
                    <td><input className="input" value={item.name} aria-label="工種・品名" onChange={e => actions.updateItem(project.id, item.id, { name: e.target.value })} /></td>
                    <td><input className="input" value={item.spec} aria-label="仕様・規格" onChange={e => actions.updateItem(project.id, item.id, { spec: e.target.value })} /></td>
                    <td><input className="input num" type="number" min={0} value={item.quantity} aria-label="数量" onChange={e => actions.updateItem(project.id, item.id, { quantity: Number(e.target.value) })} /></td>
                    <td><input className="input" value={item.unit} aria-label="単位" onChange={e => actions.updateItem(project.id, item.id, { unit: e.target.value })} /></td>
                    <td><input className="input num" type="number" min={0} step={100} value={item.unitPrice} aria-label="単価" onChange={e => actions.updateItem(project.id, item.id, { unitPrice: Number(e.target.value) })} /></td>
                  </>
                )}
                <td className="num fw-600">{formatYen(lineAmount(item))}</td>
                {!locked && (
                  <td>
                    <button
                      className="btn btn-ghost btn-sm"
                      aria-label={`${item.name || 'この行'}を削除`}
                      onClick={() => {
                        if (project.items.length === 1) {
                          onToast('明細は1行以上必要です', 'error');
                          return;
                        }
                        actions.removeItem(project.id, item.id);
                      }}
                    >
                      削除
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="row between wrap gap-16">
        {locked ? <span /> : (
          <button className="btn btn-secondary" onClick={() => actions.addItem(project.id)}>
            ＋ 明細行を追加
          </button>
        )}
        <div className="total-box">
          <div className="total-line"><span>小計</span><span className="num">{formatYen(totals.subtotal)}</span></div>
          <div className="total-line">
            <label htmlFor="disc">値引額</label>
            {locked ? (
              <span className="num">-{formatYen(totals.discount)}</span>
            ) : (
              <input
                id="disc"
                type="number"
                min={0}
                step={1000}
                className="input num"
                style={{ width: '140px' }}
                value={project.discount}
                onChange={e => actions.updateDiscount(project.id, Math.max(0, Number(e.target.value)))}
              />
            )}
          </div>
          <div className="total-line"><span>消費税（10%）</span><span className="num">{formatYen(totals.tax)}</span></div>
          <div className="total-line grand"><span>請負代金（税込）</span><span className="num">{formatYen(totals.total)}</span></div>
        </div>
      </div>
    </div>
  );
}

/* ===== 契約条件タブ ===== */

function TermsTab({
  project,
  partner,
  actions,
}: {
  project: Project;
  partner: Partner;
  actions: ProjectActions;
}) {
  const [draft, setDraft] = useState<ContractTerms>(project.terms);

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(project.terms), [draft, project.terms]);
  const set = (patch: Partial<ContractTerms>) => setDraft(prev => ({ ...prev, ...patch }));

  return (
    <div className="card card-pad">
      <div className="section-title"><span className="bar" />契約条件（注文書・注文請書・約款へ自動反映）</div>
      <div className="fs-12 text-sub mb-16">
        入力内容は建設業法第19条第1項の記載事項に対応しています。保存すると各書類の記載が更新され、法令チェックにも反映されます。
      </div>

      <div className="form-grid">
        <div className="field">
          <label className="field-label" htmlFor="t-start">工事着手の時期（第3号）</label>
          <input id="t-start" type="date" className="input" value={draft.startDate} onChange={e => set({ startDate: e.target.value })} />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="t-end">工事完成の時期（第3号）</label>
          <input id="t-end" type="date" className="input" value={draft.endDate} onChange={e => set({ endDate: e.target.value })} />
        </div>
      </div>

      <div className="field">
        <label className="field-label" htmlFor="t-nonwork">工事を施工しない日または時間帯（第4号）</label>
        <input id="t-nonwork" className="input" value={draft.nonWorkingDays} onChange={e => set({ nonWorkingDays: e.target.value })} />
      </div>

      <div className="field">
        <label className="field-label" htmlFor="t-advance">前金払・出来形払の定め（第5号）</label>
        <input id="t-advance" className="input" value={draft.advancePayment} onChange={e => set({ advancePayment: e.target.value })} />
        <div className="field-hint">
          行わない場合も明記が必要です。
          <button className="btn btn-ghost btn-sm" style={{ marginLeft: '6px' }} onClick={() => set({ advancePayment: '前金払・出来形払は行わない' })}>
            「行わない」を入力
          </button>
        </div>
      </div>

      <div className="form-grid">
        <div className="field">
          <label className="field-label" htmlFor="t-inspection">完成検査の時期・方法（第11号）</label>
          <input id="t-inspection" className="input" value={draft.inspection} onChange={e => set({ inspection: e.target.value })} />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="t-handover">引渡しの時期（第11号）</label>
          <input id="t-handover" className="input" value={draft.handover} onChange={e => set({ handover: e.target.value })} />
        </div>
      </div>

      <div className="field">
        <label className="field-label" htmlFor="t-payment">完成後の請負代金の支払時期・方法（第12号）</label>
        <input id="t-payment" className="input" value={draft.paymentMethod} onChange={e => set({ paymentMethod: e.target.value })} />
        <div className="field-hint">
          取引先マスタの支払条件：{partner.paymentTerms}
          <button
            className="btn btn-ghost btn-sm"
            style={{ marginLeft: '6px' }}
            onClick={() => set({ paymentMethod: `引渡し後、${partner.paymentTerms}` })}
          >
            支払条件を反映する
          </button>
        </div>
      </div>

      <div className="form-grid">
        <div className="field">
          <label className="field-label" htmlFor="t-defect">契約不適合責任の期間・内容（第13号）</label>
          <input id="t-defect" className="input" value={draft.defectLiability} onChange={e => set({ defectLiability: e.target.value })} />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="t-delay">遅延利息・違約金（第14号）</label>
          <input id="t-delay" className="input" value={draft.delayPenalty} onChange={e => set({ delayPenalty: e.target.value })} />
        </div>
      </div>

      <div className="field">
        <label className="field-label" htmlFor="t-third">第三者に与えた損害の負担（第9号）</label>
        <input id="t-third" className="input" value={draft.thirdPartyDamage} onChange={e => set({ thirdPartyDamage: e.target.value })} />
      </div>

      <div className="field">
        <label className="field-label" htmlFor="t-supply">支給材料・貸与機械の定め（第10号）</label>
        <input id="t-supply" className="input" value={draft.suppliedMaterials} onChange={e => set({ suppliedMaterials: e.target.value })} />
      </div>

      <div className="field">
        <label className="field-label" htmlFor="t-dispute">紛争の解決方法（第15号）</label>
        <input id="t-dispute" className="input" value={draft.disputeResolution} onChange={e => set({ disputeResolution: e.target.value })} />
      </div>

      <div className="field">
        <label className="field-label" htmlFor="t-template">適用する約款テンプレート</label>
        <select id="t-template" className="select" value={draft.termsTemplateId} onChange={e => set({ termsTemplateId: e.target.value })}>
          {TERMS_TEMPLATES.map(t => (
            <option key={t.id} value={t.id}>{t.name}（{t.target}）</option>
          ))}
        </select>
      </div>

      <div className="row end gap-10 wrap mt-16">
        <button className="btn btn-secondary" onClick={() => setDraft(project.terms)} disabled={!dirty}>
          変更を取り消す
        </button>
        <button className="btn btn-primary" onClick={() => actions.updateTerms(project.id, draft)} disabled={!dirty}>
          契約条件を保存する
        </button>
      </div>
      {!dirty && <div className="fs-12 text-sub mt-8" style={{ textAlign: 'right' }}>保存済みの内容が表示されています。</div>}
    </div>
  );
}

/* ===== 法令チェックタブ ===== */

function ComplianceTab({
  items,
  summary,
  onGoTerms,
}: {
  items: ReturnType<typeof buildComplianceItems>;
  summary: ReturnType<typeof complianceSummary>;
  onGoTerms: () => void;
}) {
  const allOk = summary.ok === summary.total;
  return (
    <div className="card card-pad">
      <div className="section-title"><span className="bar" />建設業法チェック（記載事項の充足状況）</div>

      <div className={allOk ? 'alert alert-success mb-16' : 'alert alert-warning mb-16'}>
        <span aria-hidden="true">{allOk ? '✓' : '!'}</span>
        <div className="grow">
          <div className="fw-600">
            {allOk
              ? `法定記載事項をすべて満たしています（${summary.ok} / ${summary.total} 項目）`
              : `記載事項が ${summary.total - summary.ok} 項目不足しています（${summary.ok} / ${summary.total} 項目）`}
          </div>
          <div className="progress-track mt-8" role="img" aria-label={`充足率 ${summary.rate}%`}>
            <div
              className="progress-fill"
              style={{ width: `${summary.rate}%`, background: allOk ? 'var(--success)' : 'var(--warning)' }}
            />
          </div>
          {!allOk && (
            <button className="btn btn-warning btn-sm mt-12" onClick={onGoTerms}>
              契約条件を入力して不足を解消する
            </button>
          )}
        </div>
      </div>

      {items.map(item => (
        <div className="compliance-row" key={item.clause + item.label}>
          <span className={item.ok ? 'compliance-mark ok' : 'compliance-mark ng'} aria-hidden="true">
            {item.ok ? '✓' : '!'}
          </span>
          <div className="grow">
            <div className="fs-13 fw-600">{item.label}</div>
            <div className="fs-11 text-sub">建設業法 {item.clause}</div>
            {!item.ok && <div className="fs-12 mt-4" style={{ color: 'var(--error)' }}>{item.hint}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ===== 書類一式の出力モーダル ===== */

function BundleModal({
  isOpen,
  onClose,
  project,
  parties,
  onExport,
}: {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  parties: ReturnType<typeof partiesOf>;
  onExport: () => void;
}) {
  const fileName = `${project.no}_工事関係書類一式.pdf`;
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="書類一式の出力"
      width={620}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>キャンセル</button>
          <button className="btn btn-primary" onClick={onExport}>この構成で出力する</button>
        </>
      }
    >
      <div className="fs-13 mb-12">
        次の構成で1つのファイルにまとめます。ファイル名：<span className="fw-700">{fileName}</span>
      </div>
      <ol style={{ paddingLeft: '20px' }} className="fs-13">
        <li>表紙（案件番号 {project.no}／{project.title}）</li>
        {DOC_KINDS.map(kind => {
          const doc = project.documents.find(d => d.kind === kind)!;
          return (
            <li key={kind}>
              {DOC_KIND_LABELS[kind]}（{doc.no}）
            </li>
          );
        })}
      </ol>
      <div className="alert alert-info mt-16">
        <span aria-hidden="true">i</span>
        <div>
          注文者：{parties.orderer.name}／受注者：{parties.contractor.name}<br />
          建設業法上、契約書類は工事完了後5年間（発注者と直接契約した住宅新築工事は10年間）の保存が必要です。出力したファイルは案件番号で保管してください。
        </div>
      </div>
    </Modal>
  );
}
