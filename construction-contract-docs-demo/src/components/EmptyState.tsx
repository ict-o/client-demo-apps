interface EmptyStateProps {
  title: string;
  desc?: string;
  action?: React.ReactNode;
}

export function EmptyState({ title, desc, action }: EmptyStateProps) {
  return (
    <div className="empty">
      <svg className="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
        <path d="M14 3v5h5" />
        <path d="M9 13h6M9 17h4" strokeLinecap="round" />
      </svg>
      <div className="empty-title">{title}</div>
      {desc && <div className="empty-desc">{desc}</div>}
      {action && <div className="mt-16">{action}</div>}
    </div>
  );
}
