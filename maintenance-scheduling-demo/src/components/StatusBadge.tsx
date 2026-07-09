import type { WorkStatus } from '../types';
import { STATUS_LABELS, STATUS_TONE } from '../types';

const TONE_STYLE: Record<string, { color: string; bg: string }> = {
  muted: { color: '#566672', bg: '#EAEFF2' },
  info: { color: 'var(--info)', bg: 'var(--info-light)' },
  warning: { color: 'var(--warning)', bg: 'var(--warning-light)' },
  accent: { color: 'var(--accent-dark)', bg: 'var(--accent-light)' },
  success: { color: 'var(--success)', bg: 'var(--success-light)' },
};

export function StatusBadge({ status }: { status: WorkStatus }) {
  const tone = STATUS_TONE[status];
  const s = TONE_STYLE[tone];
  return (
    <span className="badge" style={{ color: s.color, background: s.bg }}>
      <span className="dot" />
      {STATUS_LABELS[status]}
    </span>
  );
}
