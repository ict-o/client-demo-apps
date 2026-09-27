import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Partner, Project } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { calcTotals } from '../utils/calc';
import { buildComplianceItems, complianceSummary, isDocSetComplete, needsRegenerate } from '../utils/docs';
import { formatYen } from '../utils/format';

interface Props {
  projects: Project[];
  partners: Partner[];
}

/** 絞り込みは3つだけ。多くの条件を並べず、見たいものをひと押しで選べるようにする */
type Filter = 'all' | 'todo' | 'active' | 'done';

export function ProjectList({ projects, partners }: Props) {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

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
        const docsDone = p.documents.filter(d => d.status !== 'none').length;
        const done = p.status === 'completed';
        const todo = !done && (!isDocSetComplete(p) || compliance.ok < compliance.total || needsRegenerate(p));
        return { project: p, partner, total: totals.total, compliance, docsDone, todo, done };
      }),
    [projects, partnerOf],
  );

  const counts = useMemo(
    () => ({
      todo: rows.filter(r => r.todo).length,
      active: rows.filter(r => !r.done).length,
      done: rows.filter(r => r.done).length,
    }),
    [rows],
  );

  const filtered = useMemo(() => {
    const kw = keyword.trim();
    return rows
      .filter(r => {
        if (filter === 'todo' && !r.todo) return false;
        if (filter === 'active' && r.done) return false;
        if (filter === 'done' && !r.done) return false;
        if (!kw) return true;
        return [r.project.no, r.project.title, r.project.site, r.partner?.name ?? ''].join(' ').includes(kw);
      })
      .sort((a, b) => b.project.updatedAt.localeCompare(a.project.updatedAt));
  }, [rows, keyword, filter]);

  const resetFilter = () => {
    setKeyword('');
    setFilter('all');
  };

  const filterApplied = Boolean(keyword.trim()) || filter !== 'all';

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">工事案件の一覧</h1>
          <p className="page-sub">
            見積書を取り込むと、注文書・注文請書・基本契約書（約款）がこの案件にまとめて作られます（全 {projects.length} 件）
          </p>
        </div>
        <button className="btn btn-primary btn-lg" onClick={() => navigate('/import')}>
          見積書を取り込む
        </button>
      </div>

      <div className="tile-row">
        <FilterTile
          label="対応が必要"
          desc="書類または入力に不足があります"
          value={counts.todo}
          tone="error"
          active={filter === 'todo'}
          onClick={() => setFilter(filter === 'todo' ? 'all' : 'todo')}
        />
        <FilterTile
          label="進行中"
          desc="工事完了までの案件"
          value={counts.active}
          tone="accent"
          active={filter === 'active'}
          onClick={() => setFilter(filter === 'active' ? 'all' : 'active')}
        />
        <FilterTile
          label="工事完了"
          desc="書類一式を保管する案件"
          value={counts.done}
          tone="success"
          active={filter === 'done'}
          onClick={() => setFilter(filter === 'done' ? 'all' : 'done')}
        />
      </div>

      <div className="filter-bar">
        <div className="search">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
          </svg>
          <label htmlFor="kw" className="visually-hidden">案件の検索</label>
          <input
            id="kw"
            className="input"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            placeholder="工事名・取引先名・案件番号で探す"
          />
        </div>
        {filterApplied && (
          <button className="btn btn-secondary" onClick={resetFilter}>
            すべての案件を表示する
          </button>
        )}
      </div>

      <div className="list-count">
        {filtered.length} 件を表示しています{filterApplied ? '（絞り込み中）' : ''}
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            title="該当する工事案件はありません"
            desc="検索の文字を変えるか、絞り込みを解除してください。"
            action={
              <button className="btn btn-secondary" onClick={resetFilter}>
                すべての案件を表示する
              </button>
            }
          />
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>案件番号</th>
                <th>工事名・工事場所</th>
                <th>取引先</th>
                <th className="num">請負金額（税込）</th>
                <th>書類のそろい具合</th>
                <th>状態</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(({ project, partner, total, compliance, docsDone, todo }) => (
                <tr key={project.id} className="clickable" onClick={() => navigate(`/project/${project.id}`)}>
                  <td className="fw-700 tnum">{project.no}</td>
                  <td style={{ minWidth: '260px' }}>
                    <div className="fw-600">{project.title}</div>
                    <div className="fs-13 text-sub">{project.site}</div>
                  </td>
                  <td>{partner?.name ?? '（取引先が未登録です）'}</td>
                  <td className="num fw-700">{formatYen(total)}</td>
                  <td style={{ minWidth: '190px' }}>
                    <div className={docsDone === 4 ? 'docs-count ok' : 'docs-count'}>
                      {docsDone === 4 ? '4点そろっています' : `4点のうち ${docsDone} 点`}
                    </div>
                    {compliance.ok < compliance.total && (
                      <div className="fs-13 text-error mt-4">入力の不足 {compliance.total - compliance.ok} 件</div>
                    )}
                    {todo && compliance.ok === compliance.total && docsDone === 4 && (
                      <div className="fs-13 text-error mt-4">書類の作り直しが必要</div>
                    )}
                  </td>
                  <td><StatusBadge status={project.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function FilterTile({
  label,
  desc,
  value,
  tone,
  active,
  onClick,
}: {
  label: string;
  desc: string;
  value: number;
  tone: 'error' | 'accent' | 'success';
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button className={active ? `tile tile-${tone} active` : `tile tile-${tone}`} onClick={onClick} aria-pressed={active}>
      <span className="tile-label">{label}</span>
      <span className="tile-value">
        {value}
        <span className="tile-unit">件</span>
      </span>
      <span className="tile-desc">{active ? 'もう一度押すと絞り込みを解除します' : desc}</span>
    </button>
  );
}
