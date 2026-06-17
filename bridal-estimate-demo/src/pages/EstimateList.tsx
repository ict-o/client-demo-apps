import { useNavigate } from 'react-router-dom';
import type { Estimate } from '../types';
import { STATUS_LABELS, STATUS_COLORS } from '../types';
import { calcTotals, formatCurrency, formatDate } from '../utils/calc';
import { Button } from '../components/Button';

interface Props {
  estimates: Estimate[];
  onSelect: (id: string) => void;
}

export function EstimateList({ estimates, onSelect }: Props) {
  const navigate = useNavigate();

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          marginBottom: '28px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>
            見積一覧
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-sub)', marginTop: '4px' }}>
            {estimates.length} 件の見積
          </p>
        </div>
        <Button
          onClick={() => navigate('/new')}
          size="md"
        >
          + 新規見積作成
        </Button>
      </div>

      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-sm)',
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['顧客名', '挙式予定日', '会場', '人数', '見積金額', 'ステータス', '最終更新', '操作'].map(col => (
                <th
                  key={col}
                  style={{
                    padding: '12px 16px',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--text-sub)',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    textAlign: col === '見積金額' || col === '人数' ? 'right' : 'left',
                    background: 'var(--bg)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {estimates.map((est, i) => (
              <EstimateRow
                key={est.id}
                estimate={est}
                isLast={i === estimates.length - 1}
                onEdit={() => { onSelect(est.id); navigate('/edit'); }}
                onPreview={() => { onSelect(est.id); navigate('/preview'); }}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EstimateRow({
  estimate,
  isLast,
  onEdit,
  onPreview,
}: {
  estimate: Estimate;
  isLast: boolean;
  onEdit: () => void;
  onPreview: () => void;
}) {
  const totals = calcTotals(estimate);
  const totalGuests = estimate.adultCount + estimate.childCount;

  return (
    <tr
      style={{
        borderBottom: isLast ? 'none' : '1px solid var(--border)',
        transition: 'background 0.1s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg)')}
      onMouseLeave={e => (e.currentTarget.style.background = '')}
    >
      <td style={{ padding: '14px 16px' }}>
        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>
          {estimate.customerName}
        </span>
        <div style={{ fontSize: '11px', color: 'var(--text-sub)', marginTop: '2px' }}>
          {estimate.id}
        </div>
      </td>
      <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--text)', whiteSpace: 'nowrap' }}>
        {formatDate(estimate.weddingDate)}
      </td>
      <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--text)' }}>
        {estimate.venue}
      </td>
      <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--text)', textAlign: 'right' }}>
        {totalGuests}名
      </td>
      <td style={{ padding: '14px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--accent-dark)' }}>
          {formatCurrency(totals.total)}
        </span>
      </td>
      <td style={{ padding: '14px 16px' }}>
        <span
          style={{
            display: 'inline-block',
            padding: '3px 10px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: 600,
            color: '#fff',
            background: STATUS_COLORS[estimate.status],
            letterSpacing: '0.04em',
          }}
        >
          {STATUS_LABELS[estimate.status]}
        </span>
      </td>
      <td style={{ padding: '14px 16px', fontSize: '12px', color: 'var(--text-sub)', whiteSpace: 'nowrap' }}>
        {estimate.updatedAt}
      </td>
      <td style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          <Button size="sm" variant="secondary" onClick={onEdit}>
            編集
          </Button>
          <Button size="sm" variant="ghost" onClick={onPreview}>
            プレビュー
          </Button>
        </div>
      </td>
    </tr>
  );
}
