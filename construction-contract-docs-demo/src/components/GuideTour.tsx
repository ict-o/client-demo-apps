import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface GuideTourProps {
  onClose: () => void;
}

interface Step {
  /** 見出し（ステップ番号は自動で付けない。①②の丸数字は本文側で使う） */
  title: string;
  /** 本文。むずかしい言い方を避け、押す場所をそのまま書く */
  body: string;
  /** 画面のどこを押すかを示す簡易図 */
  figure: React.ReactNode;
}

/**
 * はじめて触る人向けのガイドツアー。
 * 画面を開いた最初の1回だけ自動で表示し、ヘッダーの「使い方」からいつでも開き直せる。
 * 開いている間だけ描画する想定なので、開き直すたびに最初のステップから始まる。
 */
export function GuideTour({ onClose }: GuideTourProps) {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const nextRef = useRef<HTMLButtonElement>(null);

  const steps: Step[] = [
    {
      title: 'このシステムでできること',
      body:
        '見積書を取り込むだけで、建設業法で必要な書類4点（見積書・注文書・注文請書・基本契約書）が1つの案件にそろいます。' +
        '入力していただくのは、工期と支払い方法など4つだけです。',
      figure: <FigureOverview />,
    },
    {
      title: '① 見積書を取り込みます',
      body:
        '画面の上にあるメニューから「見積書を取り込む」を押し、一覧から見積書のファイルを1つ選びます。' +
        '工事名・取引先・明細・金額は、システムが自動で読み取ります。',
      figure: <FigureImport />,
    },
    {
      title: '② 3つの書類を作ります',
      body:
        '案件の画面に出ている「次にやること」の青いボタンを押すだけです。' +
        '注文書・注文請書・基本契約書が、取り込んだ見積書の内容のまま作られます。入力はいりません。',
      figure: <FigureNextAction />,
    },
    {
      title: '③ 注文書・注文請書をやりとりします',
      body:
        '押印済みの注文書を受け取ったら、ボタンを1つ押します。つづけて注文請書を送れば契約成立です。' +
        'いまどこまで進んでいるかは、画面の上の4つのステップで分かります。',
      figure: <FigureFlow />,
    },
    {
      title: '④ 書類4点を1つのファイルにまとめます',
      body:
        '「書類」タブの「1つのファイルにまとめる」を押すと、4点をまとめたファイルができます。' +
        '案件番号で保管してください。法律で保存が必要な書類がこれ1つでそろいます。',
      figure: <FigureBundle />,
    },
    {
      title: '迷ったら、この3つを見てください',
      body:
        '操作の順番を覚える必要はありません。画面がそのつど「次に何をすればよいか」を教えてくれます。',
      figure: <FigureHints />,
    },
  ];

  const total = steps.length;
  const step = steps[index];
  const isLast = index === total - 1;

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // ステップが変わるたびに主ボタンへフォーカスを移し、キーボードだけでも進められるようにする
  useEffect(() => {
    nextRef.current?.focus();
  }, [index]);

  const finish = () => {
    onClose();
    navigate('/import');
  };

  return (
    <div className="guide-overlay no-print" role="presentation" onClick={onClose}>
      <div
        className="guide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="guide-title"
        onClick={e => e.stopPropagation()}
      >
        <div className="guide-head">
          <div>
            <div className="guide-kicker">はじめての方へ</div>
            <h2 className="guide-title" id="guide-title">{step.title}</h2>
          </div>
          <div className="guide-head-right">
            <span className="guide-count" aria-hidden="true">{index + 1} / {total}</span>
            <button className="guide-close" onClick={onClose} aria-label="ガイドを閉じる">&times;</button>
          </div>
        </div>

        <div className="guide-body">
          <p className="guide-text">{step.body}</p>
          <div className="guide-figure">{step.figure}</div>
        </div>

        <div className="guide-foot">
          <div className="guide-dots" role="tablist" aria-label="ガイドのステップ">
            {steps.map((s, i) => (
              <button
                key={s.title}
                role="tab"
                aria-selected={i === index}
                aria-label={`${i + 1}ページ目：${s.title}`}
                className={i === index ? 'guide-dot active' : 'guide-dot'}
                onClick={() => setIndex(i)}
              />
            ))}
          </div>
          <div className="guide-actions">
            {index > 0 ? (
              <button className="btn btn-secondary" onClick={() => setIndex(index - 1)}>
                ← 前へ
              </button>
            ) : (
              <button className="btn btn-ghost" onClick={onClose}>
                とばして使う
              </button>
            )}
            {isLast ? (
              <button className="btn btn-primary btn-lg" ref={nextRef} onClick={finish}>
                見積書を取り込んでみる
              </button>
            ) : (
              <button className="btn btn-primary btn-lg" ref={nextRef} onClick={() => setIndex(index + 1)}>
                次へ →
              </button>
            )}
          </div>
        </div>

        <p className="guide-note">
          このガイドは、画面右上の「使い方」からいつでも見直せます。
        </p>
      </div>
    </div>
  );
}

/* ===== 各ステップの簡易図（実際の画面の見た目に寄せた説明用の絵） ===== */

function FigureOverview() {
  return (
    <div className="gfig">
      <div className="gfig-row">
        <span className="gfig-file">見積書<br />（Excel）</span>
        <span className="gfig-arrow" aria-hidden="true">→</span>
        <span className="gfig-sys">取り込む</span>
        <span className="gfig-arrow" aria-hidden="true">→</span>
        <span className="gfig-docs">
          <span className="gfig-doc">見積書</span>
          <span className="gfig-doc">注文書</span>
          <span className="gfig-doc">注文請書</span>
          <span className="gfig-doc">基本契約書</span>
        </span>
      </div>
      <div className="gfig-caption">取り込んだ内容が、そのまま4点の書類になります</div>
    </div>
  );
}

function FigureImport() {
  return (
    <div className="gfig">
      <div className="gfig-nav">
        <span>工事案件の一覧</span>
        <span className="on">見積書を取り込む</span>
        <span>取引先</span>
      </div>
      <div className="gfig-filerow">
        <span className="gfig-xls" aria-hidden="true">XLS</span>
        <span className="gfig-filetext">
          <span className="gfig-filename">見積書_〇〇建設_排気ダクト更新.xlsx</span>
          <span className="gfig-filemeta">株式会社〇〇建設／受注</span>
        </span>
        <span className="gfig-cta">この見積書を取り込む</span>
      </div>
      <div className="gfig-caption">この行を押すだけ。工事名も金額も自動で入ります</div>
    </div>
  );
}

function FigureNextAction() {
  return (
    <div className="gfig">
      <div className="gfig-next">
        <span className="gfig-nextlabel">次にやること</span>
        <span className="gfig-nexttitle">注文書・注文請書・基本契約書（約款）を作ります</span>
        <span className="gfig-cta big">3つの書類を作る</span>
      </div>
      <div className="gfig-caption">迷ったら、この青いボタンを押してください</div>
    </div>
  );
}

function FigureFlow() {
  const steps = ['見積書の取り込み', '3つの書類を作る', '注文書・注文請書', '工事完了'];
  return (
    <div className="gfig">
      <div className="gfig-flow">
        {steps.map((s, i) => (
          <span key={s} className={`gfig-step ${i < 2 ? 'done' : i === 2 ? 'now' : ''}`}>
            <span className="gfig-stepno" aria-hidden="true">{i < 2 ? '✓' : i + 1}</span>
            {s}
          </span>
        ))}
      </div>
      <div className="gfig-caption">青い枠が「いまここ」。終わった手順には ✓ が付きます</div>
    </div>
  );
}

function FigureBundle() {
  return (
    <div className="gfig">
      <div className="gfig-row">
        <span className="gfig-docs">
          <span className="gfig-doc on">見積書</span>
          <span className="gfig-doc on">注文書</span>
          <span className="gfig-doc on">注文請書</span>
          <span className="gfig-doc on">基本契約書</span>
        </span>
        <span className="gfig-arrow" aria-hidden="true">→</span>
        <span className="gfig-file">KJ-2026-0031<br />工事関係書類一式</span>
      </div>
      <div className="gfig-caption">4点そろうと「1つのファイルにまとめる」が押せるようになります</div>
    </div>
  );
}

function FigureHints() {
  return (
    <div className="gfig">
      <ul className="gfig-hints">
        <li>
          <span className="gfig-hintbadge next">次にやること</span>
          いま何をすればよいかを、画面がひとつだけ教えてくれます
        </li>
        <li>
          <span className="gfig-hintbadge check">書類に必要な項目</span>
          入力の足りないところを教えてくれます。押すとその場所へ移動します
        </li>
        <li>
          <span className="gfig-hintbadge flow">進み具合</span>
          この案件がどこまで進んでいるかが、ひと目で分かります
        </li>
      </ul>
    </div>
  );
}
