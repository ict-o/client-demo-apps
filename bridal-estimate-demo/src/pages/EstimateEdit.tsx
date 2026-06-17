import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Estimate, EstimateItem, Discount } from '../types';
import { formatCurrency, formatDate } from '../utils/calc';
import { Button } from '../components/Button';
import { SummaryCard } from '../components/SummaryCard';
import { ToastContainer } from '../components/Toast';

interface Props {
  estimate: Estimate;
  onChange: (est: Estimate) => void;
}

type ToastState = { message: string; type?: 'success' | 'info' } | null;

export function EstimateEdit({ estimate, onChange }: Props) {
  const navigate = useNavigate();
  const [toast, setToast] = useState<ToastState>(null);
  const [highlightTotal, setHighlightTotal] = useState(false);

  function showToast(message: string, type: 'success' | 'info' = 'success') {
    setToast({ message, type });
  }

  function flash() {
    setHighlightTotal(true);
    setTimeout(() => setHighlightTotal(false), 800);
  }

  const updateItem = useCallback((id: string, field: keyof EstimateItem, value: number | string) => {
    const next = {
      ...estimate,
      items: estimate.items.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    };
    onChange(next);
    flash();
  }, [estimate, onChange]);

  function saveEstimate() {
    const next = { ...estimate, updatedAt: new Date().toISOString().slice(0, 10) };
    onChange(next);
    showToast('見積を保存しました');
  }

  const categories = [...new Set(estimate.items.map(i => i.category))];

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
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            &larr; 見積一覧に戻る
          </Button>
          <h1 style={{ fontSize: '22px', fontWeight: 700, marginTop: '16px', letterSpacing: '-0.02em' }}>
            見積編集
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-sub)', marginTop: '4px' }}>
            {estimate.customerName} &mdash; {estimate.venue}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            variant="secondary"
            onClick={() => { navigate('/bv'); }}
          >
            BVマネージャー連携
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate('/preview')}
          >
            プレビュー
          </Button>
          <Button onClick={saveEstimate}>
            保存
          </Button>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 320px',
          gap: '24px',
          alignItems: 'start',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {categories.map(cat => (
            <CategorySection
              key={cat}
              category={cat}
              items={estimate.items.filter(i => i.category === cat)}
              onUpdate={updateItem}
            />
          ))}

          <DiscountsSection estimate={estimate} onChange={onChange} onFlash={flash} />
        </div>

        <div style={{ position: 'sticky', top: '80px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <SummaryCard estimate={estimate} highlightTotal={highlightTotal} />

          <CustomerInfoCard estimate={estimate} />
        </div>
      </div>

      <ToastContainer toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

function CategorySection({
  category,
  items,
  onUpdate,
}: {
  category: string;
  items: EstimateItem[];
  onUpdate: (id: string, field: keyof EstimateItem, value: number | string) => void;
}) {
  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '14px 20px',
          background: 'var(--bg)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>{category}</span>
        <span style={{ fontSize: '12px', color: 'var(--text-sub)' }}>小計 {formatCurrency(subtotal)}</span>
      </div>
      <div>
        {items.map((item, idx) => (
          <ItemRow
            key={item.id}
            item={item}
            isLast={idx === items.length - 1}
            onUpdate={onUpdate}
          />
        ))}
      </div>
    </div>
  );
}

function ItemRow({
  item,
  isLast,
  onUpdate,
}: {
  item: EstimateItem;
  isLast: boolean;
  onUpdate: (id: string, field: keyof EstimateItem, value: number | string) => void;
}) {
  const rowTotal = item.unitPrice * item.quantity;
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '12px 20px',
        borderBottom: isLast ? 'none' : '1px solid var(--border)',
        display: 'grid',
        gridTemplateColumns: '1fr 140px 100px 110px',
        gap: '12px',
        alignItems: 'center',
        background: hovered ? 'var(--bg)' : 'transparent',
        transition: 'background 0.1s',
      }}
    >
      <span style={{ fontSize: '13px', color: 'var(--text)' }}>{item.name}</span>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <input
          type="number"
          value={item.unitPrice}
          onChange={e => onUpdate(item.id, 'unitPrice', Number(e.target.value))}
          min={0}
          style={{
            width: '100%',
            padding: '5px 8px',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '12px',
            color: 'var(--text)',
            background: 'var(--card)',
            textAlign: 'right',
          }}
        />
        <span style={{ fontSize: '11px', color: 'var(--text-sub)', whiteSpace: 'nowrap' }}>円</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <input
          type="number"
          value={item.quantity}
          onChange={e => onUpdate(item.id, 'quantity', Number(e.target.value))}
          min={1}
          style={{
            width: '60px',
            padding: '5px 8px',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '12px',
            color: 'var(--text)',
            background: 'var(--card)',
            textAlign: 'right',
          }}
        />
        <span style={{ fontSize: '11px', color: 'var(--text-sub)' }}>{item.unit}</span>
      </div>

      <div style={{ textAlign: 'right' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
          {formatCurrency(rowTotal)}
        </span>
      </div>
    </div>
  );
}

function DiscountsSection({
  estimate,
  onChange,
  onFlash,
}: {
  estimate: Estimate;
  onChange: (est: Estimate) => void;
  onFlash: () => void;
}) {
  function updateDiscount(id: string, field: keyof Discount, value: number | string) {
    const next = {
      ...estimate,
      discounts: estimate.discounts.map(d =>
        d.id === id ? { ...d, [field]: value } : d
      ),
    };
    onChange(next);
    onFlash();
  }

  function updateServiceRate(val: number) {
    onChange({ ...estimate, serviceRatePercent: val });
    onFlash();
  }

  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '14px 20px',
          background: 'var(--bg)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>割引・特典・税率設定</span>
      </div>

      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '13px', color: 'var(--text)' }}>サービス料率</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <input
              type="number"
              value={estimate.serviceRatePercent}
              onChange={e => updateServiceRate(Number(e.target.value))}
              min={0}
              max={30}
              style={{
                width: '64px',
                padding: '5px 8px',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '12px',
                textAlign: 'right',
              }}
            />
            <span style={{ fontSize: '12px', color: 'var(--text-sub)' }}>%</span>
          </div>
        </div>

        {estimate.discounts.map((disc, idx) => (
          <div
            key={disc.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: idx === 0 ? '8px' : 0,
              borderTop: idx === 0 ? '1px solid var(--border)' : 'none',
            }}
          >
            <span style={{ fontSize: '13px', color: 'var(--text)' }}>{disc.name}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: 'var(--success)' }}>
                {disc.type === 'fixed' ? '-' : ''}
              </span>
              <input
                type="number"
                value={disc.amount}
                onChange={e => updateDiscount(disc.id, 'amount', Number(e.target.value))}
                min={0}
                style={{
                  width: '100px',
                  padding: '5px 8px',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  textAlign: 'right',
                  color: 'var(--success)',
                }}
              />
              <span style={{ fontSize: '12px', color: 'var(--text-sub)' }}>
                {disc.type === 'fixed' ? '円' : '%OFF'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CustomerInfoCard({ estimate }: { estimate: Estimate }) {
  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        padding: '20px',
      }}
    >
      <h3
        style={{
          fontSize: '11px',
          fontWeight: 600,
          color: 'var(--text-sub)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          marginBottom: '14px',
        }}
      >
        お客様情報
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {[
          ['顧客名', estimate.customerName],
          ['挙式予定日', formatDate(estimate.weddingDate)],
          ['会場', estimate.venue],
          ['挙式形式', estimate.ceremonyType],
          ['人数', `大人${estimate.adultCount}名・子供${estimate.childCount}名`],
        ].map(([label, val]) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-sub)' }}>{label}</span>
            <span style={{ fontSize: '12px', color: 'var(--text)', fontWeight: 500, textAlign: 'right' }}>{val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
