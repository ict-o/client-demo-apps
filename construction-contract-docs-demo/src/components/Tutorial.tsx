import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { tutorialSteps, type TutorialUntil } from '../data/tutorial';

interface TutorialProps {
  /** 現在のステップ番号（0始まり）。null のときは表示しない */
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

/** HashRouter の現在の画面（例 "/import"） */
const currentPath = () => window.location.hash.replace(/^#/, '') || '/';

function isMet(until: TutorialUntil): boolean {
  if (until.pathPrefix && !currentPath().startsWith(until.pathPrefix)) return false;
  if (until.selector && !document.querySelector(until.selector)) return false;
  return true;
}

/**
 * ゲームのチュートリアルのように、画面の一部をスポットライトで照らして操作を案内する。
 * 「やってみよう」のステップは、利用者が実際に操作して条件を満たすと自動で次へ進む。
 */
export function Tutorial({ index, onChangeIndex, onClose }: TutorialProps) {
  const navigate = useNavigate();
  const [rect, setRect] = useState<Rect | null>(null);
  /** 照らしている場所に重ならないよう、パネルを画面の上下どちらに出すか */
  const [place, setPlace] = useState<'top' | 'bottom'>('bottom');
  /** 利用者が「たたむ／ひらく」を押したときの指定（ステップごと） */
  const [foldChoice, setFoldChoice] = useState<{ id: string; folded: boolean } | null>(null);
  const [doneId, setDoneId] = useState<string | null>(null);
  const step = index === null ? null : tutorialSteps[index];
  const done = step !== null && doneId === step.id;

  // navigate は画面が変わるたびに作り直されるため、ref に入れて「ステップが変わったとき」だけ移動する
  const navigateRef = useRef(navigate);
  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);

  // ステップが変わったら、そのステップの画面へ移動する
  useEffect(() => {
    if (!step) return;
    const here = currentPath();
    if (step.path && here !== step.path) navigateRef.current(step.path);
    else if (!step.path && step.fallbackPath && !here.startsWith('/project/')) navigateRef.current(step.fallbackPath);
  }, [step]);

  // 照らす要素の位置を測る（画面遷移・入力による高さの変化・スクロールに追従）
  const measure = useCallback(() => {
    const el = step?.anchor ? document.querySelector<HTMLElement>(`[data-tour="${step.anchor}"]`) : null;
    if (!el) {
      setRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setRect({ top: r.top - 8, left: r.left - 8, width: r.width + 16, height: r.height + 16 });
    // 照らす場所の上と下で、空きが大きい側にパネルを出す（行ったり来たりしないよう、差が小さいときは今のまま）
    const above = r.top;
    const below = window.innerHeight - r.bottom;
    setPlace(prev => (prev === 'bottom' ? (above > below + 60 ? 'top' : 'bottom') : below > above + 60 ? 'bottom' : 'top'));
  }, [step]);

  useEffect(() => {
    if (!step) return;
    const scroll = window.setTimeout(() => {
      const el = step.anchor ? document.querySelector<HTMLElement>(`[data-tour="${step.anchor}"]`) : null;
      if (!el) return;
      // 画面の高さより大きい要素は、先頭が見える位置までスクロールする
      const tall = el.getBoundingClientRect().height > window.innerHeight * 0.6;
      el.scrollIntoView({ block: tall ? 'start' : 'center', behavior: 'smooth' });
    }, 120);
    const tick = window.setInterval(measure, 300);
    const first = window.setTimeout(measure, 40);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.clearTimeout(scroll);
      window.clearTimeout(first);
      window.clearInterval(tick);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [step, measure]);

  // 「やってみよう」の操作ができたら、「できました」を見せてから次へ進む。
  // ステップを開いた時点ですでに条件を満たしている（戻ってきた等）ときは、自動では進めない。
  useEffect(() => {
    if (!step?.until || index === null) return;
    const until = step.until;
    let initial: boolean | null = null;
    let advance: number | undefined;
    const poll = window.setInterval(() => {
      const ok = isMet(until);
      if (initial === null) {
        initial = ok;
        if (ok) {
          setDoneId(step.id);
          window.clearInterval(poll);
        }
        return;
      }
      if (ok) {
        setDoneId(step.id);
        window.clearInterval(poll);
        advance = window.setTimeout(() => onChangeIndex(index + 1), 1100);
      }
    }, 250);
    return () => {
      window.clearInterval(poll);
      window.clearTimeout(advance);
    };
  }, [step, index, onChangeIndex]);

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
  const isLast = index === tutorialSteps.length - 1;
  const waiting = Boolean(step.action) && !done;
  // スマホ幅で操作してもらう間は、押す場所を隠さないよう説明をたたんでおく
  const narrow = window.matchMedia('(max-width: 760px)').matches;
  const folded = foldChoice?.id === step.id ? foldChoice.folded : narrow && waiting;

  return (
    <>
      {rect && (
        <div
          className={waiting ? 'tour-spot action' : 'tour-spot'}
          aria-hidden="true"
          style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }}
        />
      )}

      <div
        className={`tour-panel ${place}${folded ? ' folded' : ''}`}
        role="dialog"
        aria-modal="false"
        aria-label="チュートリアル"
      >
        <div className="tour-head">
          <span className="tour-count">
            ステップ {index + 1} / {tutorialSteps.length}
          </span>
          <span className="row gap-8">
            <button className="tour-close" onClick={() => setFoldChoice({ id: step.id, folded: !folded })} aria-expanded={!folded}>
              {folded ? 'ひらく' : 'たたむ'}
            </button>
            <button className="tour-close" onClick={onClose} aria-label="チュートリアルを終了する">
              終了
            </button>
          </span>
        </div>
        <div className="tour-progress" aria-hidden="true">
          <span style={{ width: `${((index + (done ? 1 : 0.5)) / tutorialSteps.length) * 100}%` }} />
        </div>
        <h2 className="tour-title">{step.title}</h2>
        <p className="tour-body">{step.body}</p>

        {step.action && (
          <div className={done ? 'tour-task done' : 'tour-task'} aria-live="polite">
            {done ? (
              <strong>✓ できました！</strong>
            ) : (
              <>
                <strong>やってみよう</strong>
                {step.action}
              </>
            )}
          </div>
        )}

        <div className="tour-actions">
          <button className="btn btn-secondary btn-sm" onClick={() => onChangeIndex(index - 1)} disabled={isFirst}>
            戻る
          </button>
          {isLast ? (
            <button className="btn btn-primary btn-sm" onClick={onClose}>
              チュートリアルを終える
            </button>
          ) : waiting ? (
            <button className="btn btn-secondary btn-sm" onClick={() => onChangeIndex(index + 1)}>
              この手順をとばす
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
  userName: string;
  onStart: () => void;
  onClose: () => void;
}

/** ログイン直後の案内（チュートリアルを始めるか、自分で操作するかを選ぶ） */
export function WelcomeDialog({ userName, onStart, onClose }: WelcomeProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="welcome-overlay" role="dialog" aria-modal="true" aria-label="はじめての方へ">
      <div className="welcome-card">
        <div className="welcome-eyebrow">はじめての方へ</div>
        <h2 className="welcome-title">{userName} さん、ようこそ</h2>
        <p className="welcome-lead">
          このシステムでは、Excel の見積書を取り込むだけで、注文書・注文請書・基本契約書（約款）が自動でできあがります。
          はじめての方は、実際に操作しながら覚えられるチュートリアル（約3分）からどうぞ。
        </p>
        <ul className="welcome-list">
          <li>光っているところを押していくだけで、見積書の取り込みから契約成立まで体験できます</li>
          <li>チュートリアルは、画面右上の「チュートリアル」からいつでもやり直せます</li>
          <li>表示されている会社名・金額はすべて架空のサンプルです</li>
        </ul>
        <div className="welcome-actions">
          <button className="btn btn-primary btn-lg" onClick={onStart}>
            チュートリアルを始める（約3分）
          </button>
          <button className="btn btn-secondary btn-lg" onClick={onClose}>
            自分で操作する
          </button>
        </div>
      </div>
    </div>
  );
}
