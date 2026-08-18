import type { ApprovalStep, Member } from '../types';
import { Badge } from './Badge';
import { stepStatusMeta } from '../utils/domain';
import { formatDateTime } from '../utils/format';

interface ApprovalStepsProps {
  steps: ApprovalStep[];
  members: Member[];
}

/** 申請の承認段階（多段階承認）の進捗を表示する */
export function ApprovalSteps({ steps, members }: ApprovalStepsProps) {
  const nameOf = (id?: string) => members.find(m => m.id === id)?.name ?? '';

  return (
    <div>
      {steps.map((s, i) => {
        const approver = members.find(m => m.id === s.approverId);
        const delegate = approver?.delegateId ? members.find(m => m.id === approver.delegateId) : undefined;
        const meta = stepStatusMeta(s.status);
        return (
          <div className="step" key={s.id}>
            <div className={`step-marker ${s.status}`}>{i + 1}</div>
            <div className="step-main">
              <div className="step-head">
                <div className="step-name">{s.name}</div>
                <Badge tone={meta.tone} label={meta.label} />
              </div>
              <div className="step-meta">
                <span>
                  承認者: {approver ? `${approver.department} ${approver.title}　${approver.name}` : '未設定'}
                </span>
                {s.actedAt && <span>処理日時: {formatDateTime(s.actedAt)}</span>}
                {s.actedById && s.actedById !== s.approverId && <span>処理者: {nameOf(s.actedById)}（代理）</span>}
              </div>
              {s.status === 'current' && approver?.absent && delegate && (
                <div className="step-note">
                  {approver.name} は不在（出張・休暇）のため、代理承認者の {delegate.name}（{delegate.department}{' '}
                  {delegate.title}）が承認できます。
                </div>
              )}
              {s.comment && (
                <div className="step-note">
                  {s.status === 'rejected' ? '差戻し理由: ' : 'コメント: '}
                  {s.comment}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
