import type { DealKind, ProjectStatus } from '../types';
import { FLOW_STEPS, flowStepIndex } from '../types';

/**
 * 案件が今どこまで進んでいるかを、番号付きの大きなステップで示す。
 * 画面を初めて見る人でも「次にやること」の位置が分かるようにするための表示。
 */
export function FlowSteps({
  status,
  dealKind,
  generated,
}: {
  status: ProjectStatus;
  dealKind: DealKind;
  generated: boolean;
}) {
  const current = flowStepIndex(status, generated);

  return (
    <ol className="flow" aria-label="この案件の進み具合">
      {FLOW_STEPS.map((step, i) => {
        const state = i < current ? 'done' : i === current ? 'current' : 'todo';
        const label = (dealKind === 'order' ? step.labelOrder : step.labelReceive) ?? step.label;
        return (
          <li key={step.label} className={`flow-step ${state}`}>
            <span className="flow-no" aria-hidden="true">
              {state === 'done' ? '\u2713' : i + 1}
            </span>
            <span className="flow-label">
              {label}
              {state === 'current' && <span className="flow-now">いまここ</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
