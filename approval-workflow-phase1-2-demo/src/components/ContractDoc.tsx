import type React from 'react';
import type { SignField, Signer } from '../types';
import { formatDate, formatDateTime, formatYen } from '../utils/format';
import { signatureFontCss } from '../utils/esign';
import type { SignatureFontId } from '../utils/esign';

export interface DocInfo {
  code?: string;
  contractType: string;
  title: string;
  counterparty: string;
  company: string;
  property: string;
  amount: number;
  rentMonthly: number;
  startDate: string;
  endDate: string;
}

interface ContractDocProps {
  doc: DocInfo;
  fields: SignField[];
  signers: Signer[];
  /** 書類上をクリックして署名欄を配置するモード（配置画面でのみ使用） */
  onPlace?: (x: number, y: number) => void;
  /** 配置済みの署名欄を取り消す */
  onRemoveField?: (fieldId: string) => void;
  /** 配置対象として選択中の署名者 */
  placingSignerId?: string;
  /** 署名欄に使う書体 */
  fontId?: SignatureFontId;
  /** 締結済の表示（電子署名済スタンプを出す） */
  completed?: boolean;
}

/**
 * 契約書のプレビュー。署名欄は書類上の座標（%）に重ねて表示する。
 * デモ用の簡易レイアウトで、実際の契約書様式は導入時に定義する。
 */
export function ContractDoc({
  doc,
  fields,
  signers,
  onPlace,
  onRemoveField,
  placingSignerId,
  fontId = 'brush',
  completed = false,
}: ContractDocProps) {
  const signerOf = (id: string) => signers.find(s => s.id === id);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onPlace) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    onPlace(Math.min(Math.max(x, 2), 78), Math.min(Math.max(y, 4), 92));
  };

  return (
    <div
      className={`doc-paper${onPlace ? ' placing' : ''}`}
      onClick={handleClick}
      role={onPlace ? 'button' : undefined}
      aria-label={onPlace ? '書類をクリックして署名欄を配置する' : undefined}
    >
      <div className="doc-title">{doc.contractType}書</div>
      <div className="doc-code">{doc.code ?? doc.title}</div>

      <dl className="doc-terms">
        <dt>甲（貸主・委託者）</dt>
        <dd>{doc.company}</dd>
        <dt>乙（借主・受託者）</dt>
        <dd>{doc.counterparty}</dd>
        <dt>対象物件</dt>
        <dd>{doc.property !== '' ? doc.property : '—'}</dd>
        <dt>契約金額</dt>
        <dd>{formatYen(doc.amount)}</dd>
        <dt>月額賃料</dt>
        <dd>{doc.rentMonthly > 0 ? formatYen(doc.rentMonthly) : '—'}</dd>
        <dt>契約期間</dt>
        <dd>
          {doc.startDate ? formatDate(doc.startDate) : '—'} 〜 {doc.endDate ? formatDate(doc.endDate) : '—'}
        </dd>
      </dl>

      <p className="doc-body">
        甲および乙は、上記の内容により{doc.contractType}を締結し、その成立を証するため本書を電磁的記録により作成し、
        それぞれ電子署名を行うものとする。
      </p>

      {completed && (
        <div className="doc-completed-mark" aria-hidden="true">
          電子署名済
        </div>
      )}

      {fields.map(f => {
        const signer = signerOf(f.signerId);
        const signed = f.value !== undefined && f.value !== '';
        return (
          <div
            key={f.id}
            className={`doc-field${signed ? ' signed' : ''}${f.kind === 'date' ? ' date' : ''}`}
            style={{ left: `${f.x}%`, top: `${f.y}%` }}
          >
            <span className="doc-field-label">
              {signer?.side === 'internal' ? '甲' : '乙'}　{f.kind === 'sign' ? '署名欄' : '署名日'}
            </span>
            {signed ? (
              <span
                className="doc-field-value"
                style={f.kind === 'sign' ? { fontFamily: signatureFontCss(fontId) } : undefined}
              >
                {f.value}
              </span>
            ) : (
              <span className="doc-field-empty">{signer ? signer.name : '署名者未設定'}</span>
            )}
            {onRemoveField && (
              <button
                type="button"
                className="doc-field-remove"
                aria-label={`${signer?.name ?? ''}の${f.kind === 'sign' ? '署名欄' : '署名日欄'}の配置を取り消す`}
                onClick={e => {
                  e.stopPropagation();
                  onRemoveField(f.id);
                }}
              >
                ×
              </button>
            )}
          </div>
        );
      })}

      {onPlace && placingSignerId && (
        <div className="doc-place-hint">
          書類上をクリックすると、{signerOf(placingSignerId)?.name} さんの欄を配置します
        </div>
      )}
    </div>
  );
}

/** 署名済の署名者を一覧で示す小さな帯（詳細画面・証明書で共用） */
export function SignatureSummary({ signers, fontId = 'brush' }: { signers: Signer[]; fontId?: SignatureFontId }) {
  return (
    <div className="sign-summary">
      {signers.map(s => (
        <div className="sign-summary-item" key={s.id}>
          <div className="sign-summary-role">{s.side === 'internal' ? '甲（当社）' : '乙（相手先）'}</div>
          <div className="sign-summary-name" style={{ fontFamily: signatureFontCss(fontId) }}>
            {s.signatureName ?? s.name}
          </div>
          <div className="sign-summary-meta">
            {s.company}　{s.title}
          </div>
          <div className="sign-summary-meta">
            {s.signedAt ? `署名日時: ${formatDateTime(s.signedAt)}` : '未署名'}
          </div>
        </div>
      ))}
    </div>
  );
}
