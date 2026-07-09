import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Role, WorkOrder, WorkStatus } from '../types';
import { STATUS_LABELS, WORK_TYPES } from '../types';
import { DEMO_CUSTOMER_ACCOUNT, DEMO_PARTNER_ACCOUNT } from '../data/sampleData';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { formatDate } from '../utils/format';

interface Props {
  orders: WorkOrder[];
  role: Role;
}

/** 役割ごとに閲覧できる案件を絞り込む（顧客・協力業者は自社関連のみ） */
function scopeByRole(orders: WorkOrder[], role: Role): WorkOrder[] {
  if (role === 'customer') return orders.filter(o => o.customerCompany === DEMO_CUSTOMER_ACCOUNT.company);
  if (role === 'partner') return orders.filter(o => o.partnerCompany === DEMO_PARTNER_ACCOUNT.company);
  return orders;
}

const STATUS_ORDER: WorkStatus[] = ['rescheduling', 'proposed', 'confirmed', 'in_progress', 'draft', 'reported'];

export function WorkOrderList({ orders, role }: Props) {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<WorkStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sort, setSort] = useState<'priority' | 'id'>('priority');

  const scoped = useMemo(() => scopeByRole(orders, role), [orders, role]);

  const kpis = useMemo(() => {
    const count = (s: WorkStatus) => scoped.filter(o => o.status === s).length;
    return {
      proposed: count('proposed') + count('rescheduling'),
      confirmed: count('confirmed'),
      inProgress: count('in_progress'),
      reported: count('reported'),
    };
  }, [scoped]);

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    const list = scoped.filter(o => {
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;
      if (typeFilter !== 'all' && o.workType !== typeFilter) return false;
      if (kw) {
        const hay = `${o.id} ${o.customerCompany} ${o.facility} ${o.location} ${o.workType} ${o.partnerCompany} ${o.companyStaff}`.toLowerCase();
        if (!hay.includes(kw)) return false;
      }
      return true;
    });
    return [...list].sort((a, b) => {
      if (sort === 'id') return b.id.localeCompare(a.id);
      const pa = STATUS_ORDER.indexOf(a.status);
      const pb = STATUS_ORDER.indexOf(b.status);
      if (pa !== pb) return pa - pb;
      return b.id.localeCompare(a.id);
    });
  }, [scoped, keyword, statusFilter, typeFilter, sort]);

  const roleHint =
    role === 'customer'
      ? `${DEMO_CUSTOMER_ACCOUNT.company} 宛の作業予定を表示しています。候補日への回答・報告書の確認が行えます。`
      : role === 'partner'
        ? `${DEMO_PARTNER_ACCOUNT.company} が担当する作業を表示しています。確定案件の作業開始・報告書の作成が行えます。`
        : '当社が管理するすべての作業予定です。新規登録・候補日提示・日程確定が行えます。';

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-title">作業一覧</div>
          <div className="page-sub">{roleHint}</div>
        </div>
        {role === 'company' && (
          <button className="btn btn-primary" onClick={() => navigate('/new')}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            新規作業を登録
          </button>
        )}
      </div>

      <div className="kpi-row">
        <Kpi label="候補日提示中 / 再調整中" value={kpis.proposed} unit="件" tone="var(--info)" />
        <Kpi label="日程確定（作業予定）" value={kpis.confirmed} unit="件" tone="var(--accent-dark)" />
        <Kpi label="作業中" value={kpis.inProgress} unit="件" tone="var(--warning)" />
        <Kpi label="報告書提出済み" value={kpis.reported} unit="件" tone="var(--success)" />
      </div>

      <div className="filter-bar">
        <div className="search">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" strokeLinecap="round" />
          </svg>
          <input
            className="input"
            type="search"
            placeholder="作業番号・顧客名・施設・作業種別で検索"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            aria-label="作業を検索"
          />
        </div>
        <select className="select" style={{ width: 'auto' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value as WorkStatus | 'all')} aria-label="ステータスで絞り込み">
          <option value="all">ステータス: すべて</option>
          {STATUS_ORDER.map(s => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
        <select className="select" style={{ width: 'auto' }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)} aria-label="作業種別で絞り込み">
          <option value="all">作業種別: すべて</option>
          {WORK_TYPES.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select className="select" style={{ width: 'auto' }} value={sort} onChange={e => setSort(e.target.value as 'priority' | 'id')} aria-label="並び替え">
          <option value="priority">並び順: 対応が必要な順</option>
          <option value="id">並び順: 作業番号順</option>
        </select>
      </div>

      <div className="text-sub fs-12 mb-8">{filtered.length} 件を表示中</div>

      {filtered.length === 0 ? (
        <div className="card">
          <EmptyState title="該当する作業予定はありません" desc="検索条件・絞り込みを変更してお試しください。" />
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>作業番号</th>
                <th>顧客 / 施設</th>
                <th>作業種別</th>
                <th>確定・候補日</th>
                <th>協力業者</th>
                <th>当社担当</th>
                <th>ステータス</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => (
                <tr key={o.id} className="clickable" onClick={() => navigate(`/order/${o.id}`)}>
                  <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{o.id}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{o.customerCompany}</div>
                    <div className="fs-12 text-sub">{o.facility}・{o.location}</div>
                  </td>
                  <td><span className="tag">{o.workType}</span></td>
                  <td style={{ whiteSpace: 'nowrap' }}>{scheduleCell(o)}</td>
                  <td>{o.partnerCompany}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{o.companyStaff}</td>
                  <td><StatusBadge status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function scheduleCell(o: WorkOrder) {
  const confirmed = o.candidates.find(c => c.id === o.confirmedSlotId);
  if (confirmed) {
    return <span style={{ fontWeight: 600, color: 'var(--accent-dark)' }}>{formatDate(confirmed.date)}</span>;
  }
  if (o.candidates.length === 0) {
    return <span className="text-muted">未提示</span>;
  }
  return <span className="text-sub">候補 {o.candidates.length} 件提示</span>;
}

function Kpi({ label, value, unit, tone }: { label: string; value: number; unit: string; tone: string }) {
  return (
    <div className="kpi">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value" style={{ color: tone }}>
        {value}
        <span className="kpi-unit">{unit}</span>
      </div>
    </div>
  );
}
