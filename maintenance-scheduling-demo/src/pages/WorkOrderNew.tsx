import { useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { WorkOrder, WorkType, CandidateSlot } from '../types';
import { WORK_TYPES, TIME_SLOTS } from '../types';
import {
  CUSTOMER_MASTERS,
  PARTNER_MASTERS,
  COMPANY_STAFF,
  createTasks,
  DEMO_COMPANY_USER,
} from '../data/sampleData';
import { nowIso, todayIso, formatDate } from '../utils/format';

interface Props {
  onCreate: (order: WorkOrder) => void;
}

// 新規作業番号の採番（デモのためメモリ内カウンタ。既存サンプルの最大が 0144）
let nextSeq = 145;
function nextWorkId() {
  const id = `WO-2026-${String(nextSeq).padStart(4, '0')}`;
  nextSeq += 1;
  return id;
}

interface DraftSlot {
  date: string;
  timeSlot: string;
}

export function WorkOrderNew({ onCreate }: Props) {
  const navigate = useNavigate();

  const [customer, setCustomer] = useState('');
  const [facility, setFacility] = useState('');
  const [location, setLocation] = useState('');
  const [workType, setWorkType] = useState<WorkType | ''>('');
  const [partner, setPartner] = useState('');
  const [staff, setStaff] = useState(DEMO_COMPANY_USER.name);
  const [note, setNote] = useState('');
  const [slots, setSlots] = useState<DraftSlot[]>([
    { date: '', timeSlot: TIME_SLOTS[0] },
    { date: '', timeSlot: TIME_SLOTS[0] },
  ]);
  const [submitted, setSubmitted] = useState(false);

  const facilities = useMemo(
    () => CUSTOMER_MASTERS.find(c => c.company === customer)?.facilities ?? [],
    [customer],
  );
  const locations = useMemo(
    () => facilities.find(f => f.name === facility)?.locations ?? [],
    [facilities, facility],
  );

  const filledSlots = slots.filter(s => s.date);
  const errors = {
    customer: !customer,
    facility: !facility,
    location: !location,
    workType: !workType,
    partner: !partner,
    staff: !staff,
  };
  const hasError = Object.values(errors).some(Boolean);

  function onCustomerChange(v: string) {
    setCustomer(v);
    setFacility('');
    setLocation('');
  }
  function onFacilityChange(v: string) {
    setFacility(v);
    setLocation('');
  }

  function updateSlot(i: number, patch: Partial<DraftSlot>) {
    setSlots(prev => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }
  function addSlot() {
    if (slots.length >= 4) return;
    setSlots(prev => [...prev, { date: '', timeSlot: TIME_SLOTS[0] }]);
  }
  function removeSlot(i: number) {
    setSlots(prev => (prev.length <= 1 ? prev : prev.filter((_, idx) => idx !== i)));
  }

  function handleSubmit() {
    setSubmitted(true);
    if (hasError || !workType) return;

    const id = nextWorkId();
    const candidates: CandidateSlot[] = filledSlots.map((s, i) => ({
      id: `${id}-c${i + 1}`,
      date: s.date,
      timeSlot: s.timeSlot,
      response: 'pending',
    }));

    const history = [
      {
        id: `${id}-h1`,
        at: nowIso(),
        actorRole: 'company' as const,
        actorName: staff,
        action: candidates.length > 0 ? '作業予定を登録しました' : '作業予定を登録しました（候補日は調整中）',
      },
    ];
    if (candidates.length > 0) {
      history.push({
        id: `${id}-h2`,
        at: nowIso(),
        actorRole: 'company' as const,
        actorName: staff,
        action: `候補日を${candidates.length}件提示し、顧客へ回答を依頼しました`,
      });
    }

    const order: WorkOrder = {
      id,
      customerCompany: customer,
      facility,
      location,
      workType,
      companyStaff: staff,
      partnerCompany: partner,
      partnerStaff: PARTNER_MASTERS.find(p => p.company === partner)?.staff ?? '',
      createdAt: todayIso(),
      desiredNote: note.trim(),
      status: candidates.length > 0 ? 'proposed' : 'draft',
      candidates,
      tasks: createTasks(id, workType),
      report: { summary: '', result: '', nextAdvice: '', photos: [] },
      history,
    };

    onCreate(order);
    navigate(`/order/${id}`);
  }

  return (
    <div style={{ maxWidth: 760 }}>
      <div className="page-head">
        <div>
          <div className="page-title">新規作業の登録</div>
          <div className="page-sub">作業内容と担当を登録し、顧客へ提示する候補日を設定します。</div>
        </div>
        <button className="btn btn-ghost" onClick={() => navigate('/')}>← 一覧へ戻る</button>
      </div>

      <div className="card card-pad">
        <div className="section-title"><span className="bar" />作業内容</div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
          <Field label="顧客企業" required error={submitted && errors.customer ? '顧客企業を選択してください' : ''}>
            <select className={`select ${submitted && errors.customer ? 'invalid' : ''}`} value={customer} onChange={e => onCustomerChange(e.target.value)}>
              <option value="">選択してください</option>
              {CUSTOMER_MASTERS.map(c => <option key={c.company} value={c.company}>{c.company}</option>)}
            </select>
          </Field>

          <Field label="作業種別" required error={submitted && errors.workType ? '作業種別を選択してください' : ''}>
            <select className={`select ${submitted && errors.workType ? 'invalid' : ''}`} value={workType} onChange={e => setWorkType(e.target.value as WorkType)}>
              <option value="">選択してください</option>
              {WORK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>

          <Field label="対象施設・建物" required error={submitted && errors.facility ? '施設を選択してください' : ''}>
            <select className={`select ${submitted && errors.facility ? 'invalid' : ''}`} value={facility} onChange={e => onFacilityChange(e.target.value)} disabled={!customer}>
              <option value="">{customer ? '選択してください' : '先に顧客企業を選択'}</option>
              {facilities.map(f => <option key={f.name} value={f.name}>{f.name}</option>)}
            </select>
          </Field>

          <Field label="作業場所" required error={submitted && errors.location ? '作業場所を選択してください' : ''}>
            <select className={`select ${submitted && errors.location ? 'invalid' : ''}`} value={location} onChange={e => setLocation(e.target.value)} disabled={!facility}>
              <option value="">{facility ? '選択してください' : '先に施設を選択'}</option>
              {locations.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </Field>

          <Field label="協力業者" required error={submitted && errors.partner ? '協力業者を選択してください' : ''}>
            <select className={`select ${submitted && errors.partner ? 'invalid' : ''}`} value={partner} onChange={e => setPartner(e.target.value)}>
              <option value="">選択してください</option>
              {PARTNER_MASTERS.map(p => <option key={p.company} value={p.company}>{p.company}（{p.staff}）</option>)}
            </select>
          </Field>

          <Field label="当社担当者" required error={submitted && errors.staff ? '担当者を選択してください' : ''}>
            <select className={`select ${submitted && errors.staff ? 'invalid' : ''}`} value={staff} onChange={e => setStaff(e.target.value)}>
              {COMPANY_STAFF.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
        </div>

        <Field label="顧客の希望・特記事項">
          <textarea
            className="textarea"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="例）診療時間外での実施を希望。共用部は患者様導線を確保のこと。"
          />
        </Field>

        <div className="divider" />

        <div className="section-title"><span className="bar" />候補日の提示</div>
        <p className="fs-12 text-sub mb-12">
          顧客に提示する候補日を設定します（最大4件）。1件以上入力すると「候補日提示中」として登録され、顧客が各候補日にOK／NGで回答できます。空のまま登録すると「予定登録（候補日調整中）」になります。
        </p>

        <div className="stack gap-10">
          {slots.map((s, i) => (
            <div key={i} className="row gap-10" style={{ alignItems: 'flex-start' }}>
              <span className="tag" style={{ marginTop: 10 }}>第{i + 1}候補</span>
              <div className="grow">
                <input
                  className="input"
                  type="date"
                  min={todayIso()}
                  value={s.date}
                  onChange={e => updateSlot(i, { date: e.target.value })}
                  aria-label={`第${i + 1}候補 日付`}
                />
              </div>
              <div style={{ width: 190 }}>
                <select className="select" value={s.timeSlot} onChange={e => updateSlot(i, { timeSlot: e.target.value })} aria-label={`第${i + 1}候補 時間帯`}>
                  {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => removeSlot(i)}
                disabled={slots.length <= 1}
                aria-label={`第${i + 1}候補を削除`}
                style={{ marginTop: 3 }}
              >
                削除
              </button>
            </div>
          ))}
        </div>

        <button className="btn btn-secondary btn-sm mt-12" onClick={addSlot} disabled={slots.length >= 4}>
          ＋ 候補日を追加
        </button>

        {filledSlots.length > 0 && (
          <div className="mt-16" style={{ background: 'var(--accent-soft)', borderRadius: 'var(--radius-md)', padding: '12px 14px' }}>
            <div className="fs-12 fw-600 text-sub mb-8">提示する候補日</div>
            <div className="stack gap-6">
              {filledSlots.map((s, i) => (
                <div key={i} className="fs-13">・{formatDate(s.date)} {s.timeSlot}</div>
              ))}
            </div>
          </div>
        )}

        <div className="divider" />

        <div className="row gap-10" style={{ justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/')}>キャンセル</button>
          <button className="btn btn-primary" onClick={handleSubmit}>
            この内容で登録する
          </button>
        </div>
        {submitted && hasError && (
          <div className="field-error" style={{ textAlign: 'right' }}>未入力の必須項目があります。ご確認ください。</div>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="field">
      <label className="field-label">
        {label}
        {required && <span className="req">必須</span>}
      </label>
      {children}
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}
