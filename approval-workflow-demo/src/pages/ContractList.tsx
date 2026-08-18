import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Contract, ContractType } from '../types';
import { Badge } from '../components/Badge';
import { EmptyState } from '../components/EmptyState';
import { contractPhase, contractPhaseMeta } from '../utils/domain';
import { daysUntil, formatDate, formatYen } from '../utils/format';

interface ContractListProps {
  contracts: Contract[];
}

const CONTRACT_TYPES: (ContractType | 'all')[] = [
  'all',
  '賃貸借契約',
  '売買契約',
  '管理受託契約',
  '工事請負契約',
  '業務委託契約',
];

type SortKey = 'endAsc' | 'registeredDesc' | 'amountDesc';

export function ContractList({ contracts }: ContractListProps) {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [type, setType] = useState<ContractType | 'all'>('all');
  const [phase, setPhase] = useState<'all' | 'expiring' | 'expired'>('all');
  const [sort, setSort] = useState<SortKey>('endAsc');

  const rows = useMemo(() => {
    const kw = keyword.trim();
    const filtered = contracts.filter(c => {
      if (type !== 'all' && c.contractType !== type) return false;
      if (phase !== 'all' && contractPhase(c) !== phase) return false;
      if (kw !== '') {
        const hay = `${c.code} ${c.title} ${c.counterparty} ${c.property} ${c.contractType} ${c.tags.join(' ')} ${c.folder}`;
        if (!hay.includes(kw)) return false;
      }
      return true;
    });
    const sorted = [...filtered];
    if (sort === 'endAsc') sorted.sort((a, b) => a.endDate.localeCompare(b.endDate));
    if (sort === 'registeredDesc') sorted.sort((a, b) => b.registeredAt.localeCompare(a.registeredAt));
    if (sort === 'amountDesc') sorted.sort((a, b) => b.amount - a.amount);
    return sorted;
  }, [contracts, keyword, type, phase, sort]);

  const totalRent = rows.reduce((sum, c) => sum + c.rentMonthly, 0);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">契約書管理</h1>
          <p className="page-sub">
            ワークフローで締結した契約書と、スキャン取込した紙の契約書を一元管理します。相手先・物件・契約種別で検索できます。
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/import')}>
          契約書を取り込む
        </button>
      </div>

      <div className="filter-bar">
        <div className="search">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
          </svg>
          <label className="field-label" htmlFor="ct-search" style={{ position: 'absolute', left: '-9999px' }}>
            契約書の検索
          </label>
          <input
            id="ct-search"
            className="input"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            placeholder="契約番号・相手先企業名・物件名・契約内容で検索"
          />
        </div>
        <select
          className="select"
          style={{ width: 'auto' }}
          value={type}
          onChange={e => setType(e.target.value as ContractType | 'all')}
          aria-label="契約種別で絞り込む"
        >
          {CONTRACT_TYPES.map(t => (
            <option key={t} value={t}>
              {t === 'all' ? '契約種別: すべて' : `契約種別: ${t}`}
            </option>
          ))}
        </select>
        <select
          className="select"
          style={{ width: 'auto' }}
          value={phase}
          onChange={e => setPhase(e.target.value as typeof phase)}
          aria-label="契約期限で絞り込む"
        >
          <option value="all">期限: すべて</option>
          <option value="expiring">期限: 60日以内に満了</option>
          <option value="expired">期限: 満了済</option>
        </select>
        <select
          className="select"
          style={{ width: 'auto' }}
          value={sort}
          onChange={e => setSort(e.target.value as SortKey)}
          aria-label="並び替え"
        >
          <option value="endAsc">並び替え: 契約満了日が近い順</option>
          <option value="registeredDesc">並び替え: 登録日が新しい順</option>
          <option value="amountDesc">並び替え: 契約金額が大きい順</option>
        </select>
      </div>

      <div className="row gap-12 wrap mb-12">
        <span className="fs-13 text-sub">{rows.length} 件を表示</span>
        <span className="fs-13 text-sub">表示中の月額賃料合計: {formatYen(totalRent)}</span>
      </div>

      {rows.length === 0 ? (
        <div className="card">
          <EmptyState title="該当する契約書はありません" desc="検索条件・絞り込みを変更してお試しください。" />
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>契約番号</th>
                <th>契約内容 / 相手先</th>
                <th>物件情報</th>
                <th className="num">月額賃料</th>
                <th className="num">契約金額</th>
                <th>契約期間</th>
                <th>状態</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(c => {
                const meta = contractPhaseMeta(contractPhase(c));
                const rest = daysUntil(c.endDate);
                return (
                  <tr key={c.id} className="clickable" onClick={() => navigate(`/contracts/${c.id}`)}>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div>{c.code}</div>
                      <div className="fs-12 text-sub">{c.origin === 'esign' ? '電子契約' : 'スキャン原本'}</div>
                    </td>
                    <td>
                      <div className="fw-600">{c.title}</div>
                      <div className="fs-12 text-sub">
                        {c.counterparty}／{c.contractType}
                        {c.aiExtracted && '／AI抽出'}
                      </div>
                    </td>
                    <td className="fs-13">{c.property}</td>
                    <td className="num">{c.rentMonthly > 0 ? formatYen(c.rentMonthly) : '—'}</td>
                    <td className="num">{formatYen(c.amount)}</td>
                    <td style={{ whiteSpace: 'nowrap' }} className="fs-13">
                      <div>
                        {formatDate(c.startDate)} 〜
                      </div>
                      <div>
                        {formatDate(c.endDate)}
                        {rest >= 0 ? `（あと${rest}日）` : `（${-rest}日超過）`}
                      </div>
                    </td>
                    <td>
                      <div className="row gap-6 wrap">
                        <Badge tone={meta.tone} label={meta.label} />
                        {c.autoRenew && <span className="tag">自動更新</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
