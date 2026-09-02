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
  /** 署名欄に使う書体 */
  fontId?: SignatureFontId;
  /** 締結済の表示（電子署名済スタンプを出す） */
  completed?: boolean;
}

/**
 * 契約書のプレビュー。署名欄は書類末尾の標準レイアウトに表示する。
 * デモ用の簡易レイアウトで、実際の契約書様式は導入時に定義する。
 */
export function ContractDoc({ doc, fields, signers, fontId = 'brush', completed = false }: ContractDocProps) {
  const ordered = [...signers].sort((a, b) => a.order - b.order);

  return (
    <div className="doc-paper">
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

      <div className="doc-sign-area">
        {ordered.map(s => {
          const sign = fields.find(f => f.signerId === s.id && f.kind === 'sign');
          const date = fields.find(f => f.signerId === s.id && f.kind === 'date');
          const signed = sign?.value !== undefined && sign.value !== '';
          return (
            <div className={`doc-sign-block${signed ? ' signed' : ''}`} key={s.id}>
              <div className="doc-field-label">
                {s.side === 'internal' ? '甲' : '乙'}　{s.company}
              </div>
              <div className="doc-sign-line">
                {signed ? (
                  <span className="doc-field-value" style={{ fontFamily: signatureFontCss(fontId) }}>
                    {sign?.value}
                  </span>
                ) : (
                  <span className="doc-field-empty">{s.name}（署名欄）</span>
                )}
              </div>
              <div className="doc-sign-date">
                署名日: {date?.value !== undefined && date.value !== '' ? date.value : '—'}
              </div>
            </div>
          );
        })}
      </div>
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
