import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Role, WorkOrder, WorkStatus } from '../types';
import { STATUS_LABELS } from '../types';
import { DEMO_CUSTOMER_ACCOUNT, DEMO_PARTNER_ACCOUNT } from '../data/sampleData';
import { EmptyState } from '../components/EmptyState';
import { formatDate } from '../utils/format';

interface Props {
  orders: WorkOrder[];
  role: Role;
}

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

const EVENT_COLOR: Partial<Record<WorkStatus, string>> = {
  confirmed: 'var(--accent)',
  in_progress: 'var(--warning)',
  reported: 'var(--success)',
};

interface CalEvent {
  order: WorkOrder;
  date: string; // YYYY-MM-DD
}

function scopeByRole(orders: WorkOrder[], role: Role): WorkOrder[] {
  if (role === 'customer') return orders.filter(o => o.customerCompany === DEMO_CUSTOMER_ACCOUNT.company);
  if (role === 'partner') return orders.filter(o => o.partnerCompany === DEMO_PARTNER_ACCOUNT.company);
  return orders;
}

export function CalendarView({ orders, role }: Props) {
  const navigate = useNavigate();
  // 初期表示は today の月（デモ日は2026-07）
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-11

  const events = useMemo<CalEvent[]>(() => {
    return scopeByRole(orders, role)
      .map(o => {
        const slot = o.candidates.find(c => c.id === o.confirmedSlotId);
        return slot ? { order: o, date: slot.date } : null;
      })
      .filter((e): e is CalEvent => e !== null);
  }, [orders, role]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalEvent[]>();
    for (const e of events) {
      const list = map.get(e.date) ?? [];
      list.push(e);
      map.set(e.date, list);
    }
    return map;
  }, [events]);

  // 当月のセル構築
  const first = new Date(year, month, 1);
  const startWeekday = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const monthEvents = useMemo(() => {
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}-`;
    return events.filter(e => e.date.startsWith(prefix)).sort((a, b) => a.date.localeCompare(b.date));
  }, [events, year, month]);

  function shift(delta: number) {
    let m = month + delta;
    let y = year;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setMonth(m);
    setYear(y);
  }
  function goToday() {
    setYear(now.getFullYear());
    setMonth(now.getMonth());
  }

  function dateStr(day: number) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-title">作業カレンダー</div>
          <div className="page-sub">日程が確定した作業を月別に表示します。予定の重なりや当日の作業を一目で確認できます。</div>
        </div>
        <div className="row gap-8">
          <button className="btn btn-secondary btn-sm" onClick={() => shift(-1)} aria-label="前の月">‹ 前月</button>
          <button className="btn btn-secondary btn-sm" onClick={goToday}>今日</button>
          <button className="btn btn-secondary btn-sm" onClick={() => shift(1)} aria-label="次の月">翌月 ›</button>
        </div>
      </div>

      <div className="row gap-12 wrap mb-16" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 17, fontWeight: 700 }}>{year}年 {month + 1}月</div>
        <div className="row gap-12 wrap">
          <Legend color="var(--accent)" label="日程確定" />
          <Legend color="var(--warning)" label="作業中" />
          <Legend color="var(--success)" label="報告書提出済み" />
        </div>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--border)' }}>
          {WEEKDAYS.map((w, i) => (
            <div key={w} style={{ padding: '10px 0', textAlign: 'center', fontSize: 12, fontWeight: 700, color: i === 0 ? 'var(--error)' : i === 6 ? 'var(--info)' : 'var(--text-sub)', background: 'var(--bg-alt)' }}>
              {w}
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {cells.map((day, idx) => {
            const ds = day ? dateStr(day) : '';
            const dayEvents = day ? eventsByDate.get(ds) ?? [] : [];
            const isToday = ds === todayStr;
            return (
              <div
                key={idx}
                style={{
                  minHeight: 92,
                  borderRight: (idx + 1) % 7 === 0 ? 'none' : '1px solid var(--border)',
                  borderBottom: idx < cells.length - 7 ? '1px solid var(--border)' : 'none',
                  padding: '6px 6px 8px',
                  background: day ? (isToday ? 'var(--accent-soft)' : 'var(--card)') : 'var(--bg-alt)',
                }}
              >
                {day && (
                  <>
                    <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{
                        fontSize: 12,
                        fontWeight: isToday ? 700 : 500,
                        color: idx % 7 === 0 ? 'var(--error)' : idx % 7 === 6 ? 'var(--info)' : 'var(--text-sub)',
                        width: 22, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        borderRadius: '50%',
                        background: isToday ? 'var(--accent)' : 'transparent',
                        ...(isToday ? { color: '#fff' } : {}),
                      }}>
                        {day}
                      </span>
                    </div>
                    <div className="stack gap-6">
                      {dayEvents.map(e => (
                        <button
                          key={e.order.id}
                          onClick={() => navigate(`/order/${e.order.id}`)}
                          title={`${e.order.customerCompany} / ${e.order.workType}（${STATUS_LABELS[e.order.status]}）`}
                          style={{
                            display: 'block', width: '100%', textAlign: 'left', border: 'none',
                            borderLeft: `3px solid ${EVENT_COLOR[e.order.status] ?? 'var(--accent)'}`,
                            background: 'var(--bg-alt)', borderRadius: 4, padding: '3px 6px',
                            fontSize: 11, lineHeight: 1.3, color: 'var(--text)', overflow: 'hidden',
                          }}
                        >
                          <span style={{ fontWeight: 600, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.order.workType}</span>
                          <span className="text-sub" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>{e.order.customerCompany}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* この月の作業一覧 */}
      <div className="mt-24 section-title"><span className="bar" />{month + 1}月の確定作業（{monthEvents.length}件）</div>
      {monthEvents.length === 0 ? (
        <div className="card"><EmptyState title="この月に確定した作業はありません" desc="前月・翌月を確認するか、日程を確定してください。" /></div>
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr><th>作業日</th><th>顧客 / 施設</th><th>作業種別</th><th>協力業者</th><th>ステータス</th></tr>
            </thead>
            <tbody>
              {monthEvents.map(e => (
                <tr key={e.order.id} className="clickable" onClick={() => navigate(`/order/${e.order.id}`)}>
                  <td style={{ whiteSpace: 'nowrap', fontWeight: 600 }}>{formatDate(e.date)}</td>
                  <td><div className="fw-600">{e.order.customerCompany}</div><div className="fs-12 text-sub">{e.order.facility}・{e.order.location}</div></td>
                  <td><span className="tag">{e.order.workType}</span></td>
                  <td>{e.order.partnerCompany}</td>
                  <td>
                    <span className="badge" style={{ color: EVENT_COLOR[e.order.status], background: 'var(--bg-alt)' }}>
                      <span className="dot" />{STATUS_LABELS[e.order.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="row gap-6" style={{ fontSize: 12, color: 'var(--text-sub)' }}>
      <span style={{ width: 10, height: 10, borderRadius: 2, background: color, display: 'inline-block' }} />
      {label}
    </span>
  );
}
