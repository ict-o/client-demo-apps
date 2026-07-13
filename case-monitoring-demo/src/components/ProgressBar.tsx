import type { CaseStatus } from '../types';

interface ProgressBarProps {
  percent: number;
  status?: CaseStatus;
  showLabel?: boolean;
}

/** 案件の進捗率バー。案件状態に応じて色を変える。 */
export function ProgressBar({ percent, status = 'active', showLabel = true }: ProgressBarProps) {
  const tone =
    status === 'delayed' ? 'tone-delayed' :
    status === 'attention' ? 'tone-attention' :
    status === 'done' ? 'tone-done' : '';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
      <div className={`progress ${tone}`}>
        <span style={{ width: `${percent}%` }} />
      </div>
      {showLabel && <span className="progress-label">{percent}%</span>}
    </div>
  );
}
