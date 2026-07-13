import React from 'react';
import type { Alert } from '../types';
import { ALERT_KIND_LABELS, ALERT_STATUS_LABELS, ALERT_STATUS_TONE } from '../types';
import { relativeTime } from '../utils/format';
import { Badge } from './Badge';

function KindIcon({ kind }: { kind: Alert['kind'] }) {
  if (kind === 'delay') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
      </svg>
    );
  }
  if (kind === 'defect') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 3l9 16H3z" /><path d="M12 10v4M12 17.5v.01" />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </svg>
  );
}

interface AlertRowProps {
  alert: Alert;
  onClick?: () => void;
  actions?: React.ReactNode;
}

export function AlertRow({ alert, onClick, actions }: AlertRowProps) {
  const done = alert.status === 'resolved';
  const cls = `alert-item level-${alert.level}${done ? ' done' : ''}`;
  const inner = (
    <>
      <span className={`alert-icn ${alert.kind}`}><KindIcon kind={alert.kind} /></span>
      <div className="alert-body">
        <div className="alert-title-row">
          <span className="alert-case">{alert.caseTitle}</span>
          <span className="tag">{alert.caseCode}</span>
          <Badge tone={alert.level === 'high' ? 'error' : 'warning'} label={`重要度 ${alert.level === 'high' ? '高' : '中'}`} />
          <span className="tag">{ALERT_KIND_LABELS[alert.kind]}</span>
        </div>
        <div className="alert-msg">{alert.message}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px', flexWrap: 'wrap' }}>
          <Badge tone={ALERT_STATUS_TONE[alert.status]} label={ALERT_STATUS_LABELS[alert.status]} />
          <span className="alert-time">{relativeTime(alert.at)}</span>
          {actions}
        </div>
      </div>
    </>
  );

  if (onClick) {
    return (
      <button type="button" className={cls} onClick={onClick}>
        {inner}
      </button>
    );
  }
  return <div className={cls}>{inner}</div>;
}
