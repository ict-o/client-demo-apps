import type { DocKind, DocStatus, ProjectStatus } from '../types';
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_TONE } from '../types';
import { docStatusLabel } from '../utils/docs';

const TONE_STYLE: Record<string, { color: string; bg: string }> = {
  muted: { color: 'var(--neutral)', bg: 'var(--neutral-light)' },
  info: { color: 'var(--info)', bg: 'var(--info-light)' },
  warning: { color: 'var(--warning)', bg: 'var(--warning-light)' },
  accent: { color: 'var(--accent-dark)', bg: 'var(--accent-light)' },
  success: { color: 'var(--success)', bg: 'var(--success-light)' },
};

export function StatusBadge({ status }: { status: ProjectStatus }) {
  const s = TONE_STYLE[PROJECT_STATUS_TONE[status]];
  return (
    <span className="badge" style={{ color: s.color, background: s.bg }}>
      <span className="dot" />
      {PROJECT_STATUS_LABELS[status]}
    </span>
  );
}

const DOC_TONE: Record<DocStatus, string> = {
  none: 'muted',
  created: 'info',
  sent: 'warning',
  sealed: 'success',
};

export function DocStatusBadge({ kind, status }: { kind: DocKind; status: DocStatus }) {
  const s = TONE_STYLE[DOC_TONE[status]];
  return (
    <span className="badge" style={{ color: s.color, background: s.bg }}>
      <span className="dot" />
      {docStatusLabel(kind, status)}
    </span>
  );
}
