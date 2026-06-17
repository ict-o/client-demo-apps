import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Estimate } from '../types';
import { calcTotals, formatCurrency, formatDate } from '../utils/calc';
import { Button } from '../components/Button';
import { Toast } from '../components/Toast';

interface Props {
  estimate: Estimate;
}

const CHECKLIST = [
  { id: 'customer', label: '顧客名・連絡先の確認', category: '基本情報' },
  { id: 'date', label: '挙式予定日・会場の確認', category: '基本情報' },
  { id: 'headcount', label: '人数（大人・子供）の確認', category: '基本情報' },
  { id: 'ceremony', label: '挙式形式の確認', category: '基本情報' },
  { id: 'food', label: '料理・飲料プランの確認', category: '明細確認' },
  { id: 'costume', label: '衣装・美容プランの確認', category: '明細確認' },
  { id: 'photo', label: '写真・映像プランの確認', category: '明細確認' },
  { id: 'flower', label: '装花プランの確認', category: '明細確認' },
  { id: 'discount', label: '割引・特典の適用確認', category: '金額確認' },
  { id: 'total', label: '最終見積金額の確認', category: '金額確認' },
  { id: 'tax', label: '消費税・サービス料率の確認', category: '金額確認' },
];

export function BVManager({ estimate }: Props) {
  const navigate = useNavigate();
  const totals = calcTotals(estimate);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [showToast, setShowToast] = useState(false);

  function toggle(id: string) {
    setChecked(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleCsvExport() {
    setShowToast(true);
  }

  const checklistCategories = [...new Set(CHECKLIST.map(c => c.category))];
  const completedCount = checked.size;
  const totalCount = CHECKLIST.length;

  const exportData = [
    ['項目', '内容'],
    ['顧客名', estimate.customerName],
    ['挙式予定日', formatDate(estimate.weddingDate)],
    ['会場', estimate.venue],
    ['挙式形式', estimate.ceremonyType],
    ['大人人数', `${estimate.adultCount}名`],
    ['子供人数', `${estimate.childCount}名`],
    ['合計金額（税込）', formatCurrency(totals.total)],
    ['見積番号', estimate.id],
  ];

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <Button variant="ghost" size="sm" onClick={() => navigate('/edit')}>
          &larr; 見積編集に戻る
        </Button>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            marginTop: '16px',
          }}
        >
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em' }}>
              BVマネージャー 連携準備
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-sub)', marginTop: '4px' }}>
              基幹システム「BVマネージャー」への入力補助データをご確認ください
            </p>
          </div>
          <div
            style={{
              background: 'var(--accent-light)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 16px',
              fontSize: '12px',
              color: 'var(--text-sub)',
              textAlign: 'center',
            }}
          >
            <span style={{ display: 'block', fontSize: '10px', letterSpacing: '0.06em', marginBottom: '2px' }}>
              ご注意
            </span>
            <span style={{ color: 'var(--text)', fontWeight: 500 }}>
              このデータはBVマネージャーへの参照情報です
            </span>
            <span style={{ display: 'block', marginTop: '2px' }}>
              実際の連携は別途担当者が対応します
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* 連携用データ確認 */}
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
                padding: '16px 24px',
                background: 'var(--bg)',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <h2 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>
                連携用データ確認
              </h2>
              <Button size="sm" variant="secondary" onClick={handleCsvExport}>
                CSV出力
              </Button>
            </div>

            <div style={{ padding: '20px 24px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th
                      style={{
                        padding: '8px 0',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: 'var(--text-sub)',
                        textAlign: 'left',
                        borderBottom: '1px solid var(--border)',
                        letterSpacing: '0.06em',
                      }}
                    >
                      項目
                    </th>
                    <th
                      style={{
                        padding: '8px 0',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: 'var(--text-sub)',
                        textAlign: 'left',
                        borderBottom: '1px solid var(--border)',
                        letterSpacing: '0.06em',
                      }}
                    >
                      内容
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {exportData.map(([label, value], idx) => (
                    <tr
                      key={idx}
                      style={{ borderBottom: idx === exportData.length - 1 ? 'none' : '1px solid var(--border)' }}
                    >
                      <td style={{ padding: '10px 0', fontSize: '12px', color: 'var(--text-sub)', width: '160px' }}>
                        {label}
                      </td>
                      <td
                        style={{
                          padding: '10px 0',
                          fontSize: '14px',
                          fontWeight: label === '合計金額（税込）' ? 700 : 500,
                          color: label === '合計金額（税込）' ? 'var(--accent-dark)' : 'var(--text)',
                        }}
                      >
                        {value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div
              style={{
                padding: '12px 24px',
                background: 'var(--bg)',
                borderTop: '1px solid var(--border)',
                fontSize: '11px',
                color: 'var(--text-sub)',
              }}
            >
              CSVファイルには上記データが含まれます。BVマネージャーへの入力時にご参照ください。
            </div>
          </div>
        </div>

        {/* 入力補助チェックリスト */}
        <div
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-sm)',
            overflow: 'hidden',
            position: 'sticky',
            top: '80px',
          }}
        >
          <div
            style={{
              padding: '16px 20px',
              background: 'var(--bg)',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <h2 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>
              入力補助チェックリスト
            </h2>
            <span style={{ fontSize: '12px', color: 'var(--text-sub)' }}>
              {completedCount}/{totalCount}
            </span>
          </div>

          <div
            style={{
              height: '6px',
              background: 'var(--border)',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${(completedCount / totalCount) * 100}%`,
                background: 'var(--accent)',
                transition: 'width 0.3s ease',
              }}
            />
          </div>

          <div style={{ padding: '16px 20px' }}>
            {checklistCategories.map(cat => (
              <div key={cat} style={{ marginBottom: '16px' }}>
                <div
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: 'var(--text-sub)',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    marginBottom: '8px',
                  }}
                >
                  {cat}
                </div>
                {CHECKLIST.filter(c => c.category === cat).map(item => (
                  <label
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      background: checked.has(item.id) ? 'var(--accent-light)' : 'transparent',
                      transition: 'background 0.15s',
                      marginBottom: '4px',
                    }}
                  >
                    <div
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '3px',
                        border: `1.5px solid ${checked.has(item.id) ? 'var(--accent)' : 'var(--border)'}`,
                        background: checked.has(item.id) ? 'var(--accent)' : 'var(--card)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        transition: 'all 0.15s',
                      }}
                      onClick={() => toggle(item.id)}
                    >
                      {checked.has(item.id) && (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: '12px',
                        color: checked.has(item.id) ? 'var(--accent-dark)' : 'var(--text)',
                        textDecoration: checked.has(item.id) ? 'line-through' : 'none',
                        transition: 'color 0.15s',
                        lineHeight: 1.4,
                      }}
                      onClick={() => toggle(item.id)}
                    >
                      {item.label}
                    </span>
                  </label>
                ))}
              </div>
            ))}
          </div>

          {completedCount === totalCount && (
            <div
              style={{
                margin: '0 16px 16px',
                padding: '12px 16px',
                background: 'var(--success)',
                borderRadius: 'var(--radius-md)',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 600,
                textAlign: 'center',
              }}
            >
              すべての項目を確認しました
            </div>
          )}
        </div>
      </div>

      {showToast && (
        <Toast
          message="連携データCSVを出力しました"
          type="success"
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );
}
