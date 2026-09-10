import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Partner, Project, ProjectStatus } from '../types';
import { DEAL_KIND_LABELS, DOC_KINDS, DOC_KIND_SHORT, PROJECT_STATUS_LABELS, PROJECT_STATUS_ORDER } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { calcTotals } from '../utils/calc';
import { buildComplianceItems, complianceSummary, isDocSetComplete, needsRegenerate } from '../utils/docs';
import { formatDate, formatYen } from '../utils/format';

interface Props {
  projects: Project[];
  partners: Partner[];
}

type SortKey = 'updated' | 'amount' | 'deadline';

const SORT_LABELS: Record<SortKey, string> = {
  updated: '更新日が新しい順',
  amount: '請負金額が高い順',
  deadline: '完成予定日が近い順',
};

export function ProjectList({ projects, partners }: Props) {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<ProjectStatus | 'all'>('all');
  const [deal, setDeal] = useState<'all' | 'receive' | 'order'>('all');
  const [onlyIncomplete, setOnlyIncomplete] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('updated');

  const partnerOf = useMemo(() => {
    const map = new Map(partners.map(p => [p.id, p]));
    return (id: string) => map.get(id);
  }, [partners]);

  const rows = useMemo(
    () =>
      projects.map(p => {
        const partner = partnerOf(p.partnerId);
        const totals = calcTotals(p.items, p.discount);
        const compliance = partner ? complianceSummary(buildComplianceItems(p, partner)) : { ok: 0, total: 0, rate: 0 };
        const incomplete = !isDocSetComplete(p) || compliance.ok < compliance.total || needsRegenerate(p);
        return { project: p, partner, total: totals.total, compliance, incomplete };
      }),
    [projects, partnerOf],
  );

  const kpi = useMemo(
    () => ({
      quoted: rows.filter(r => r.project.status === 'quoted').length,
      ordered: rows.filter(r => r.project.status === 'ordered').length,
      accepted: rows.filter(r => r.project.status === 'accepted').length,
      incomplete: rows.filter(r => r.incomplete && r.project.status !== 'completed').length,
    }),
    [rows],
  );

  const filtered = useMemo(() => {
    const kw = keyword.trim();
    const list = rows.filter(r => {
      if (status !== 'all' && r.project.status !== status) return false;
      if (deal !== 'all' && r.project.dealKind !== deal) return false;
      if (onlyIncomplete && !(r.incomplete && r.project.status !== 'completed')) return false;
      if (!kw) return true;
      const haystack = [r.project.no, r.project.title, r.project.site, r.partner?.name ?? '', r.project.staff].join(' ');
      return haystack.includes(kw);
    });
    return [...list].sort((a, b) => {
      if (sortKey === 'amount') return b.total - a.total;
      if (sortKey === 'deadline') {
        const av = a.project.terms.endDate || '9999-12-31';
        const bv = b.project.terms.endDate || '9999-12-31';
        return av.localeCompare(bv);
      }
      return b.project.updatedAt.localeCompare(a.project.updatedAt);
    });
  }, [rows, keyword, status, deal, onlyIncomplete, sortKey]);

  const resetFilter = () => {
    setKeyword('');
    setStatus('all');
    setDeal('all');
    setOnlyIncomplete(false);
  };

  const filterApplied = Boolean(keyword.trim()) || status !== 'all' || deal !== 'all' || onlyIncomplete;

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">工事案件一覧</h1>
          <div className="page-sub">
            見積書・注文書・注文請書・基本契約書（約款）を案件ごとに一式で管理します（全 {projects.length} 件）
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/new')}>
          ＋ 新規見積を作成
        </button>
      </div>

      <div className="kpi-row">
        <KpiCard
          label="見積提出済"
          value={kpi.quoted}
          active={status === 'quoted'}
          onClick={() => setStatus(status === 'quoted' ? 'all' : 'quoted')}
          color="var(--info)"
        />
        <KpiCard
          label="注文書手配済"
          value={kpi.ordered}
          active={status === 'ordered'}
          onClick={() => setStatus(status === 'ordered' ? 'all' : 'ordered')}
          color="var(--warning)"
        />
        <KpiCard
          label="契約成立"
          value={kpi.accepted}
          active={status === 'accepted'}
          onClick={() => setStatus(status === 'accepted' ? 'all' : 'accepted')}
          color="var(--accent-dark)"
        />
        <KpiCard
          label="書類不備あり"
          value={kpi.incomplete}
          active={onlyIncomplete}
          onClick={() => setOnlyIncomplete(!onlyIncomplete)}
          color="var(--error)"
        />
      </div>

      <div className="filter-bar">
        <div className="search">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
          </svg>
          <label htmlFor="kw" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
            案件の検索
          </label>
          <input
            id="kw"
            className="input"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            placeholder="案件番号・工事名・取引先名・工事場所で検索"
          />
        </div>
        <select className="select" style={{ width: 'auto' }} value={status} onChange={e => setStatus(e.target.value as ProjectStatus | 'all')} aria-label="ステータスで絞り込み">
          <option value="all">ステータス：すべて</option>
          {PROJECT_STATUS_ORDER.map(s => (
            <option key={s} value={s}>{PROJECT_STATUS_LABELS[s]}</option>
          ))}
        </select>
        <select className="select" style={{ width: 'auto' }} value={deal} onChange={e => setDeal(e.target.value as 'all' | 'receive' | 'order')} aria-label="取引区分で絞り込み">
          <option value="all">取引区分：すべて</option>
          <option value="receive">受注案件</option>
          <option value="order">発注案件（協力会社）</option>
        </select>
        <select className="select" style={{ width: 'auto' }} value={sortKey} onChange={e => setSortKey(e.target.value as SortKey)} aria-label="並び替え">
          {(Object.keys(SORT_LABELS) as SortKey[]).map(k => (
            <option key={k} value={k}>{SORT_LABELS[k]}</option>
          ))}
        </select>
        {filterApplied && (
          <button className="btn btn-ghost btn-sm" onClick={resetFilter}>
            絞り込みを解除
          </button>
        )}
      </div>

      <div className="fs-12 text-sub mb-8">
        {filtered.length} 件を表示中{filterApplied ? '（絞り込み中）' : ''}
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            title="該当する工事案件はありません"
            desc="検索条件を変更するか、絞り込みを解除してください。"
            action={
              <button className="btn btn-secondary btn-sm" onClick={resetFilter}>
                絞り込みを解除する
              </button>
            }
          />
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>案件番号 / 区分</th>
                <th>工事名 / 工事場所</th>
                <th>取引先</th>
                <th className="num">請負金額（税込）</th>
                <th>工期</th>
                <th>書類セット</th>
                <th>法令チェック</th>
                <th>ステータス</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(({ project, partner, total, compliance, incomplete }) => (
                <tr key={project.id} className="clickable" onClick={() => navigate(`/project/${project.id}`)}>
                  <td>
                    <div className="fw-600" style={{ fontVariantNumeric: 'tabular-nums' }}>{project.no}</div>
                    <span className={project.dealKind === 'order' ? 'tag tag-order mt-4' : 'tag tag-receive mt-4'}>
                      {DEAL_KIND_LABELS[project.dealKind]}
                    </span>
                  </td>
                  <td style={{ minWidth: '240px' }}>
                    <div className="fw-600">{project.title}</div>
                    <div className="fs-12 text-sub">{project.site}</div>
                  </td>
                  <td>{partner?.name ?? '（取引先未登録）'}</td>
                  <td className="num fw-600">{formatYen(total)}</td>
                  <td className="fs-12">
                    {project.terms.startDate && project.terms.endDate
                      ? `${formatDate(project.terms.startDate)}〜${formatDate(project.terms.endDate)}`
                      : <span style={{ color: 'var(--error)' }}>未設定</span>}
                  </td>
                  <td>
                    <span className="doc-pips" aria-label="書類の作成状況">
                      {DOC_KINDS.map(kind => {
                        const doc = project.documents.find(d => d.kind === kind);
                        const cls = doc?.status === 'sealed' ? 'doc-pip sealed' : doc && doc.status !== 'none' ? 'doc-pip on' : 'doc-pip';
                        return (
                          <span key={kind} className={cls} title={`${DOC_KIND_SHORT[kind]}：${doc?.status === 'none' ? '未作成' : '作成済'}`}>
                            {DOC_KIND_SHORT[kind]}
                          </span>
                        );
                      })}
                    </span>
                  </td>
                  <td>
                    <div className="fs-12 fw-600" style={{ color: compliance.ok === compliance.total ? 'var(--success)' : 'var(--error)' }}>
                      {compliance.ok} / {compliance.total} 項目
                    </div>
                    {incomplete && project.status !== 'completed' && (
                      <div className="fs-11" style={{ color: 'var(--error)' }}>要対応</div>
                    )}
                  </td>
                  <td><StatusBadge status={project.status} dealKind={project.dealKind} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function KpiCard({
  label,
  value,
  active,
  onClick,
  color,
}: {
  label: string;
  value: number;
  active: boolean;
  onClick: () => void;
  color: string;
}) {
  return (
    <button className={active ? 'kpi active' : 'kpi'} onClick={onClick} aria-pressed={active}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value" style={{ color }}>
        {value}
        <span className="kpi-unit">件</span>
      </div>
      <div className="fs-11 text-sub mt-4">{active ? 'クリックで絞り込み解除' : 'クリックで絞り込み'}</div>
    </button>
  );
}
