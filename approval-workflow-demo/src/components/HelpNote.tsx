import { helpFor } from '../data/guide';

interface HelpNoteProps {
  /** 現在の画面のパス */
  pathname: string;
  /** 「かんたん説明」を表示するか */
  visible: boolean;
  /** 説明を閉じる（ヘッダーのボタンから戻せる） */
  onHide: () => void;
}

/**
 * 画面ごとの「かんたん説明」。
 * パソコン操作に不慣れな方向けに、その画面で何ができるかを日本語で示す。
 */
export function HelpNote({ pathname, visible, onHide }: HelpNoteProps) {
  const help = helpFor(pathname);
  if (!visible || !help) return null;

  return (
    <aside className="help-note" aria-label={`${help.name}のかんたん説明`}>
      <span className="help-icn" aria-hidden="true">
        ?
      </span>
      <div className="help-body">
        <div className="help-title">この画面（{help.name}）でできること</div>
        <ul className="help-lines">
          {help.lines.map(l => (
            <li key={l}>{l}</li>
          ))}
        </ul>
        {help.next && <div className="help-next">つぎにやってみること：{help.next}</div>}
      </div>
      <button className="help-hide" onClick={onHide}>
        説明を隠す
      </button>
    </aside>
  );
}
