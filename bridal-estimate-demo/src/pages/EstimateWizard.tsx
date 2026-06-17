import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Estimate, WizardFormData } from '../types';
import {
  SEASONS, DAYS_OF_WEEK, TIME_SLOTS, VENUES, CEREMONY_TYPES, OPTION_CATEGORIES
} from '../types';
import { initialEstimate } from '../data/sampleData';
import { Button } from '../components/Button';
import { FormField, Input, Select } from '../components/FormField';

const TOTAL_STEPS = 3;

const defaultForm: WizardFormData = {
  customerName: '',
  weddingDate: '',
  preferredSeason: '',
  preferredDayOfWeek: '',
  preferredTimeSlot: '',
  venue: '',
  ceremonyType: '',
  adultCount: 70,
  childCount: 5,
  budget: 3500000,
  selectedOptions: ['food', 'drink', 'flower', 'costume', 'photo', 'video'],
};

interface Props {
  onCreated: (estimate: Estimate) => void;
}

export function EstimateWizard({ onCreated }: Props) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<WizardFormData>(defaultForm);
  const [errors, setErrors] = useState<Partial<Record<keyof WizardFormData, string>>>({});

  function set<K extends keyof WizardFormData>(key: K, value: WizardFormData[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: undefined }));
    }
  }

  function validateStep(s: number): boolean {
    const newErrors: typeof errors = {};
    if (s === 1) {
      if (!form.customerName.trim()) newErrors.customerName = '顧客名を入力してください';
      if (!form.weddingDate) newErrors.weddingDate = '挙式予定日を選択してください';
    }
    if (s === 2) {
      if (!form.venue) newErrors.venue = '会場を選択してください';
      if (!form.ceremonyType) newErrors.ceremonyType = '挙式形式を選択してください';
      if (form.adultCount < 1) newErrors.adultCount = '大人人数は1名以上入力してください';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function next() {
    if (validateStep(step)) {
      setStep(s => Math.min(s + 1, TOTAL_STEPS));
    }
  }

  function back() {
    setStep(s => Math.max(s - 1, 1));
  }

  function complete() {
    if (!validateStep(step)) return;
    const newEstimate: Estimate = {
      ...initialEstimate,
      id: `EST-${Date.now()}`,
      customerName: form.customerName,
      weddingDate: form.weddingDate,
      preferredSeason: form.preferredSeason,
      preferredDayOfWeek: form.preferredDayOfWeek,
      preferredTimeSlot: form.preferredTimeSlot,
      venue: form.venue,
      ceremonyType: form.ceremonyType,
      adultCount: form.adultCount,
      childCount: form.childCount,
      budget: form.budget,
      status: 'draft',
      updatedAt: new Date().toISOString().slice(0, 10),
    };
    onCreated(newEstimate);
    navigate('/edit');
  }

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
          &larr; 見積一覧に戻る
        </Button>
        <h1 style={{ fontSize: '22px', fontWeight: 700, marginTop: '16px', letterSpacing: '-0.02em' }}>
          新規見積作成
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-sub)', marginTop: '4px' }}>
          お客様の情報・ご希望をご入力ください
        </p>
      </div>

      <StepBar current={step} total={TOTAL_STEPS} />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 320px',
          gap: '24px',
          marginTop: '32px',
          alignItems: 'start',
        }}
      >
        <div
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-sm)',
            padding: '32px',
          }}
        >
          {step === 1 && <StepOne form={form} errors={errors} set={set} />}
          {step === 2 && <StepTwo form={form} errors={errors} set={set} />}
          {step === 3 && <StepThree form={form} set={set} />}

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '36px',
              paddingTop: '24px',
              borderTop: '1px solid var(--border)',
            }}
          >
            <Button variant="secondary" onClick={back} disabled={step === 1}>
              &larr; 戻る
            </Button>
            {step < TOTAL_STEPS ? (
              <Button onClick={next}>次へ &rarr;</Button>
            ) : (
              <Button onClick={complete}>見積編集へ進む &rarr;</Button>
            )}
          </div>
        </div>

        <WizardSummary form={form} currentStep={step} />
      </div>
    </div>
  );
}

function StepBar({ current, total }: { current: number; total: number }) {
  const labels = ['基本情報', '会場・人数', 'オプション'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
      {labels.map((label, i) => {
        const num = i + 1;
        const done = num < current;
        const active = num === current;
        return (
          <React.Fragment key={num}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '13px',
                  fontWeight: 700,
                  background: done ? 'var(--accent)' : active ? 'var(--accent)' : 'var(--border)',
                  color: done || active ? '#fff' : 'var(--text-sub)',
                  transition: 'background 0.2s',
                }}
              >
                {done ? '✓' : num}
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: active ? 600 : 400,
                  color: active ? 'var(--accent-dark)' : 'var(--text-sub)',
                  letterSpacing: '0.04em',
                }}
              >
                {label}
              </span>
            </div>
            {i < total - 1 && (
              <div
                style={{
                  flex: 1,
                  height: '1px',
                  background: done ? 'var(--accent)' : 'var(--border)',
                  margin: '0 8px',
                  marginBottom: '20px',
                  transition: 'background 0.2s',
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

type SetFn = <K extends keyof WizardFormData>(key: K, value: WizardFormData[K]) => void;

function StepOne({
  form,
  errors,
  set,
}: {
  form: WizardFormData;
  errors: Partial<Record<keyof WizardFormData, string>>;
  set: SetFn;
}) {
  return (
    <div>
      <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '24px' }}>Step 1 — 基本情報</h2>
      <div style={{ display: 'grid', gap: '20px' }}>
        <FormField label="顧客名" required error={errors.customerName}>
          <Input
            value={form.customerName}
            onChange={e => set('customerName', e.target.value)}
            placeholder="例：山田 太郎様・花子様"
            hasError={!!errors.customerName}
          />
        </FormField>
        <FormField label="挙式予定日" required error={errors.weddingDate}>
          <Input
            type="date"
            value={form.weddingDate}
            onChange={e => set('weddingDate', e.target.value)}
            hasError={!!errors.weddingDate}
          />
        </FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
          <FormField label="希望時期">
            <Select value={form.preferredSeason} onChange={e => set('preferredSeason', e.target.value)}>
              <option value="">選択してください</option>
              {SEASONS.map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
          </FormField>
          <FormField label="希望曜日">
            <Select value={form.preferredDayOfWeek} onChange={e => set('preferredDayOfWeek', e.target.value)}>
              <option value="">選択してください</option>
              {DAYS_OF_WEEK.map(d => <option key={d} value={d}>{d}</option>)}
            </Select>
          </FormField>
          <FormField label="希望時間帯">
            <Select value={form.preferredTimeSlot} onChange={e => set('preferredTimeSlot', e.target.value)}>
              <option value="">選択してください</option>
              {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
            </Select>
          </FormField>
        </div>
        <FormField label="希望予算" hint="概算でかまいません">
          <Input
            type="number"
            value={form.budget}
            onChange={e => set('budget', Number(e.target.value))}
            min={0}
            step={100000}
          />
        </FormField>
      </div>
    </div>
  );
}

function StepTwo({
  form,
  errors,
  set,
}: {
  form: WizardFormData;
  errors: Partial<Record<keyof WizardFormData, string>>;
  set: SetFn;
}) {
  return (
    <div>
      <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '24px' }}>Step 2 — 会場・人数</h2>
      <div style={{ display: 'grid', gap: '20px' }}>
        <FormField label="会場" required error={errors.venue}>
          <Select
            value={form.venue}
            onChange={e => set('venue', e.target.value)}
            hasError={!!errors.venue}
          >
            <option value="">選択してください</option>
            {VENUES.map(v => <option key={v} value={v}>{v}</option>)}
          </Select>
        </FormField>
        <FormField label="挙式形式" required error={errors.ceremonyType}>
          <Select
            value={form.ceremonyType}
            onChange={e => set('ceremonyType', e.target.value)}
            hasError={!!errors.ceremonyType}
          >
            <option value="">選択してください</option>
            {CEREMONY_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
          </Select>
        </FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <FormField label="大人人数" required error={errors.adultCount as string | undefined}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Input
                type="number"
                value={form.adultCount}
                onChange={e => set('adultCount', Number(e.target.value))}
                min={1}
                style={{ flex: 1 }}
              />
              <span style={{ fontSize: '13px', color: 'var(--text-sub)', whiteSpace: 'nowrap' }}>名</span>
            </div>
          </FormField>
          <FormField label="子供人数">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Input
                type="number"
                value={form.childCount}
                onChange={e => set('childCount', Number(e.target.value))}
                min={0}
                style={{ flex: 1 }}
              />
              <span style={{ fontSize: '13px', color: 'var(--text-sub)', whiteSpace: 'nowrap' }}>名</span>
            </div>
          </FormField>
        </div>
      </div>
    </div>
  );
}

function StepThree({ form, set }: { form: WizardFormData; set: SetFn }) {
  function toggleOption(id: string) {
    const current = form.selectedOptions;
    if (current.includes(id)) {
      set('selectedOptions', current.filter(o => o !== id));
    } else {
      set('selectedOptions', [...current, id]);
    }
  }

  return (
    <div>
      <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>Step 3 — 主要オプション</h2>
      <p style={{ fontSize: '13px', color: 'var(--text-sub)', marginBottom: '24px' }}>
        含める主要オプションを選択してください（後から明細で詳細調整できます）
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {OPTION_CATEGORIES.map(opt => {
          const selected = form.selectedOptions.includes(opt.id);
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => toggleOption(opt.id)}
              style={{
                padding: '16px 20px',
                borderRadius: 'var(--radius-md)',
                border: `1.5px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
                background: selected ? 'var(--accent-light)' : 'var(--card)',
                color: selected ? 'var(--accent-dark)' : 'var(--text-sub)',
                fontSize: '14px',
                fontWeight: selected ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.15s',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <span
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  border: `1.5px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
                  background: selected ? 'var(--accent)' : 'transparent',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  fontSize: '11px',
                  color: '#fff',
                  fontWeight: 700,
                }}
              >
                {selected ? '✓' : ''}
              </span>
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WizardSummary({ form, currentStep }: { form: WizardFormData; currentStep: number }) {
  const show = (val: string | number | undefined): string => val != null && val !== '' ? String(val) : '—';

  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        padding: '24px',
        position: 'sticky',
        top: '80px',
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
        入力内容サマリー
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <SummaryItem label="顧客名" value={show(form.customerName)} highlight={currentStep === 1} />
        <SummaryItem label="挙式予定日" value={show(form.weddingDate)} highlight={currentStep === 1} />
        <SummaryItem label="希望時期" value={show(form.preferredSeason)} highlight={currentStep === 1} />
        <SummaryItem label="希望曜日" value={show(form.preferredDayOfWeek)} highlight={currentStep === 1} />
        <SummaryItem label="会場" value={show(form.venue)} highlight={currentStep === 2} />
        <SummaryItem label="挙式形式" value={show(form.ceremonyType)} highlight={currentStep === 2} />
        <SummaryItem
          label="人数"
          value={form.adultCount || form.childCount ? `大人${form.adultCount}名・子供${form.childCount}名` : '—'}
          highlight={currentStep === 2}
        />
        <SummaryItem
          label="希望予算"
          value={form.budget ? `¥${form.budget.toLocaleString()}` : '—'}
          highlight={currentStep === 1}
        />
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px', marginTop: '4px' }}>
          <SummaryItem
            label="選択オプション数"
            value={`${form.selectedOptions.length}項目`}
            highlight={currentStep === 3}
          />
        </div>
      </div>
    </div>
  );
}

function SummaryItem({ label, value, highlight }: { label: string; value: string; highlight: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        padding: '6px 8px',
        borderRadius: 'var(--radius-sm)',
        background: highlight ? 'var(--accent-light)' : 'transparent',
        transition: 'background 0.2s',
      }}
    >
      <span style={{ fontSize: '10px', color: 'var(--text-sub)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {label}
      </span>
      <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)' }}>{value}</span>
    </div>
  );
}
