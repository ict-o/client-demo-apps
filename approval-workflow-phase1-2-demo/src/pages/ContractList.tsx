import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Contract, ContractType, Member } from '../types';
import { Badge } from '../components/Badge';
import { EmptyState } from '../components/EmptyState';
import { canWriteByRole, contractPhase, contractPhaseMeta } from '../utils/domain';
import { formatDate, formatYen } from '../utils/format';

interface ContractListProps {
  viewer: Member;
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

/** 検索語を「含む語」と「除外する語（-で始まる語）」に分ける */
function parseQuery(input: string): { include: string[]; exclude: string[] } {
  const terms = input.trim().split(/[\s\u3000]+/).filter(t => t !== '');
  const include: string[] = [];
  const exclude: string[] = [];
  terms.forEach(t => {
    if ((t.startsWith('-') || t.startsWith('ー')) && t.length > 1) exclude.push(t.slice(1));
    else include.push(t);
  });
  return { include, exclude };
}

/** 本文からヒット箇所の前後を抜き出す */
function excerpt(body: string, term: string, span = 26): string | null {
  const i = body.indexOf(term);
  if (i < 0) return null;
  const start = Math.max(0, i - span);
  const end = Math.min(body.length, i + term.length + span);
  return `${start > 0 ? '…' : ''}${body.slice(start, end)}${end < body.length ? '…' : ''}`;
}

/** ヒットした語を強調して表示する */
function Highlight({ text, terms }: { text: string; terms: string[] }) {
  const valid = terms.filter(t => t !== '');
  if (valid.length === 0) return <>{text}</>;
  const pattern = new RegExp(`(${valid.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g');
  return (
    <>
      {text.split(pattern).map((part, i) =>
        valid.includes(part) ? (
          <mark className="hit" key={i}>
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

export function ContractList({ viewer, contracts }: ContractListProps) {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [type, setType] = useState<ContractType | 'all'>('all');
  const [phase, setPhase] = useState<'all' | 'active' | 'expired'>('all');
  const [sort, setSort] = useState<SortKey>('endAsc');
  const [searchBody, setSearchBody] = useState(true);
  const [minAmount, setMinAmount] = useState('');

  const query = useMemo(() => parseQuery(keyword), [keyword]);

  const rows = useMemo(() => {
    const min = Number(minAmount.replace(/[^0-9]/g, '')) || 0;
    const filtered = contracts.filter(c => {
      if (type !== 'all' && c.contractType !== type) return false;
      if (phase !== 'all' && contractPhase(c) !== phase) return false;
      if (c.amount < min) return false;
      const fields = `${c.code} ${c.title} ${c.counterparty} ${c.property} ${c.contractType} ${c.tags.join(' ')} ${c.folder}`;
      const hay = searchBody ? `${fields} ${c.bodyText}` : fields;
      if (query.include.some(t => !hay.includes(t))) return false;
      if (query.exclude.some(t => hay.includes(t))) return false;
      return true;
    });
    const sorted = [...filtered];
    if (sort === 'endAsc') sorted.sort((a, b) => a.endDate.localeCompare(b.endDate));
    if (sort === 'registeredDesc') sorted.sort((a, b) => b.registeredAt.localeCompare(a.registeredAt));
    if (sort === 'amountDesc') sorted.sort((a, b) => b.amount - a.amount);
    return sorted;
  }, [contracts, minAmount, phase, query, searchBody, sort, type]);

  const totalRent = rows.reduce((sum, c) => sum + c.rentMonthly, 0);

  /** 本文にヒットした語と、その前後の抜粋 */
  const bodyHit = (c: Contract): { term: string; text: string } | null => {
    if (!searchBody) return null;
    for (const t of query.include) {
      const fields = `${c.code} ${c.title} ${c.counterparty} ${c.property} ${c.contractType} ${c.tags.join(' ')} ${c.folder}`;
      if (fields.includes(t)) continue;
      const text = excerpt(c.bodyText, t);
      if (text) return { term: t, text };
    }
    return null;
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">契約書管理</h1>
          <p className="page-sub">
            電子契約で締結した契約書と、取込登録した紙の契約書を1つの台帳で管理します。台帳の項目に加えて<strong>契約書の本文（全文）</strong>も検索でき、複数キーワードの絞り込みや除外検索が使えます。
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/register')}
          disabled={!canWriteByRole(viewer.role)}
          title={canWriteByRole(viewer.role) ? undefined : '契約書の登録は閲覧者の権限では行えません'}
        >
          契約書を取り込む
        </button>
      </div>

      <div className="filter-bar" data-tour="contract-search">
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
            placeholder="例: 原状回復 賃貸借　（スペース区切りでAND検索・-語で除外）"
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
          aria-label="契約の状態で絞り込む"
        >
          <option value="all">状態: すべて</option>
          <option value="active">状態: 契約期間中</option>
          <option value="expired">状態: 満了済</option>
        </select>
        <label className="field-label" htmlFor="ct-min" style={{ position: 'absolute', left: '-9999px' }}>
          契約金額の下限
        </label>
        <input
          id="ct-min"
          className="input"
          style={{ width: '160px' }}
          inputMode="numeric"
          value={minAmount}
          onChange={e => setMinAmount(e.target.value)}
          placeholder="契約金額（円）以上"
        />
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
        <label className="check-row" htmlFor="ct-body" style={{ padding: 0, border: 'none' }}>
          <input id="ct-body" type="checkbox" checked={searchBody} onChange={e => setSearchBody(e.target.checked)} />
          <span className="fs-13">契約書の本文も検索対象にする（全文検索）</span>
        </label>
        <span className="grow" />
        <span className="fs-13 text-sub">{rows.length} 件を表示</span>
        <span className="fs-13 text-sub">表示中の月額賃料合計: {formatYen(totalRent)}</span>
      </div>

      {rows.length === 0 ? (
        <div className="card">
          <EmptyState
            title="該当する契約書はありません"
            desc="キーワードを減らすか、絞り込み条件・契約金額の下限を変更してお試しください。本文も検索したい場合は「契約書の本文も検索対象にする」を有効にしてください。"
          />
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
                const hit = bodyHit(c);
                return (
                  <tr key={c.id} className="clickable" onClick={() => navigate(`/contracts/${c.id}`)}>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div>{c.code}</div>
                      <div className="fs-12 text-sub">{c.origin === 'esign' ? '電子契約' : 'スキャン原本'}</div>
                    </td>
                    <td>
                      <div className="fw-600">
                        <Highlight text={c.title} terms={query.include} />
                      </div>
                      <div className="fs-12 text-sub">
                        <Highlight text={`${c.counterparty}／${c.contractType}`} terms={query.include} />
                        {c.aiExtracted && '／AI抽出'}
                      </div>
                      {hit && (
                        <div className="hit-line">
                          <span className="tag">本文ヒット</span>
                          <span className="fs-12">
                            <Highlight text={hit.text} terms={query.include} />
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="fs-13">{c.property}</td>
                    <td className="num">{c.rentMonthly > 0 ? formatYen(c.rentMonthly) : '—'}</td>
                    <td className="num">{formatYen(c.amount)}</td>
                    <td style={{ whiteSpace: 'nowrap' }} className="fs-13">
                      <div>
                        {formatDate(c.startDate)} 〜
                      </div>
                      <div>{formatDate(c.endDate)}</div>
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
