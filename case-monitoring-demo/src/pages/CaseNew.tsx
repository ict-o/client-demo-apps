import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AppActions } from '../App';
import { todayIso } from '../utils/format';

const STAFF = ['佐藤 健太', '鈴木 美咲', '田村 一輝', '岡田 里奈', '小林 拓也'];
const DEPARTMENTS = ['営業一課', '営業二課'];

interface Errors {
  title?: string;
  client?: string;
  amount?: string;
  dueDate?: string;
}

export function CaseNew({ actions }: { actions: AppActions }) {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [client, setClient] = useState('');
  const [owner, setOwner] = useState(STAFF[0]);
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [errors, setErrors] = useState<Errors>({});

  const validate = (): Errors => {
    const e: Errors = {};
    if (!title.trim()) e.title = '案件名を入力してください';
    if (!client.trim()) e.client = '顧客名を入力してください';
    const amt = Number(amount.replace(/,/g, ''));
    if (!amount.trim()) e.amount = '受注金額を入力してください';
    else if (!Number.isFinite(amt) || amt <= 0) e.amount = '受注金額は正の数値で入力してください';
    if (!dueDate) e.dueDate = '完了期限を選択してください';
    else if (dueDate <= todayIso()) e.dueDate = '完了期限は明日以降の日付を選択してください';
    return e;
  };

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    const id = actions.addCase({
      title: title.trim(),
      client: client.trim(),
      owner,
      department,
      amount: Number(amount.replace(/,/g, '')),
      dueDate,
    });
    navigate(`/cases/${id}`);
  };

  return (
    <div style={{ maxWidth: '680px' }}>
      <button className="btn btn-ghost btn-sm mb-16" onClick={() => navigate('/cases')}>‹ 案件一覧へ戻る</button>
      <div className="page-head">
        <div>
          <div className="page-title">新規案件登録</div>
          <div className="page-sub">受注案件を登録すると、標準の確認事項が自動で設定され監視が開始されます</div>
        </div>
      </div>

      <form className="card card-pad" onSubmit={submit} noValidate>
        <div className="field">
          <label className="field-label" htmlFor="f-title">案件名<span className="req">必須</span></label>
          <input id="f-title" className={`input ${errors.title ? 'invalid' : ''}`} value={title}
            onChange={e => setTitle(e.target.value)} placeholder="例：基幹システム更改支援" />
          {errors.title && <span className="field-error">{errors.title}</span>}
        </div>

        <div className="field">
          <label className="field-label" htmlFor="f-client">顧客名<span className="req">必須</span></label>
          <input id="f-client" className={`input ${errors.client ? 'invalid' : ''}`} value={client}
            onChange={e => setClient(e.target.value)} placeholder="例：青葉テクノ工業株式会社" />
          {errors.client && <span className="field-error">{errors.client}</span>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <div className="field">
            <label className="field-label" htmlFor="f-owner">主担当</label>
            <select id="f-owner" className="select" value={owner} onChange={e => setOwner(e.target.value)}>
              {STAFF.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="field">
            <label className="field-label" htmlFor="f-dept">担当部署</label>
            <select id="f-dept" className="select" value={department} onChange={e => setDepartment(e.target.value)}>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <div className="field">
            <label className="field-label" htmlFor="f-amount">受注金額（円）<span className="req">必須</span></label>
            <input id="f-amount" className={`input ${errors.amount ? 'invalid' : ''}`} inputMode="numeric"
              value={amount} onChange={e => setAmount(e.target.value)} placeholder="例：3000000" />
            {errors.amount && <span className="field-error">{errors.amount}</span>}
          </div>
          <div className="field">
            <label className="field-label" htmlFor="f-due">完了期限<span className="req">必須</span></label>
            <input id="f-due" type="date" className={`input ${errors.dueDate ? 'invalid' : ''}`} min={todayIso()}
              value={dueDate} onChange={e => setDueDate(e.target.value)} />
            {errors.dueDate && <span className="field-error">{errors.dueDate}</span>}
          </div>
        </div>

        <div className="fs-12 text-sub" style={{ background: 'var(--accent-soft)', borderRadius: 'var(--radius-md)', padding: '11px 14px', marginBottom: '16px' }}>
          登録時に「契約書締結・着手金入金確認・要件確定・中間進捗報告・納品検収・請求書発行」の6つの確認事項が期限つきで自動設定されます。
        </div>

        <div className="row gap-10">
          <button type="submit" className="btn btn-primary btn-lg">登録して監視を開始</button>
          <button type="button" className="btn btn-ghost" onClick={() => navigate('/cases')}>キャンセル</button>
        </div>
      </form>
    </div>
  );
}
