import type { Member } from '../types';
import type { RouteInput } from '../utils/route';
import { planRoute } from '../utils/route';

interface RoutePreviewProps {
  input: RouteInput;
  members: Member[];
}

/** 申請内容から自動判定した承認ルートを表示する（入力に追従して即時に変化する） */
export function RoutePreview({ input, members }: RoutePreviewProps) {
  const plan = planRoute(input);

  return (
    <div className="route-preview">
      {plan.map((p, i) => {
        const approver = members.find(m => m.id === p.approverId);
        return (
          <div key={p.name}>
            {i > 0 && <div className="route-arrow" aria-hidden="true">↓</div>}
            <div className="route-node">
              <span className="route-no">{i + 1}</span>
              <div>
                <div className="route-name">{p.name}</div>
                <div className="route-approver">
                  {approver ? `${approver.department} ${approver.title}　${approver.name}` : '承認者未設定'}
                </div>
                <div className="route-reason">{p.reason}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
