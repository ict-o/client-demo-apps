// トーン付きのステータスバッジ（案件状態・チェック項目状態・アラート状態で共用）

const TONE_STYLE: Record<string, { color: string; bg: string }> = {
  muted: { color: '#566672', bg: '#EAEFF2' },
  info: { color: 'var(--info)', bg: 'var(--info-light)' },
  warning: { color: 'var(--warning)', bg: 'var(--warning-light)' },
  accent: { color: 'var(--accent-dark)', bg: 'var(--accent-light)' },
  success: { color: 'var(--success)', bg: 'var(--success-light)' },
  error: { color: 'var(--error)', bg: 'var(--error-light)' },
};

export function Badge({ tone, label }: { tone: string; label: string }) {
  const s = TONE_STYLE[tone] ?? TONE_STYLE.muted;
  return (
    <span className="badge" style={{ color: s.color, background: s.bg }}>
      <span className="dot" />
      {label}
    </span>
  );
}
