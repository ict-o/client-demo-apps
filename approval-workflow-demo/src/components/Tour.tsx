import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { TourStep } from '../data/guide';

export type TourCourse = 'full' | 'short';

interface TourProps {
  /** 表示するステップ（コースによって変わる） */
  steps: TourStep[];
  /** 現在のステップ番号（0始まり）。null のときツアーは非表示 */
  index: number | null;
  onChangeIndex: (next: number) => void;
  onClose: () => void;
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

/**
 * ガイド付きツアー。ステップごとに該当画面へ移動し、
 * data-tour 属性の付いた要素をスポットライトで強調する。
 */
export function Tour({ steps, index, onChangeIndex, onClose }: TourProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [rect, setRect] = useState<Rect | null>(null);
  const step = index === null ? null : steps[index];

  // ステップが変わったら該当画面へ移動する
  useEffect(() => {
    if (!step) return;
    navigate(step.path);
  }, [step, navigate]);

  // 強調対象の位置を測る（画面遷移・スクロール・リサイズに追従）
  const measure = useCallback(() => {
    if (!step?.anchor) {
      setRect(null);
      return;
    }
    const el = document.querySelector<HTMLElement>(`[data-tour="${step.anchor}"]`);
    if (!el) {
      setRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setRect({ top: r.top - 8, left: r.left - 8, width: r.width + 16, height: r.height + 16 });
  }, [step]);

  useEffect(() => {
    if (!step) return;
    const timers = [setTimeout(measure, 60), setTimeout(measure, 260)];
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [step, measure]);

  // 対象が画面外なら見える位置までスクロールする
  useEffect(() => {
    if (!step?.anchor) return;
    const el = document.querySelector<HTMLElement>(`[data-tour="${step.anchor}"]`);
    if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [step]);

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, onClose]);

  if (index === null || !step) return null;

  const isFirst = index === 0;
  const isLast = index === steps.length - 1;
  const currentPath = `${location.pathname}${location.search}`;
  const strayed = currentPath !== step.path;

  return (
    <>
      {rect && (
        <div
          className="tour-spot"
          aria-hidden="true"
          style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }}
        />
      )}

      <div className="tour-panel" role="dialog" aria-modal="false" aria-label="ガイド付きツアー">
        <div className="tour-head">
          <span className="tour-count">
            ステップ {index + 1} / {steps.length}
          </span>
          <button className="tour-close" onClick={onClose} aria-label="ガイド付きツアーを終了する">
            終了する
          </button>
        </div>
        <div className="tour-progress" aria-hidden="true">
          <span style={{ width: `${((index + 1) / steps.length) * 100}%` }} />
        </div>

        <h2 className="tour-title">{step.title}</h2>
        <p className="tour-body">{step.body}</p>

        {step.dos && step.dos.length > 0 && (
          <div className="tour-dos">
            <div className="tour-dos-head">このステップで見るところ・押すところ</div>
            <ul>
              {step.dos.map(d => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </div>
        )}

        {step.term && (
          <p className="tour-term">
            <strong>「{step.term.word}」とは</strong>
            {step.term.mean}
          </p>
        )}

        {strayed && (
          <button className="btn btn-ghost btn-sm tour-back" onClick={() => navigate(step.path)}>
            案内している画面に戻る
          </button>
        )}

        <div className="tour-actions">
          <button className="btn btn-secondary btn-sm" onClick={() => onChangeIndex(index - 1)} disabled={isFirst}>
            戻る
          </button>
          {isLast ? (
            <button className="btn btn-primary btn-sm" onClick={onClose}>
              ツアーを終了する
            </button>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={() => onChangeIndex(index + 1)}>
              次へ進む
            </button>
          )}
        </div>
      </div>
    </>
  );
}

interface WelcomeProps {
  onStartTour: (course: TourCourse) => void;
  onOpenGuide: () => void;
  onClose: () => void;
  /** 各コースのステップ数 */
  fullCount: number;
  shortCount: number;
}

/** 初回表示の案内（ツアーを始めるか、自分で操作するかを選ぶ） */
export function WelcomeDialog({ onStartTour, onOpenGuide, onClose, fullCount, shortCount }: WelcomeProps) {
  return (
    <div className="welcome-overlay" role="dialog" aria-modal="true" aria-label="デモの操作案内">
      <div className="welcome-card">
        <div className="welcome-eyebrow">デモンストレーション</div>
        <h2 className="welcome-title">承認ワークフロー・電子契約管理システム</h2>
        <p className="welcome-lead">
          申請 → 承認（不在のときは代理承認）→ 電子契約での締結 → 契約書の保管 → 会計システムへの連携までを、
          実際に操作しながら確認できます。パソコンの操作に不安がある方でも、案内のとおりに押していけば進められます。
        </p>
        <ul className="welcome-list">
          <li>表示されている会社名・担当者名・金額はすべて架空のサンプルです</li>
          <li>操作した内容は保存されません。画面を再読み込みすると最初の状態に戻ります</li>
          <li>外部のシステムとつながるのは会計システムだけです</li>
        </ul>
        <div className="welcome-actions">
          <button className="btn btn-primary btn-lg" onClick={() => onStartTour('full')}>
            はじめての方向け：詳しい案内（全{fullCount}ステップ・約8分）
          </button>
          <button className="btn btn-secondary btn-lg" onClick={() => onStartTour('short')}>
            要点だけ：短い案内（全{shortCount}ステップ・約5分）
          </button>
          <button className="btn btn-secondary btn-lg" onClick={onOpenGuide}>
            文章で読む：操作ガイドを開く
          </button>
          <button className="btn btn-ghost btn-lg" onClick={onClose}>
            案内なしで自分で操作する
          </button>
        </div>
      </div>
    </div>
  );
}
