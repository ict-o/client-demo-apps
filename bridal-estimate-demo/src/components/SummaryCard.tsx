import type { Estimate } from '../types';
import { calcTotals, formatCurrency } from '../utils/calc';

interface SummaryCardProps {
  estimate: Estimate;
  highlightTotal?: boolean;
}

export function SummaryCard({ estimate, highlightTotal }: SummaryCardProps) {
  const totals = calcTotals(estimate);

  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <h3
        style={{
          fontSize: '11px',
          fontWeight: 600,
          color: 'var(--text-sub)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          marginBottom: '16px',
        }}
      >
        見積サマリー
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <SummaryRow label="商品小計" value={formatCurrency(totals.subtotal)} />
        <SummaryRow label={`サービス料（${estimate.serviceRatePercent}%）`} value={formatCurrency(totals.serviceCharge)} />
        <SummaryRow label="割引額" value={`-${formatCurrency(totals.discountFixed)}`} color="var(--success)" />
        <SummaryRow label="特典適用額" value={`-${formatCurrency(totals.discountPercent)}`} color="var(--success)" />
        <div
          style={{
            borderTop: '1px solid var(--border)',
            marginTop: '4px',
            paddingTop: '12px',
          }}
        />
        <SummaryRow label="税抜合計" value={formatCurrency(totals.preTax)} />
        <SummaryRow label={`消費税（${estimate.taxRatePercent}%）`} value={formatCurrency(totals.tax)} />
        <div
          style={{
            background: highlightTotal ? 'var(--accent-light)' : 'transparent',
            borderRadius: 'var(--radius-sm)',
            padding: highlightTotal ? '10px 12px' : '0',
            marginTop: '4px',
            transition: 'background 0.3s',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
            }}
          >
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>
              最終見積金額
            </span>
            <span
              style={{
                fontSize: '20px',
                fontWeight: 700,
                color: 'var(--accent-dark)',
                letterSpacing: '-0.02em',
              }}
            >
              {formatCurrency(totals.total)}
            </span>
          </div>
        </div>
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px', marginTop: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-sub)' }}>
              1人あたり単価（大人{estimate.adultCount}名）
            </span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-sub)' }}>
              {formatCurrency(estimate.adultCount > 0 ? Math.round(totals.total / estimate.adultCount) : 0)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '12px', color: 'var(--text-sub)' }}>{label}</span>
      <span style={{ fontSize: '13px', fontWeight: 500, color: color || 'var(--text)' }}>{value}</span>
    </div>
  );
}
