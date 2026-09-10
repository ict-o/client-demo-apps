import type { DocKind, Partner, Project } from '../types';
import { DOC_KIND_LABELS } from '../types';
import { OWN_COMPANY } from '../data/sampleData';
import { calcTotals, lineAmount } from '../utils/calc';
import { buildArticles, documentNo, partiesOf } from '../utils/docs';
import { formatDate, formatJpDate, formatNumber, formatYen } from '../utils/format';

interface Props {
  project: Project;
  partner: Partner;
  kind: DocKind;
}

/** 画面上で内容を確認できる帳票プレビュー（印刷にも対応） */
export function DocumentPreview({ project, partner, kind }: Props) {
  const totals = calcTotals(project.items, project.discount);
  const { orderer, contractor } = partiesOf(project, partner);
  const doc = project.documents.find(d => d.kind === kind);
  const issuedOn = doc?.issuedOn ?? '';
  const period =
    project.terms.startDate && project.terms.endDate
      ? `${formatDate(project.terms.startDate)} 〜 ${formatDate(project.terms.endDate)}`
      : '未定（契約条件で設定してください）';

  const title = kind === 'terms' ? '基本契約書' : DOC_KIND_LABELS[kind];

  return (
    <div className="doc-sheet">
      <div className="doc-meta">
        <span>書類番号：{doc?.no || documentNo(project, kind)}</span>
        <span>発行日：{issuedOn ? formatJpDate(issuedOn) : '未発行'}</span>
      </div>

      <div className="doc-title">{title}</div>

      {kind === 'quote' && <QuoteBody project={project} partner={partner} totals={totals} period={period} />}
      {(kind === 'order' || kind === 'acceptance') && (
        <OrderBody project={project} kind={kind} totals={totals} period={period} orderer={orderer} contractor={contractor} />
      )}
      {kind === 'terms' && <TermsBody project={project} partner={partner} orderer={orderer} contractor={contractor} />}
    </div>
  );
}

function PartyBlock({
  label,
  name,
  address,
  tel,
  licenseNo,
  seal,
}: {
  label: string;
  name: string;
  address: string;
  tel: string;
  licenseNo?: string;
  seal?: boolean;
}) {
  return (
    <div className="party">
      <div className="row between gap-10" style={{ alignItems: 'flex-start' }}>
        <div style={{ minWidth: 0 }}>
          <div className="party-label">{label}</div>
          <div className="party-name">{name}</div>
          <div className="party-line">{address}</div>
          <div className="party-line">TEL {tel}</div>
          {licenseNo ? <div className="party-line">建設業許可：{licenseNo}</div> : null}
        </div>
        {seal && <span className="seal">記名<br />押印欄</span>}
      </div>
    </div>
  );
}

function QuoteBody({
  project,
  partner,
  totals,
  period,
}: {
  project: Project;
  partner: Partner;
  totals: ReturnType<typeof calcTotals>;
  period: string;
}) {
  const isReceive = project.dealKind === 'receive';
  const addressee = isReceive ? partner.name : `${OWN_COMPANY.name} ${OWN_COMPANY.division}`;
  const issuer = isReceive
    ? { name: `${OWN_COMPANY.name} ${OWN_COMPANY.division}`, address: `〒${OWN_COMPANY.postalCode} ${OWN_COMPANY.address}`, tel: OWN_COMPANY.tel, licenseNo: OWN_COMPANY.licenseNo }
    : { name: partner.name, address: `〒${partner.postalCode} ${partner.address}`, tel: partner.tel, licenseNo: partner.licenseNo };

  return (
    <>
      <div style={{ fontSize: '14px', fontWeight: 700 }}>{addressee} 御中</div>
      <div className="fs-12 text-sub mt-4">下記のとおりお見積り申し上げます。</div>

      <div className="amount-box">お見積金額（税込）&#12288;{formatYen(totals.total)}</div>

      <table className="sheet">
        <tbody>
          <tr><th>工事名</th><td>{project.title}</td></tr>
          <tr><th>工事場所</th><td>{project.site}</td></tr>
          <tr><th>工事内容</th><td>{project.scope}</td></tr>
          <tr><th>工期</th><td>{period}</td></tr>
          <tr><th>見積有効期限</th><td>{formatDate(project.quoteExpiry)}</td></tr>
          <tr><th>支払条件</th><td>{project.terms.paymentMethod || '別途協議'}</td></tr>
        </tbody>
      </table>

      <table className="sheet">
        <thead>
          <tr>
            <th style={{ width: 'auto' }}>工種・品名</th>
            <th style={{ width: '30%' }}>仕様・規格</th>
            <th style={{ width: '9%' }}>数量</th>
            <th style={{ width: '8%' }}>単位</th>
            <th style={{ width: '13%' }}>単価</th>
            <th style={{ width: '14%' }}>金額</th>
          </tr>
        </thead>
        <tbody>
          {project.items.map(item => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td>{item.spec}</td>
              <td className="num">{formatNumber(item.quantity)}</td>
              <td>{item.unit}</td>
              <td className="num">{formatYen(item.unitPrice)}</td>
              <td className="num">{formatYen(lineAmount(item))}</td>
            </tr>
          ))}
          <tr>
            <th colSpan={5} style={{ textAlign: 'right', width: 'auto' }}>小計</th>
            <td className="num">{formatYen(totals.subtotal)}</td>
          </tr>
          {totals.discount > 0 && (
            <tr>
              <th colSpan={5} style={{ textAlign: 'right', width: 'auto' }}>値引</th>
              <td className="num">-{formatYen(totals.discount)}</td>
            </tr>
          )}
          <tr>
            <th colSpan={5} style={{ textAlign: 'right', width: 'auto' }}>消費税（10%）</th>
            <td className="num">{formatYen(totals.tax)}</td>
          </tr>
          <tr>
            <th colSpan={5} style={{ textAlign: 'right', width: 'auto' }}>合計（税込）</th>
            <td className="num" style={{ fontWeight: 700 }}>{formatYen(totals.total)}</td>
          </tr>
        </tbody>
      </table>

      <div className="party-row">
        <PartyBlock label="見積提出者" name={issuer.name} address={issuer.address} tel={issuer.tel} licenseNo={issuer.licenseNo} seal />
      </div>

      <div className="note">
        ※ 本見積書は建設業法第20条に基づき、工事の種別ごとの材料費・労務費等の内訳を明示しています。<br />
        ※ 本見積書の内容は、注文書・注文請書・基本契約書（約款）へ自動的に引き継がれます。
      </div>
    </>
  );
}

function OrderBody({
  project,
  kind,
  totals,
  period,
  orderer,
  contractor,
}: {
  project: Project;
  kind: DocKind;
  totals: ReturnType<typeof calcTotals>;
  period: string;
  orderer: ReturnType<typeof partiesOf>['orderer'];
  contractor: ReturnType<typeof partiesOf>['contractor'];
}) {
  const isOrder = kind === 'order';
  const t = project.terms;
  const addressee = isOrder ? contractor : orderer;
  const issuer = isOrder ? orderer : contractor;

  return (
    <>
      <div style={{ fontSize: '14px', fontWeight: 700 }}>{addressee.name} 御中</div>
      <div className="fs-12 text-sub mt-4">
        {isOrder
          ? '下記のとおり工事を注文します。本注文書は基本契約書（約款）と一体のものとして取り扱います。'
          : '下記のとおりご注文をお請けいたします。本注文請書は基本契約書（約款）と一体のものとして取り扱います。'}
      </div>

      <div className="amount-box">請負代金の額（税込）&#12288;{formatYen(totals.total)}</div>

      <table className="sheet">
        <tbody>
          <tr><th>工事名</th><td>{project.title}</td></tr>
          <tr><th>工事場所</th><td>{project.site}</td></tr>
          <tr><th>工事内容</th><td>{project.scope}</td></tr>
          <tr><th>工期</th><td>{period}</td></tr>
          <tr><th>施工しない日</th><td>{t.nonWorkingDays || '（未設定）'}</td></tr>
          <tr><th>請負代金の内訳</th><td>工事代金 {formatYen(totals.taxable)}／消費税等 {formatYen(totals.tax)}</td></tr>
          <tr><th>前金払・出来形払</th><td>{t.advancePayment || '（未設定）'}</td></tr>
          <tr><th>完成検査・引渡し</th><td>{[t.inspection, t.handover].filter(Boolean).join('／') || '（未設定）'}</td></tr>
          <tr><th>代金の支払</th><td>{t.paymentMethod || '（未設定）'}</td></tr>
          <tr><th>契約不適合責任</th><td>{t.defectLiability || '（未設定）'}</td></tr>
          <tr><th>関連書類</th><td>見積書 {documentNo(project, 'quote')}／基本契約書（約款）{documentNo(project, 'terms')}</td></tr>
        </tbody>
      </table>

      <div className="party-row">
        <PartyBlock
          label={issuer.label}
          name={issuer.name}
          address={issuer.address}
          tel={issuer.tel}
          licenseNo={issuer.licenseNo}
          seal
        />
        <PartyBlock label={addressee.label} name={addressee.name} address={addressee.address} tel={addressee.tel} licenseNo={addressee.licenseNo} seal />
      </div>

      <div className="note">
        ※ 収入印紙の要否は請負代金の額に応じて判定してください（本デモでは印紙欄の表示のみ）。<br />
        ※ 記載事項は建設業法第19条第1項各号に対応しています。未設定項目がある場合は「契約条件」タブで入力してください。
      </div>
    </>
  );
}

function TermsBody({
  project,
  partner,
  orderer,
  contractor,
}: {
  project: Project;
  partner: Partner;
  orderer: ReturnType<typeof partiesOf>['orderer'];
  contractor: ReturnType<typeof partiesOf>['contractor'];
}) {
  const articles = buildArticles(project, partner);
  return (
    <>
      <div className="fs-12 text-sub">
        {orderer.name}（甲）と {contractor.name}（乙）は、{project.title} について次のとおり基本契約を締結する。
      </div>

      <div className="mt-16">
        {articles.map(a => (
          <div className="article" key={a.no}>
            <div className="art-head">{a.no}（{a.title}）</div>
            <div className="art-body">{a.body}</div>
          </div>
        ))}
      </div>

      <div className="party-row">
        <PartyBlock label={orderer.label} name={orderer.name} address={orderer.address} tel={orderer.tel} licenseNo={orderer.licenseNo} seal />
        <PartyBlock label={contractor.label} name={contractor.name} address={contractor.address} tel={contractor.tel} licenseNo={contractor.licenseNo} seal />
      </div>

      <div className="note">
        ※ 本約款は見積書・注文書・注文請書と一体で保管され、書類一式として出力されます。
      </div>
    </>
  );
}
