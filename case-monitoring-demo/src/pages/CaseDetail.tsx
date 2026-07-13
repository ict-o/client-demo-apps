import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Case, Checkpoint } from '../types';
import type { AppActions } from '../App';
import {
  CASE_STATUS_LABELS, CASE_STATUS_TONE,
  CHECK_STATUS_LABELS, CHECK_STATUS_TONE,
} from '../types';
import { caseStatus, progressPercent } from '../utils/domain';
import { formatDate, formatDateTime, formatYen, daysUntil } from '../utils/format';
import { Badge } from '../components/Badge';
import { ProgressBar } from '../components/ProgressBar';
import { Modal } from '../components/Modal';
import { EmptyState } from '../components/EmptyState';

interface CaseDetailProps {
  cases: Case[];
  actions: AppActions;
}

export function CaseDetail({ cases, actions }: CaseDetailProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const found = cases.find(c => c.id === id);

  const [defectTarget, setDefectTarget] = useState<Checkpoint | null>(null);
  const [note, setNote] = useState('');
  const [noteError, setNoteError] = useState('');

  if (!found) {
    return (
      <div>
        <button className="btn btn-ghost btn-sm mb-16" onClick={() => navigate('/cases')}>‹ 案件一覧へ戻る</button>
        <div className="card"><EmptyState title="案件が見つかりません" desc="指定された案件は存在しないか、削除された可能性があります。" /></div>
      </div>
    );
  }

  const st = caseStatus(found.checkpoints);
  const percent = progressPercent(found.checkpoints);
  const doneCount = found.checkpoints.filter(c => c.status === 'done').length;

  const openDefect = (cp: Checkpoint) => {
    setDefectTarget(cp);
    setNote('');
    setNoteError('');
  };

  const submitDefect = () => {
    if (note.trim().length < 5) {
      setNoteError('不備の内容を5文字以上で入力してください');
      return;
    }
    actions.reportDefect(found.id, defectTarget!.id, note.trim());
    setDefectTarget(null);
  };

  return (
    <div>
      <button className="btn btn-ghost btn-sm mb-16" onClick={() => navigate('/cases')}>‹ 案件一覧へ戻る</button>

      <div className="page-head">
        <div>
          <div className="row gap-8 wrap mb-8">
            <span className="tag">{found.code}</span>
            <Badge tone={CASE_STATUS_TONE[st]} label={CASE_STATUS_LABELS[st]} />
          </div>
          <div className="page-title">{found.title}</div>
          <div className="page-sub">{found.client}</div>
        </div>
      </div>

      {/* 案件情報 */}
      <div className="card card-pad mb-16">
        <div className="info-grid">
          <div className="info-item"><div className="k">主担当</div><div className="v">{found.owner}</div></div>
          <div className="info-item"><div className="k">担当部署</div><div className="v">{found.department}</div></div>
          <div className="info-item"><div className="k">受注日</div><div className="v">{formatDate(found.orderDate)}</div></div>
          <div className="info-item"><div className="k">完了期限</div><div className="v">{formatDate(found.dueDate)}</div></div>
          <div className="info-item"><div className="k">受注金額</div><div className="v" style={{ fontWeight: 700 }}>{formatYen(found.amount)}</div></div>
        </div>
        <div className="divider" />
        <div className="row gap-12 wrap" style={{ justifyContent: 'space-between' }}>
          <div style={{ flex: 1, minWidth: '220px' }}>
            <div className="fs-12 text-sub mb-8">進捗（確認事項 {doneCount} / {found.checkpoints.length} 完了）</div>
            <ProgressBar percent={percent} status={st} />
          </div>
        </div>
      </div>

      {/* 確認事項（チェック項目） */}
      <div className="section-title"><span className="bar" />確認事項の進捗</div>
      <div className="card card-pad mb-24">
        {found.checkpoints.map((cp, i) => {
          const overdue = cp.status !== 'done' && daysUntil(cp.dueDate) < 0;
          const markerLabel = cp.status === 'done' ? '✓' : String(i + 1);
          return (
            <div className="step" key={cp.id}>
              <div className={`step-marker ${cp.status}`}>{markerLabel}</div>
              <div className="step-main">
                <div className="step-head">
                  <span className="step-name">{cp.name}</span>
                  <Badge tone={CHECK_STATUS_TONE[cp.status]} label={CHECK_STATUS_LABELS[cp.status]} />
                </div>
                <div className="step-meta">
                  <span>担当：{cp.owner}</span>
                  <span className={overdue ? 'overdue' : ''}>
                    期限：{formatDate(cp.dueDate)}
                    {overdue && `（${Math.abs(daysUntil(cp.dueDate))}日超過）`}
                  </span>
                  {cp.completedDate && <span>完了日：{formatDate(cp.completedDate)}</span>}
                </div>
                {cp.note && <div className="step-note">⚠ 不備報告：{cp.note}</div>}

                {cp.status !== 'done' && (
                  <div className="step-actions">
                    {(cp.status === 'pending' || cp.status === 'flagged') && (
                      <button className="btn btn-secondary btn-sm" onClick={() => actions.setCheckStatus(found.id, cp.id, 'in_progress')}>
                        着手する
                      </button>
                    )}
                    <button className="btn btn-success btn-sm" onClick={() => actions.setCheckStatus(found.id, cp.id, 'done')}>
                      完了にする
                    </button>
                    {cp.status !== 'flagged' && (
                      <button className="btn btn-danger-outline btn-sm" onClick={() => openDefect(cp)}>
                        不備を報告
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 活動履歴 */}
      <div className="section-title"><span className="bar" />活動履歴</div>
      <div className="card card-pad">
        <div className="timeline">
          {[...found.events].reverse().map(ev => (
            <div className="tl-item" key={ev.id}>
              <span className="tl-dot" />
              <div className="tl-time">{formatDateTime(ev.at)}</div>
              <div className="tl-text"><span className="tl-actor" style={{ marginRight: '8px' }}>{ev.actor}</span>{ev.text}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 不備報告モーダル */}
      <Modal
        isOpen={defectTarget !== null}
        onClose={() => setDefectTarget(null)}
        title="不備を報告"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setDefectTarget(null)}>キャンセル</button>
            <button className="btn btn-primary" onClick={submitDefect}>報告して管理者へ通知</button>
          </>
        }
      >
        <p className="fs-13 text-sub mb-12">
          確認事項「<span className="fw-600" style={{ color: 'var(--text)' }}>{defectTarget?.name}</span>」に不備を登録します。
          報告すると管理者へ即時に通知（アラート）が送信されます。
        </p>
        <div className="field">
          <label className="field-label" htmlFor="defect-note">不備の内容<span className="req">必須</span></label>
          <textarea
            id="defect-note"
            className={`textarea ${noteError ? 'invalid' : ''}`}
            placeholder="例：検収テストで連携エラーが残存。修正対応中のため完了できない。"
            value={note}
            onChange={e => { setNote(e.target.value); if (noteError) setNoteError(''); }}
          />
          {noteError && <span className="field-error">{noteError}</span>}
        </div>
      </Modal>
    </div>
  );
}
