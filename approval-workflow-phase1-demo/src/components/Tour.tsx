import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { tourSteps } from '../data/guide';

interface TourProps {
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
export function Tour({ index, onChangeIndex, onClose }: TourProps) {
  const navigate = useNavigate();
  const [rect, setRect] = useState<Rect | null>(null);
  const step = index === null ? null : tourSteps[index];

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
  const isLast = index === tourSteps.length - 1;

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
            ステップ {index + 1} / {tourSteps.length}
          </span>
          <button className="tour-close" onClick={onClose} aria-label="ガイド付きツアーを終了する">
            終了
          </button>
        </div>
        <div className="tour-progress" aria-hidden="true">
          <span style={{ width: `${((index + 1) / tourSteps.length) * 100}%` }} />
        </div>
        <h2 className="tour-title">{step.title}</h2>
        <p className="tour-body">{step.body}</p>
        {step.hint && (
          <p className="tour-hint">
            <strong>試せる操作</strong>
            {step.hint}
          </p>
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
              次へ
            </button>
          )}
        </div>
      </div>
    </>
  );
}

interface WelcomeProps {
  onStartTour: () => void;
  onOpenGuide: () => void;
  onClose: () => void;
}

/** 初回表示の案内（ツアーを始めるか、自分で操作するかを選ぶ） */
export function WelcomeDialog({ onStartTour, onOpenGuide, onClose }: WelcomeProps) {
  return (
    <div className="welcome-overlay" role="dialog" aria-modal="true" aria-label="デモの操作案内">
      <div className="welcome-card">
        <div className="welcome-eyebrow">デモンストレーション</div>
        <h2 className="welcome-title">契約ワークフロー管理システム（フェーズ1）</h2>
        <p className="welcome-lead">
          ログイン・権限管理 → 申請 → 多段階承認 → 電子契約での締結 → 紙・電子の契約台帳 → 会計システムへのCSV出力までを、実際に操作しながら確認できます。
          はじめての方は、画面を案内するガイド付きツアー（約4分）からどうぞ。
        </p>
        <ul className="welcome-list">
          <li>表示されている企業名・担当者名・金額はすべて架空のサンプルです</li>
          <li>操作内容はブラウザのメモリ内だけで保持され、再読み込みで初期状態に戻ります</li>
          <li>フェーズ1の機能範囲に絞ったデモです。外部システムとの連携は会計システム（CSV）のみです</li>
        </ul>
        <div className="welcome-actions">
          <button className="btn btn-primary btn-lg" onClick={onStartTour}>
            ガイド付きツアーを始める（約4分）
          </button>
          <button className="btn btn-secondary btn-lg" onClick={onOpenGuide}>
            操作ガイドを読む
          </button>
          <button className="btn btn-ghost btn-lg" onClick={onClose}>
            自分で操作する
          </button>
        </div>
      </div>
    </div>
  );
}
