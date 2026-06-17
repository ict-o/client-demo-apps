import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Estimate } from '../types';
import { calcTotals, formatCurrency, formatDate } from '../utils/calc';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Toast } from '../components/Toast';

interface Props {
  estimate: Estimate;
}

export function EstimatePreview({ estimate }: Props) {
  const navigate = useNavigate();
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const totals = calcTotals(estimate);

  const filename = `見積書_${estimate.customerName.replace(/\s/g, '_')}_${estimate.weddingDate}.pdf`;

  function handleDownload() {
    setShowToast(true);
    setShowPdfModal(false);
  }

  const categories = [...new Set(estimate.items.map(i => i.category))];

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '28px',
        }}
      >
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            一覧に戻る
          </Button>
          <span style={{ color: 'var(--border)' }}>/</span>
          <Button variant="ghost" size="sm" onClick={() => navigate('/edit')}>
            編集に戻る
          </Button>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button onClick={() => setShowPdfModal(true)}>
            PDF出力
          </Button>
        </div>
      </div>

      {/* A4 紙面風レイアウト */}
      <div
        style={{
          maxWidth: '760px',
          margin: '0 auto',
          background: 'var(--card)',
          boxShadow: 'var(--shadow-lg)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
        }}
      >
        {/* ヘッダービジュアル */}
        <div
          style={{
            height: '180px',
            background: 'linear-gradient(160deg, #2F2A25 0%, #5A5248 60%, #7A6F64 100%)',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: '0 48px 32px',
          }}
        >
          {/* 上品な幾何学装飾 */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '240px',
              height: '100%',
              borderLeft: '1px solid rgba(184, 155, 114, 0.3)',
              opacity: 0.6,
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '24px',
              right: '32px',
              width: '120px',
              height: '120px',
              border: '1px solid rgba(184, 155, 114, 0.25)',
              borderRadius: '50%',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '48px',
              right: '56px',
              width: '72px',
              height: '72px',
              border: '1px solid rgba(184, 155, 114, 0.2)',
              borderRadius: '50%',
            }}
          />

          <div style={{ position: 'relative' }}>
            <div
              style={{
                fontSize: '10px',
                letterSpacing: '0.2em',
                color: 'rgba(239, 230, 216, 0.7)',
                marginBottom: '8px',
                textTransform: 'uppercase',
              }}
            >
              Wedding Estimate Proposal
            </div>
            <h1
              style={{
                fontSize: '22px',
                fontWeight: 300,
                color: '#F8F6F1',
                letterSpacing: '0.12em',
                margin: 0,
              }}
            >
              ご 婚 礼 お 見 積 書
            </h1>
          </div>
        </div>

        {/* メタ情報 */}
        <div
          style={{
            padding: '32px 48px 24px',
            borderBottom: '1px solid var(--border)',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
          }}
        >
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-sub)', letterSpacing: '0.08em', marginBottom: '4px' }}>
              お客様名
            </div>
            <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text)', letterSpacing: '0.04em' }}>
              {estimate.customerName}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <MetaItem label="挙式予定日" value={formatDate(estimate.weddingDate)} />
            <MetaItem label="会場" value={estimate.venue} />
            <MetaItem label="挙式形式" value={estimate.ceremonyType} />
            <MetaItem label="ご参加人数" value={`大人${estimate.adultCount}名・子供${estimate.childCount}名`} />
          </div>
        </div>

        {/* 明細テーブル */}
        <div style={{ padding: '32px 48px' }}>
          <h2
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--text-sub)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginBottom: '16px',
            }}
          >
            見積明細
          </h2>

          {categories.map(cat => {
            const catItems = estimate.items.filter(i => i.category === cat);
            return (
              <div key={cat} style={{ marginBottom: '20px' }}>
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: 'var(--accent)',
                    letterSpacing: '0.1em',
                    paddingBottom: '6px',
                    borderBottom: '1px solid var(--accent-light)',
                    marginBottom: '8px',
                  }}
                >
                  {cat}
                </div>
                {catItems.map(item => (
                  <div
                    key={item.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 80px 80px 120px',
                      gap: '12px',
                      padding: '6px 0',
                      borderBottom: '1px solid var(--border)',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ fontSize: '13px', color: 'var(--text)' }}>{item.name}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-sub)', textAlign: 'right' }}>
                      {formatCurrency(item.unitPrice)}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-sub)', textAlign: 'right' }}>
                      {item.quantity}{item.unit}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)', textAlign: 'right' }}>
                      {formatCurrency(item.unitPrice * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            );
          })}

          {/* 合計セクション */}
          <div
            style={{
              marginTop: '24px',
              background: 'var(--bg)',
              borderRadius: 'var(--radius-md)',
              padding: '20px 24px',
              border: '1px solid var(--border)',
            }}
          >
            <TotalRow label="商品小計" value={formatCurrency(totals.subtotal)} />
            <TotalRow label={`サービス料（${estimate.serviceRatePercent}%）`} value={formatCurrency(totals.serviceCharge)} />
            {totals.discountFixed > 0 && (
              <TotalRow label="割引" value={`-${formatCurrency(totals.discountFixed)}`} color="var(--success)" />
            )}
            {totals.discountPercent > 0 && (
              <TotalRow label="特典適用" value={`-${formatCurrency(totals.discountPercent)}`} color="var(--success)" />
            )}
            <TotalRow label="税抜合計" value={formatCurrency(totals.preTax)} />
            <TotalRow label={`消費税（${estimate.taxRatePercent}%）`} value={formatCurrency(totals.tax)} />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginTop: '12px',
                paddingTop: '12px',
                borderTop: '2px solid var(--accent)',
              }}
            >
              <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)', letterSpacing: '0.04em' }}>
                御見積金額（税込）
              </span>
              <span
                style={{
                  fontSize: '26px',
                  fontWeight: 700,
                  color: 'var(--accent-dark)',
                  letterSpacing: '-0.02em',
                }}
              >
                {formatCurrency(totals.total)}
              </span>
            </div>
          </div>
        </div>

        {/* プランナーコメント・備考 */}
        {(estimate.plannerComment || estimate.notes) && (
          <div
            style={{
              padding: '0 48px 32px',
              display: 'grid',
              gridTemplateColumns: estimate.notes ? '1fr 1fr' : '1fr',
              gap: '20px',
            }}
          >
            {estimate.plannerComment && (
              <div>
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--text-sub)',
                    letterSpacing: '0.1em',
                    marginBottom: '8px',
                  }}
                >
                  プランナーコメント
                </div>
                <div
                  style={{
                    fontSize: '12px',
                    color: 'var(--text)',
                    lineHeight: 1.8,
                    background: 'var(--accent-light)',
                    borderLeft: '3px solid var(--accent)',
                    padding: '12px 16px',
                    borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
                  }}
                >
                  {estimate.plannerComment}
                </div>
              </div>
            )}
            {estimate.notes && (
              <div>
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--text-sub)',
                    letterSpacing: '0.1em',
                    marginBottom: '8px',
                  }}
                >
                  備考
                </div>
                <div
                  style={{
                    fontSize: '12px',
                    color: 'var(--text)',
                    lineHeight: 1.8,
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  {estimate.notes}
                </div>
              </div>
            )}
          </div>
        )}

        {/* フッター */}
        <div
          style={{
            borderTop: '1px solid var(--border)',
            padding: '16px 48px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--bg)',
          }}
        >
          <span style={{ fontSize: '11px', color: 'var(--text-sub)' }}>
            見積番号：{estimate.id}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-sub)' }}>
            最終更新：{estimate.updatedAt}
          </span>
        </div>
      </div>

      {/* PDF 出力モーダル */}
      <Modal isOpen={showPdfModal} onClose={() => setShowPdfModal(false)} title="PDF出力">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div
            style={{
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ fontSize: '12px', color: 'var(--text-sub)' }}>見積書PDFを作成しました</div>
            <div
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--text)',
                wordBreak: 'break-all',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span
                style={{
                  width: '32px',
                  height: '32px',
                  background: 'var(--accent-light)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="2" y="1" width="9" height="12" rx="1" stroke="var(--accent)" strokeWidth="1.2" fill="none" />
                  <path d="M7 1v4h4" stroke="var(--accent)" strokeWidth="1.2" />
                  <path d="M4 8h6M4 10h4" stroke="var(--accent)" strokeWidth="1" />
                </svg>
              </span>
              {filename}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setShowPdfModal(false)}>
              閉じる
            </Button>
            <Button onClick={handleDownload}>
              ダウンロード
            </Button>
          </div>
        </div>
      </Modal>

      {showToast && (
        <Toast
          message={`${filename} のダウンロードを開始しました`}
          type="success"
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: '10px', color: 'var(--text-sub)', letterSpacing: '0.08em', marginBottom: '2px' }}>
        {label}
      </div>
      <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)' }}>{value}</div>
    </div>
  );
}

function TotalRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
      <span style={{ fontSize: '12px', color: 'var(--text-sub)' }}>{label}</span>
      <span style={{ fontSize: '13px', fontWeight: 500, color: color || 'var(--text)' }}>{value}</span>
    </div>
  );
}
