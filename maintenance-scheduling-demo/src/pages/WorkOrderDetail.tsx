import { useState, type ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Role, WorkOrder, CandidateSlot } from '../types';
import { ROLE_LABELS, TIME_SLOTS } from '../types';
import type { OrderActions } from '../App';
import { StatusBadge } from '../components/StatusBadge';
import { PhotoThumb } from '../components/PhotoThumb';
import { Modal } from '../components/Modal';
import { formatDate, formatDateTime, todayIso } from '../utils/format';

interface Props {
  orders: WorkOrder[];
  role: Role;
  actions: OrderActions;
  onToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

type Tab = 'overview' | 'schedule' | 'report' | 'history';

export function WorkOrderDetail({ orders, role, actions, onToast }: Props) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const order = orders.find(o => o.id === id);
  const [tab, setTab] = useState<Tab>('overview');

  if (!order) {
    return (
      <div className="card card-pad" style={{ textAlign: 'center' }}>
        <p className="fw-600 mb-8">指定された作業が見つかりません</p>
        <p className="text-sub fs-13 mb-16">削除されたか、URLが正しくない可能性があります。</p>
        <button className="btn btn-primary" onClick={() => navigate('/')}>作業一覧へ戻る</button>
      </div>
    );
  }

  const confirmed = order.candidates.find(c => c.id === order.confirmedSlotId);

  return (
    <div>
      <div className="row gap-8 mb-12">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/')}>← 一覧へ戻る</button>
      </div>

      <div className="card card-pad mb-16">
        <div className="row wrap gap-12" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div className="row gap-10 wrap" style={{ alignItems: 'center' }}>
              <span style={{ fontSize: 18, fontWeight: 700 }}>{order.id}</span>
              <StatusBadge status={order.status} />
              <span className="tag">{order.workType}</span>
            </div>
            <div className="mt-8" style={{ fontSize: 15, fontWeight: 600 }}>{order.customerCompany}</div>
            <div className="fs-13 text-sub">{order.facility}・{order.location}</div>
          </div>
          {confirmed && (
            <div style={{ textAlign: 'right' }}>
              <div className="fs-12 text-sub fw-600">確定作業日</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent-dark)' }}>{formatDate(confirmed.date)}</div>
              <div className="fs-12 text-sub">{confirmed.timeSlot}</div>
            </div>
          )}
        </div>
        <ActionBanner order={order} role={role} onGoTab={setTab} />
      </div>

      <div className="tabs">
        <TabBtn active={tab === 'overview'} onClick={() => setTab('overview')}>概要</TabBtn>
        <TabBtn active={tab === 'schedule'} onClick={() => setTab('schedule')}>日程調整</TabBtn>
        <TabBtn active={tab === 'report'} onClick={() => setTab('report')}>作業報告</TabBtn>
        <TabBtn active={tab === 'history'} onClick={() => setTab('history')}>履歴 <span className="text-muted">({order.history.length})</span></TabBtn>
      </div>

      {tab === 'overview' && <OverviewTab order={order} />}
      {tab === 'schedule' && <ScheduleTab order={order} role={role} actions={actions} onToast={onToast} />}
      {tab === 'report' && <ReportTab order={order} role={role} actions={actions} onToast={onToast} />}
      {tab === 'history' && <HistoryTab order={order} />}
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button className={`tab ${active ? 'active' : ''}`} onClick={onClick}>{children}</button>
  );
}

/* ───────── 現在の状況・次のアクション ───────── */
function ActionBanner({ order, role, onGoTab }: { order: WorkOrder; role: Role; onGoTab: (t: Tab) => void }) {
  let text = '';
  let cta: { label: string; tab: Tab } | null = null;
  let tone = 'var(--info-light)';
  let color = 'var(--info)';

  const answered = order.candidates.filter(c => c.response !== 'pending').length;

  switch (order.status) {
    case 'draft':
      if (role === 'company') { text = '候補日が未提示です。日程調整タブから顧客へ候補日を提示してください。'; cta = { label: '候補日を提示する', tab: 'schedule' }; }
      else text = '当社が候補日を調整中です。提示までしばらくお待ちください。';
      tone = 'var(--warning-light)'; color = 'var(--warning)';
      break;
    case 'proposed':
      if (role === 'customer') { text = '候補日が提示されています。各候補日にOK／NGでご回答ください。'; cta = { label: '候補日に回答する', tab: 'schedule' }; tone = 'var(--info-light)'; color = 'var(--info)'; }
      else if (role === 'company') {
        text = answered === 0 ? '顧客の回答待ちです。回答後に日程を確定できます。' : '顧客が回答しました。OKの候補日で日程を確定してください。';
        cta = { label: '回答状況を確認する', tab: 'schedule' };
      } else text = '当社と顧客で日程を調整中です。確定後に作業を開始できます。';
      break;
    case 'rescheduling':
      if (role === 'company') { text = '顧客からNG回答がありました。候補日を見直して再提示してください。'; cta = { label: '候補日を再提示する', tab: 'schedule' }; }
      else if (role === 'customer') text = 'ご回答ありがとうございます。当社が候補日を再調整しています。';
      else text = '顧客都合により再調整中です。';
      tone = 'var(--warning-light)'; color = 'var(--warning)';
      break;
    case 'confirmed':
      if (role === 'partner' || role === 'company') { text = '日程が確定しました。作業当日、作業報告タブから作業を開始してください。'; cta = { label: '作業報告へ進む', tab: 'report' }; }
      else text = '日程が確定しました。作業実施をお待ちください。';
      tone = 'var(--accent-light)'; color = 'var(--accent-dark)';
      break;
    case 'in_progress':
      if (role === 'partner' || role === 'company') { text = '作業中です。チェック項目の消化・写真登録・報告書の作成を行ってください。'; cta = { label: '作業報告を入力する', tab: 'report' }; }
      else text = '協力業者が作業を実施中です。完了後に報告書が提出されます。';
      tone = 'var(--warning-light)'; color = 'var(--warning)';
      break;
    case 'reported':
      text = '作業報告書が提出され、この作業は完了しました。';
      cta = { label: '報告書を確認する', tab: 'report' };
      tone = 'var(--success-light)'; color = 'var(--success)';
      break;
  }

  return (
    <div className="mt-16 row wrap gap-12" style={{ background: tone, borderRadius: 'var(--radius-md)', padding: '12px 16px', justifyContent: 'space-between', alignItems: 'center' }}>
      <div className="fs-13" style={{ color, fontWeight: 600 }}>{text}</div>
      {cta && (
        <button className="btn btn-sm" style={{ background: color, color: '#fff' }} onClick={() => onGoTab(cta!.tab)}>
          {cta.label} →
        </button>
      )}
    </div>
  );
}

/* ───────── 概要タブ ───────── */
function OverviewTab({ order }: { order: WorkOrder }) {
  const confirmed = order.candidates.find(c => c.id === order.confirmedSlotId);
  return (
    <div className="card card-pad">
      <div className="section-title"><span className="bar" />作業情報</div>
      <div className="info-grid">
        <Info k="顧客企業" v={order.customerCompany} />
        <Info k="対象施設・建物" v={order.facility} />
        <Info k="作業場所" v={order.location} />
        <Info k="作業種別" v={order.workType} />
        <Info k="当社担当者" v={order.companyStaff} />
        <Info k="協力業者" v={`${order.partnerCompany}（${order.partnerStaff}）`} />
        <Info k="登録日" v={formatDate(order.createdAt)} />
        <Info k="確定作業日" v={confirmed ? `${formatDate(confirmed.date)} ${confirmed.timeSlot}` : '未確定'} />
      </div>

      <div className="divider" />
      <div className="section-title"><span className="bar" />顧客の希望・特記事項</div>
      <p className="fs-13" style={{ color: order.desiredNote ? 'var(--text)' : 'var(--text-muted)' }}>
        {order.desiredNote || '特記事項はありません。'}
      </p>

      <div className="divider" />
      <div className="section-title"><span className="bar" />作業チェック項目</div>
      <TaskProgress order={order} />
    </div>
  );
}

function TaskProgress({ order }: { order: WorkOrder }) {
  const done = order.tasks.filter(t => t.done).length;
  const total = order.tasks.length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <div>
      <div className="row gap-10 mb-8">
        <div style={{ flex: 1, height: 8, background: 'var(--bg-alt)', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: 'var(--success)', borderRadius: 999, transition: 'width 0.3s' }} />
        </div>
        <span className="fs-12 fw-600 text-sub" style={{ whiteSpace: 'nowrap' }}>{done} / {total} 完了</span>
      </div>
      <div className="stack">
        {order.tasks.map(t => (
          <div key={t.id} className="check-row">
            <span className={`check-box ${t.done ? 'done' : ''}`} aria-hidden="true">
              {t.done && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 6" /></svg>}
            </span>
            <span className="fs-13" style={{ color: t.done ? 'var(--text-sub)' : 'var(--text)', textDecoration: t.done ? 'line-through' : 'none' }}>{t.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Info({ k, v }: { k: string; v: string }) {
  return (
    <div className="info-item">
      <div className="k">{k}</div>
      <div className="v">{v}</div>
    </div>
  );
}

/* ───────── 日程調整タブ ───────── */
function ScheduleTab({ order, role, actions, onToast }: { order: WorkOrder; role: Role; actions: OrderActions; onToast: Props['onToast'] }) {
  const [ngTarget, setNgTarget] = useState<CandidateSlot | null>(null);
  const [ngComment, setNgComment] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);

  const isCompany = role === 'company';
  const isCustomer = role === 'customer';
  const locked = order.status === 'confirmed' || order.status === 'in_progress' || order.status === 'reported';
  const answered = order.candidates.filter(c => c.response !== 'pending').length;
  const hasOk = order.candidates.some(c => c.response === 'ok');

  function submitNg() {
    if (!ngTarget) return;
    actions.respondSlot(order.id, ngTarget.id, 'ng', ngComment);
    setNgTarget(null);
    setNgComment('');
  }

  return (
    <div className="card card-pad">
      <div className="row wrap gap-12 mb-16" style={{ justifyContent: 'space-between' }}>
        <div className="section-title" style={{ margin: 0 }}><span className="bar" />候補日と回答状況</div>
        {isCompany && !locked && (
          <button className="btn btn-secondary btn-sm" onClick={() => setEditorOpen(true)}>
            {order.candidates.length === 0 ? '候補日を提示' : '候補日を再提示'}
          </button>
        )}
      </div>

      {order.candidates.length === 0 ? (
        <div className="empty">
          <div className="empty-title">候補日はまだ提示されていません</div>
          <div className="empty-desc">
            {isCompany ? '「候補日を提示」から日程候補を登録してください。' : '当社が候補日を調整中です。'}
          </div>
        </div>
      ) : (
        <div className="stack gap-10">
          {order.candidates.map((c, i) => {
            const isConfirmed = c.id === order.confirmedSlotId;
            const cls = isConfirmed ? 'confirmed' : c.response === 'ok' ? 'ok' : c.response === 'ng' ? 'ng' : '';
            return (
              <div key={c.id} className={`slot-card ${cls}`}>
                <div className="row wrap gap-12" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="row gap-12" style={{ alignItems: 'center' }}>
                    <span className="tag">第{i + 1}候補</span>
                    <div>
                      <div className="fw-600">{formatDate(c.date)}</div>
                      <div className="fs-12 text-sub">{c.timeSlot}</div>
                    </div>
                  </div>
                  <div className="row gap-10" style={{ alignItems: 'center' }}>
                    <ResponseChip response={c.response} confirmed={isConfirmed} />
                    {/* 顧客: 未回答かつ回答可能な状態のときOK/NG */}
                    {isCustomer && !locked && c.response === 'pending' && (
                      <div className="row gap-6">
                        <button className="btn btn-success btn-sm" onClick={() => actions.respondSlot(order.id, c.id, 'ok')}>OK</button>
                        <button className="btn btn-danger-outline btn-sm" onClick={() => { setNgTarget(c); setNgComment(''); }}>NG</button>
                      </div>
                    )}
                    {/* 当社: OK済みの候補日を確定 */}
                    {isCompany && !locked && c.response === 'ok' && (
                      <button className="btn btn-primary btn-sm" onClick={() => actions.confirmSlot(order.id, c.id)}>この日程で確定</button>
                    )}
                  </div>
                </div>
                {c.comment && (
                  <div className="mt-8 fs-12" style={{ background: 'rgba(255,255,255,0.6)', borderRadius: 6, padding: '7px 10px', color: 'var(--text-sub)' }}>
                    <span className="fw-600">顧客コメント：</span>{c.comment}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 状況の補足 */}
      {order.candidates.length > 0 && !locked && (
        <div className="mt-16 fs-12 text-sub">
          {isCompany && answered === 0 && '顧客の回答をお待ちください。'}
          {isCompany && answered > 0 && !hasOk && 'OKの候補日がありません。「候補日を再提示」から日程を見直してください。'}
          {isCompany && hasOk && 'OKの候補日で「この日程で確定」を押すと日程が確定します。'}
          {isCustomer && '各候補日について、実施可能なら OK、不可なら NG（理由を添えて）でご回答ください。'}
          {role === 'partner' && 'この作業は当社と顧客で日程調整中です。確定までお待ちください。'}
        </div>
      )}
      {locked && (
        <div className="mt-16 fs-13" style={{ color: 'var(--accent-dark)', fontWeight: 600 }}>
          日程は確定済みです。変更が必要な場合は当社担当（{order.companyStaff}）へご連絡ください。
        </div>
      )}

      {/* NG回答モーダル */}
      <Modal
        isOpen={!!ngTarget}
        onClose={() => setNgTarget(null)}
        title="NG（実施不可）で回答"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setNgTarget(null)}>キャンセル</button>
            <button className="btn btn-danger-outline" onClick={submitNg}>NGで回答する</button>
          </>
        }
      >
        {ngTarget && (
          <div>
            <p className="fs-13 mb-12">
              <span className="fw-600">{formatDate(ngTarget.date)} {ngTarget.timeSlot}</span> を実施不可として回答します。
            </p>
            <label className="field-label">理由・ご希望（任意）</label>
            <textarea
              className="textarea"
              value={ngComment}
              onChange={e => setNgComment(e.target.value)}
              placeholder="例）その週は棚卸のため不可。翌週以降でお願いします。"
            />
            <p className="fs-12 text-sub mt-8">回答内容は当社に共有され、担当者が候補日を再調整します。</p>
          </div>
        )}
      </Modal>

      {/* 候補日 提示/再提示エディタ（開くたびに現在の候補日で初期化するため key で再マウント） */}
      <CandidateEditorModal
        key={editorOpen ? `editor-open-${order.candidates.length}` : 'editor-closed'}
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        existing={order.candidates}
        isRepropose={order.candidates.length > 0}
        onSubmit={cands => {
          if (cands.length === 0) { onToast('候補日を1件以上入力してください', 'error'); return; }
          actions.proposeCandidates(order.id, cands.map((c, i) => ({
            id: `${order.id}-r${Date.now()}-${i}`,
            date: c.date,
            timeSlot: c.timeSlot,
            response: 'pending',
          })), order.candidates.length > 0);
          setEditorOpen(false);
        }}
      />
    </div>
  );
}

function ResponseChip({ response, confirmed }: { response: CandidateSlot['response']; confirmed: boolean }) {
  if (confirmed) return <span className="badge" style={{ color: 'var(--accent-dark)', background: 'var(--accent-light)' }}><span className="dot" />確定</span>;
  if (response === 'ok') return <span className="badge" style={{ color: 'var(--success)', background: 'var(--success-light)' }}><span className="dot" />OK（実施可）</span>;
  if (response === 'ng') return <span className="badge" style={{ color: 'var(--error)', background: 'var(--error-light)' }}><span className="dot" />NG（不可）</span>;
  return <span className="badge" style={{ color: 'var(--text-sub)', background: 'var(--bg-alt)' }}><span className="dot" />回答待ち</span>;
}

/* 候補日エディタ（提示・再提示共通） */
function CandidateEditorModal({
  isOpen, onClose, existing, isRepropose, onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  existing: CandidateSlot[];
  isRepropose: boolean;
  onSubmit: (cands: { date: string; timeSlot: string }[]) => void;
}) {
  const [rows, setRows] = useState<{ date: string; timeSlot: string }[]>(
    existing.length > 0
      ? existing.map(c => ({ date: c.date, timeSlot: c.timeSlot }))
      : [{ date: '', timeSlot: TIME_SLOTS[0] }, { date: '', timeSlot: TIME_SLOTS[0] }],
  );

  function update(i: number, patch: Partial<{ date: string; timeSlot: string }>) {
    setRows(prev => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isRepropose ? '候補日を再提示' : '候補日を提示'}
      width={560}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>キャンセル</button>
          <button className="btn btn-primary" onClick={() => onSubmit(rows.filter(r => r.date))}>
            {isRepropose ? '再提示する' : '提示する'}
          </button>
        </>
      }
    >
      <p className="fs-12 text-sub mb-12">
        顧客に提示する候補日を入力してください（最大4件）。{isRepropose && '再提示すると、これまでの回答はリセットされます。'}
      </p>
      <div className="stack gap-10">
        {rows.map((r, i) => (
          <div key={i} className="row gap-8" style={{ alignItems: 'center' }}>
            <span className="tag">第{i + 1}候補</span>
            <input className="input grow" type="date" min={todayIso()} value={r.date} onChange={e => update(i, { date: e.target.value })} aria-label={`第${i + 1}候補 日付`} />
            <select className="select" style={{ width: 180 }} value={r.timeSlot} onChange={e => update(i, { timeSlot: e.target.value })} aria-label={`第${i + 1}候補 時間帯`}>
              {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <button className="btn btn-ghost btn-sm" onClick={() => setRows(prev => prev.length <= 1 ? prev : prev.filter((_, idx) => idx !== i))} disabled={rows.length <= 1} aria-label="削除">削除</button>
          </div>
        ))}
      </div>
      {rows.length < 4 && (
        <button className="btn btn-secondary btn-sm mt-12" onClick={() => setRows(prev => [...prev, { date: '', timeSlot: TIME_SLOTS[0] }])}>＋ 候補日を追加</button>
      )}
    </Modal>
  );
}

/* ───────── 作業報告タブ ───────── */
function ReportTab({ order, role, actions, onToast }: { order: WorkOrder; role: Role; actions: OrderActions; onToast: Props['onToast'] }) {
  const [photoModal, setPhotoModal] = useState<null | 'before' | 'after'>(null);
  const canWork = role === 'partner' || role === 'company';
  const { report } = order;

  // 未確定（日程調整前）
  if (order.status === 'draft' || order.status === 'proposed' || order.status === 'rescheduling') {
    return (
      <div className="card card-pad">
        <div className="empty">
          <div className="empty-title">まだ作業報告は行えません</div>
          <div className="empty-desc">日程が確定し、作業を開始すると報告書を作成できます。</div>
        </div>
      </div>
    );
  }

  // 確定済み・未開始
  if (order.status === 'confirmed') {
    const confirmed = order.candidates.find(c => c.id === order.confirmedSlotId);
    return (
      <div className="card card-pad">
        <div className="section-title"><span className="bar" />作業開始</div>
        <p className="fs-13 mb-16">
          確定作業日：<span className="fw-600">{confirmed ? `${formatDate(confirmed.date)} ${confirmed.timeSlot}` : '—'}</span><br />
          作業当日、現地で作業を開始したら「作業を開始」を押してください。開始後、チェック項目・写真・報告書を入力できます。
        </p>
        {canWork ? (
          <button className="btn btn-primary btn-lg" onClick={() => actions.startWork(order.id)}>作業を開始</button>
        ) : (
          <div className="fs-13 text-sub">作業の開始・報告は協力業者（{order.partnerCompany}）が行います。</div>
        )}
        <div className="divider" />
        <div className="section-title"><span className="bar" />当日の作業チェック項目</div>
        <TaskProgress order={order} />
      </div>
    );
  }

  // reported: 読み取り専用
  const readOnly = order.status === 'reported' || !canWork;

  const doneAll = order.tasks.every(t => t.done);
  const canSubmit = report.summary.trim() !== '' && report.result.trim() !== '';

  function handleSubmit() {
    if (!canSubmit) { onToast('実施内容と実施結果・所見を入力してください', 'error'); return; }
    if (!doneAll) { onToast('未完了のチェック項目があります。すべて確認のうえ提出してください', 'error'); return; }
    if (report.photos.length === 0) { onToast('現場写真を1枚以上登録してください', 'error'); return; }
    actions.submitReport(order.id);
  }

  return (
    <div className="card card-pad">
      {order.status === 'reported' && (
        <div className="mb-16 row gap-10 wrap" style={{ background: 'var(--success-light)', borderRadius: 'var(--radius-md)', padding: '12px 16px', justifyContent: 'space-between' }}>
          <div className="fs-13" style={{ color: 'var(--success)', fontWeight: 600 }}>
            提出済み — {report.submittedBy}（{report.submittedAt ? formatDateTime(report.submittedAt) : ''}）
          </div>
        </div>
      )}

      {/* チェック項目 */}
      <div className="section-title"><span className="bar" />作業チェック項目</div>
      {readOnly ? (
        <TaskProgress order={order} />
      ) : (
        <div>
          <div className="row gap-10 mb-8">
            <div style={{ flex: 1, height: 8, background: 'var(--bg-alt)', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ width: `${Math.round((order.tasks.filter(t => t.done).length / order.tasks.length) * 100)}%`, height: '100%', background: 'var(--success)', borderRadius: 999, transition: 'width 0.3s' }} />
            </div>
            <span className="fs-12 fw-600 text-sub" style={{ whiteSpace: 'nowrap' }}>{order.tasks.filter(t => t.done).length} / {order.tasks.length} 完了</span>
          </div>
          <div className="stack">
            {order.tasks.map(t => (
              <button
                key={t.id}
                className="check-row"
                onClick={() => actions.toggleTask(order.id, t.id)}
                style={{ background: 'none', border: 'none', borderBottom: '1px solid var(--border)', textAlign: 'left', width: '100%', cursor: 'pointer' }}
              >
                <span className={`check-box ${t.done ? 'done' : ''}`} aria-hidden="true">
                  {t.done && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 6" /></svg>}
                </span>
                <span className="fs-13" style={{ color: t.done ? 'var(--text-sub)' : 'var(--text)', textDecoration: t.done ? 'line-through' : 'none' }}>{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="divider" />

      {/* 現場写真 */}
      <div className="section-title"><span className="bar" />現場写真</div>
      {report.photos.length === 0 && readOnly && <p className="fs-13 text-muted mb-12">登録された写真はありません。</p>}
      <div className="photo-grid">
        {report.photos.map(p => (
          <div key={p.id} className="photo-tile">
            <PhotoThumb photo={p} />
            <div className="cap">
              <span>{p.caption}</span>
              {!readOnly && (
                <button className="btn btn-ghost btn-sm" style={{ minHeight: 0, padding: '2px 6px' }} onClick={() => actions.removePhoto(order.id, p.id)} aria-label="写真を削除">削除</button>
              )}
            </div>
          </div>
        ))}
        {!readOnly && (
          <>
            <button className="photo-add" onClick={() => setPhotoModal('before')}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="6" width="18" height="14" rx="2" /><circle cx="12" cy="13" r="3.5" /><path d="M8 6l1.5-2.5h5L16 6" /></svg>
              作業前を追加
            </button>
            <button className="photo-add" onClick={() => setPhotoModal('after')}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="6" width="18" height="14" rx="2" /><circle cx="12" cy="13" r="3.5" /><path d="M8 6l1.5-2.5h5L16 6" /></svg>
              作業後を追加
            </button>
          </>
        )}
      </div>

      <div className="divider" />

      {/* 報告内容 */}
      <div className="section-title"><span className="bar" />作業報告書</div>
      <ReportField label="実施内容" required value={report.summary} readOnly={readOnly}
        placeholder="実施した作業の内容を記入します。"
        onChange={v => actions.updateReportField(order.id, 'summary', v)} />
      <ReportField label="実施結果・所見" required value={report.result} readOnly={readOnly}
        placeholder="作業の結果、発見した不具合、対応内容などを記入します。"
        onChange={v => actions.updateReportField(order.id, 'result', v)} />
      <ReportField label="次回への申し送り" value={report.nextAdvice} readOnly={readOnly}
        placeholder="次回作業への引き継ぎ・推奨事項があれば記入します。"
        onChange={v => actions.updateReportField(order.id, 'nextAdvice', v)} />

      {!readOnly && (
        <>
          <div className="divider" />
          <div className="row wrap gap-12" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="fs-12 text-sub">
              提出には「実施内容」「実施結果・所見」の入力、全チェック項目の完了、写真1枚以上が必要です。
            </div>
            <button className="btn btn-primary btn-lg" onClick={handleSubmit}>報告書を提出</button>
          </div>
        </>
      )}

      {readOnly && role === 'customer' && order.status === 'reported' && (
        <p className="fs-12 text-sub mt-16">この報告書は提出済みです。内容についてのご質問は当社担当（{order.companyStaff}）へお問い合わせください。</p>
      )}

      {/* 写真追加モーダル（開くたびにキャプション入力をリセット） */}
      <AddPhotoModal
        key={photoModal ?? 'photo-closed'}
        kind={photoModal}
        onClose={() => setPhotoModal(null)}
        onAdd={(kind, caption) => { actions.addPhoto(order.id, kind, caption); setPhotoModal(null); }}
      />
    </div>
  );
}

function ReportField({ label, required, value, placeholder, readOnly, onChange }: {
  label: string; required?: boolean; value: string; placeholder: string; readOnly: boolean; onChange: (v: string) => void;
}) {
  return (
    <div className="field">
      <label className="field-label">{label}{required && <span className="req">必須</span>}</label>
      {readOnly ? (
        <div className="fs-13" style={{ whiteSpace: 'pre-wrap', color: value ? 'var(--text)' : 'var(--text-muted)', background: 'var(--bg-alt)', borderRadius: 'var(--radius-md)', padding: '10px 12px', minHeight: 44 }}>
          {value || '（記載なし）'}
        </div>
      ) : (
        <textarea className="textarea" value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} />
      )}
    </div>
  );
}

function AddPhotoModal({ kind, onClose, onAdd }: { kind: null | 'before' | 'after'; onClose: () => void; onAdd: (kind: 'before' | 'after', caption: string) => void }) {
  const [caption, setCaption] = useState('');
  const label = kind === 'before' ? '作業前' : '作業後';
  return (
    <Modal
      isOpen={kind !== null}
      onClose={onClose}
      title={`${label}の写真を追加`}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>キャンセル</button>
          <button className="btn btn-primary" onClick={() => { if (kind) onAdd(kind, caption.trim() || `${label} 現場写真`); setCaption(''); }}>追加する</button>
        </>
      }
    >
      <p className="fs-12 text-sub mb-12">デモ環境では実際の撮影は行わず、サンプル画像を登録します。写真の説明（キャプション）を入力できます。</p>
      <label className="field-label">写真の説明</label>
      <input className="input" value={caption} onChange={e => setCaption(e.target.value)} placeholder={`例）${label} エントランス床面`} />
    </Modal>
  );
}

/* ───────── 履歴タブ ───────── */
function HistoryTab({ order }: { order: WorkOrder }) {
  const items = [...order.history].reverse();
  return (
    <div className="card card-pad">
      <div className="section-title"><span className="bar" />対応履歴</div>
      <p className="fs-12 text-sub mb-16">この作業に関する当社・顧客・協力業者のやり取りがすべて時系列で記録されます。</p>
      <div className="timeline">
        {items.map(h => (
          <div key={h.id} className="tl-item">
            <span className="tl-dot" style={{ borderColor: roleColor(h.actorRole) }} />
            <div className="tl-time">{formatDateTime(h.at)}</div>
            <div className="tl-text">
              <span className="tl-actor" style={{ color: roleColor(h.actorRole) }}>[{ROLE_LABELS[h.actorRole]}] {h.actorName}</span>
              {' '}{h.action}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function roleColor(role: Role): string {
  if (role === 'customer') return 'var(--info)';
  if (role === 'partner') return 'var(--warning)';
  return 'var(--accent-dark)';
}
