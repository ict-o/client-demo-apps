import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ContractType, InboxFile } from '../types';
import type { AppActions, ContractDraft } from '../App';
import { EmptyState } from '../components/EmptyState';
import { autoFolder, autoTags } from '../utils/domain';
import { formatDateTime, formatYen } from '../utils/format';

interface ContractImportProps {
  inbox: InboxFile[];
  actions: AppActions;
}

const CONTRACT_TYPES: ContractType[] = ['賃貸借契約', '売買契約', '管理受託契約', '工事請負契約', '業務委託契約'];

type Phase = 'select' | 'scanning' | 'confirm';

interface DraftForm extends Omit<ContractDraft, 'rentMonthly' | 'amount'> {
  rentMonthly: string;
  amount: string;
}

export function ContractImport({ inbox, actions }: ContractImportProps) {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>('select');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [draft, setDraft] = useState<DraftForm | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selected = inbox.find(f => f.id === selectedId) ?? null;

  useEffect(() => {
    if (phase !== 'scanning' || !selected) return;
    setProgress(0);
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 100;
        return prev + 10;
      });
    }, 130);
    return () => clearInterval(timer);
  }, [phase, selected]);

  useEffect(() => {
    if (phase !== 'scanning' || progress < 100 || !selected) return;
    const e = selected.extracted;
    setDraft({
      title: e.title,
      counterparty: e.counterparty,
      contractType: e.contractType,
      property: e.property,
      rentMonthly: String(e.rentMonthly),
      amount: String(e.amount),
      startDate: e.startDate,
      endDate: e.endDate,
      autoRenew: e.autoRenew,
    });
    setPhase('confirm');
  }, [phase, progress, selected]);

  const set = <K extends keyof DraftForm>(key: K, value: DraftForm[K]) => {
    setDraft(prev => (prev ? { ...prev, [key]: value } : prev));
    setErrors(prev => (prev[key as string] ? { ...prev, [key as string]: '' } : prev));
  };

  const backToSelect = () => {
    setPhase('select');
    setProgress(0);
    setDraft(null);
    setErrors({});
  };

  const register = () => {
    if (!draft || !selected) return;
    const amountNum = Number(draft.amount.replace(/[^0-9]/g, '')) || 0;
    const rentNum = Number(draft.rentMonthly.replace(/[^0-9]/g, '')) || 0;
    const e: Record<string, string> = {};
    if (draft.title.trim() === '') e.title = '契約件名を入力してください';
    if (draft.counterparty.trim() === '') e.counterparty = '契約相手先企業名を入力してください';
    if (draft.startDate === '') e.startDate = '契約開始日を入力してください';
    if (draft.endDate === '') e.endDate = '契約満了日を入力してください';
    if (draft.startDate !== '' && draft.endDate !== '' && draft.endDate < draft.startDate) {
      e.endDate = '契約満了日は開始日より後の日付を入力してください';
    }
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    const id = actions.registerContract(
      selected.id,
      {
        title: draft.title.trim(),
        counterparty: draft.counterparty.trim(),
        contractType: draft.contractType,
        property: draft.property.trim(),
        rentMonthly: rentNum,
        amount: amountNum,
        startDate: draft.startDate,
        endDate: draft.endDate,
        autoRenew: draft.autoRenew,
      },
      selected.source === '電子契約サービス連携' ? 'esign' : 'scan',
    );
    backToSelect();
    navigate(`/contracts/${id}`);
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">契約書取込（AI項目抽出）</h1>
          <p className="page-sub">
            複合機スキャン・メール添付・電子契約サービスから届いた契約書を取り込み、主要項目を自動で読み取って契約書管理へ登録します。
          </p>
        </div>
        <button className="btn btn-ghost" onClick={() => navigate('/contracts')}>
          契約書管理へ戻る
        </button>
      </div>

      {phase === 'select' && (
        <div className="two-col">
          <section className="card card-pad">
            <div className="section-title">
              <span className="bar" />
              取込待ちのファイル（{inbox.length}件）
            </div>
            {inbox.length === 0 ? (
              <EmptyState
                title="取込待ちのファイルはありません"
                desc="複合機でスキャンした契約書やメール添付の契約書が届くとここに表示されます。"
              />
            ) : (
              <div className="stack gap-10">
                {inbox.map(f => (
                  <button
                    key={f.id}
                    className={`file-card${selectedId === f.id ? ' selected' : ''}`}
                    onClick={() => setSelectedId(f.id)}
                    aria-pressed={selectedId === f.id}
                  >
                    <span className="file-icn" aria-hidden="true">
                      PDF
                    </span>
                    <span style={{ display: 'block', minWidth: 0 }}>
                      <span className="file-name" style={{ display: 'block' }}>
                        {f.fileName}
                      </span>
                      <span className="file-meta" style={{ display: 'block' }}>
                        {f.source}／{f.pages}ページ／受信 {formatDateTime(f.receivedAt)}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="card card-pad">
            <div className="section-title">
              <span className="bar" />
              AI項目抽出
            </div>
            {selected ? (
              <>
                <p className="fs-13 text-sub mb-12">
                  選択中: <strong>{selected.fileName}</strong>
                  <br />
                  契約相手先企業名・契約種別・物件情報・賃料・契約期間を読み取り、確認画面で修正したうえで登録できます。
                </p>
                <button className="btn btn-primary btn-block btn-lg" onClick={() => setPhase('scanning')}>
                  AIで主要項目を抽出する
                </button>
              </>
            ) : (
              <>
                <p className="fs-13 text-sub mb-12">左の一覧から取り込むファイルを選択してください。</p>
                <button className="btn btn-primary btn-block btn-lg" disabled title="先に取込対象のファイルを選択してください">
                  AIで主要項目を抽出する
                </button>
              </>
            )}
          </section>
        </div>
      )}

      {phase === 'scanning' && selected && (
        <section className="card card-pad">
          <div className="section-title">
            <span className="bar" />
            解析中
          </div>
          <p className="fs-13 text-sub mb-12">
            {selected.fileName}（{selected.pages}ページ）から主要項目を読み取っています。
          </p>
          <div className="scan-bar" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="解析の進捗">
            <span style={{ width: `${progress}%` }} />
          </div>
          <p className="fs-13 mt-8">{progress}% 完了</p>
          <button className="btn btn-secondary mt-16" onClick={backToSelect}>
            解析を中止する
          </button>
        </section>
      )}

      {phase === 'confirm' && draft && selected && (
        <div className="two-col">
          <section className="card card-pad">
            <div className="section-title">
              <span className="bar" />
              抽出結果の確認（{selected.fileName}）
            </div>
            <p className="fs-13 text-sub mb-12">
              AIが読み取った内容です。確度の低い項目は色付きで表示されます。必要に応じて修正してから登録してください。
            </p>

            <div className="field">
              <label className="field-label" htmlFor="d-title">
                契約件名<span className="req">必須</span>
              </label>
              <input
                id="d-title"
                className={`input${errors.title ? ' invalid' : ''}`}
                value={draft.title}
                onChange={e => set('title', e.target.value)}
              />
              {errors.title && <span className="field-error">{errors.title}</span>}
            </div>

            <div className="field">
              <label className="field-label" htmlFor="d-cp">
                契約相手先企業名<span className="req">必須</span>
                <Confidence value={selected.confidence.counterparty} />
              </label>
              <input
                id="d-cp"
                className={`input${errors.counterparty ? ' invalid' : ''}`}
                value={draft.counterparty}
                onChange={e => set('counterparty', e.target.value)}
              />
              {errors.counterparty && <span className="field-error">{errors.counterparty}</span>}
            </div>

            <div className="field">
              <label className="field-label" htmlFor="d-type">
                契約種別
                <Confidence value={selected.confidence.contractType} />
              </label>
              <select
                id="d-type"
                className="select"
                value={draft.contractType}
                onChange={e => set('contractType', e.target.value as ContractType)}
              >
                {CONTRACT_TYPES.map(t => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label className="field-label" htmlFor="d-prop">
                物件情報
                <Confidence value={selected.confidence.property} />
              </label>
              <input id="d-prop" className="input" value={draft.property} onChange={e => set('property', e.target.value)} />
            </div>

            <div className="info-grid">
              <div className="field">
                <label className="field-label" htmlFor="d-rent">
                  月額賃料（円）
                  <Confidence value={selected.confidence.rentMonthly} />
                </label>
                <input
                  id="d-rent"
                  className="input"
                  inputMode="numeric"
                  value={draft.rentMonthly}
                  onChange={e => set('rentMonthly', e.target.value)}
                />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="d-amount">
                  契約金額（円）
                  <Confidence value={selected.confidence.amount} />
                </label>
                <input
                  id="d-amount"
                  className="input"
                  inputMode="numeric"
                  value={draft.amount}
                  onChange={e => set('amount', e.target.value)}
                />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="d-start">
                  契約開始日<span className="req">必須</span>
                  <Confidence value={selected.confidence.startDate} />
                </label>
                <input
                  id="d-start"
                  type="date"
                  className={`input${errors.startDate ? ' invalid' : ''}`}
                  value={draft.startDate}
                  onChange={e => set('startDate', e.target.value)}
                />
                {errors.startDate && <span className="field-error">{errors.startDate}</span>}
              </div>
              <div className="field">
                <label className="field-label" htmlFor="d-end">
                  契約満了日<span className="req">必須</span>
                  <Confidence value={selected.confidence.endDate} />
                </label>
                <input
                  id="d-end"
                  type="date"
                  className={`input${errors.endDate ? ' invalid' : ''}`}
                  value={draft.endDate}
                  onChange={e => set('endDate', e.target.value)}
                />
                {errors.endDate && <span className="field-error">{errors.endDate}</span>}
              </div>
            </div>

            <div className="field">
              <label className="field-label" htmlFor="d-renew">
                自動更新
                <Confidence value={selected.confidence.autoRenew} />
              </label>
              <select
                id="d-renew"
                className="select"
                value={draft.autoRenew ? 'yes' : 'no'}
                onChange={e => set('autoRenew', e.target.value === 'yes')}
              >
                <option value="yes">あり</option>
                <option value="no">なし</option>
              </select>
            </div>

            <div className="row gap-10 wrap mt-16">
              <button className="btn btn-primary btn-lg" onClick={register}>
                この内容で契約書を登録する
              </button>
              <button className="btn btn-secondary btn-lg" onClick={backToSelect}>
                取込をやり直す
              </button>
            </div>
          </section>

          <section className="card card-pad">
            <div className="section-title">
              <span className="bar" />
              自動振り分け先（プレビュー）
            </div>
            <p className="fs-13 text-sub mb-12">
              契約相手先企業名と契約内容から保管フォルダとタグを自動で決定します。入力を変更すると即時に反映されます。
            </p>
            <div className="info-item mb-12">
              <div className="k">保管フォルダ</div>
              <div className="v">{autoFolder(draft.counterparty, draft.contractType)}</div>
            </div>
            <div className="row gap-8 wrap">
              <span className="fs-12 text-sub">付与タグ:</span>
              {autoTags(
                draft.contractType,
                draft.property,
                Number(draft.rentMonthly.replace(/[^0-9]/g, '')) || 0,
              ).map(t => (
                <span className="tag" key={t}>
                  {t}
                </span>
              ))}
            </div>
            <div className="divider" />
            <div className="info-item">
              <div className="k">契約金額（確認）</div>
              <div className="v">{formatYen(Number(draft.amount.replace(/[^0-9]/g, '')) || 0)}</div>
            </div>
            <div className="info-item mt-12">
              <div className="k">月額賃料（確認）</div>
              <div className="v">{formatYen(Number(draft.rentMonthly.replace(/[^0-9]/g, '')) || 0)}</div>
            </div>
            <div className="info-item mt-12">
              <div className="k">原本の保管形態</div>
              <div className="v">{selected.source === '電子契約サービス連携' ? '電子契約（電子署名済）' : 'スキャン原本'}</div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function Confidence({ value }: { value: number }) {
  const low = value < 90;
  return (
    <span className={`conf${low ? ' low' : ''}`} style={{ marginLeft: '8px' }}>
      <span className="conf-bar">
        <span style={{ width: `${value}%` }} />
      </span>
      抽出確度 {value}%
    </span>
  );
}
