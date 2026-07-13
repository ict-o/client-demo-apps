interface EmptyStateProps {
  title: string;
  desc?: string;
}

export function EmptyState({ title, desc }: EmptyStateProps) {
  return (
    <div className="empty">
      <svg className="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <rect x="3" y="4" width="18" height="17" rx="2" />
        <path d="M3 9h18M8 2v4M16 2v4" />
        <path d="M8 14h5" strokeLinecap="round" />
      </svg>
      <div className="empty-title">{title}</div>
      {desc && <div className="empty-desc">{desc}</div>}
    </div>
  );
}
