import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Project } from '../types';
import { isGenerated } from '../utils/docs';

interface Props {
  projects: Project[];
}

/** 画面上のボタン名を、本文中でボタンらしく見せる */
function Ui({ children }: { children: ReactNode }) {
  return <span className="ui-name">{children}</span>;
}

const FLOW = ['見積書を取り込む', '3つの書類を作る', '注文書・約款を受け取る', '注文請書を送る', '工事完了・書類をまとめる'];

export function Guide({ projects }: Props) {
  const navigate = useNavigate();

  /** 手順に合った状態の案件を開く。見つからなければ一覧を開く */
  const openProject = (match: (p: Project) => boolean) => {
    const target = projects.find(match);
    navigate(target ? `/project/${target.id}` : '/');
  };

  const steps: { title: string; body: ReactNode; hint: ReactNode; action: { label: string; onClick: () => void } }[] = [
    {
      title: '取引先を登録する（はじめに一度だけ）',
      body: (
        <>
          上のメニューの <Ui>取引先</Ui> を開きます。1社ずつ登録するときは <Ui>取引先を登録する</Ui>、
          一覧表からまとめて登録するときは <Ui>Excel・CSVで一括登録</Ui> を押します。
        </>
      ),
      hint: '支払条件を登録しておくと、見積書を取り込んだときに「代金の支払い方法」へ自動で入ります。',
      action: { label: '取引先を開く', onClick: () => navigate('/partners') },
    },
    {
      title: '見積書を取り込む',
      body: (
        <>
          上のメニューの <Ui>見積書を取り込む</Ui> を開き、取り込みたいファイルの <Ui>この見積書を取り込む</Ui> を押します。
          取引先・工事名・明細・金額が自動で入ります。
        </>
      ),
      hint: '見積書はこれまでどおり Excel で作り、共有フォルダに保存してください。',
      action: { label: '見積書を取り込む画面を開く', onClick: () => navigate('/import') },
    },
    {
      title: '4つの項目を入力して登録する',
      body: (
        <>
          見積書に書かれていない「工事を始める日」「工事が終わる日」「工事ができない日・時間帯」「代金の支払い方法」を入力し、
          <Ui>この内容で登録する</Ui> を押します。
        </>
      ),
      hint: '入力が足りない欄には、赤い文字でお知らせが出ます。検査・引渡しなどの取り決めは約款に入っているので、入力は不要です。',
      action: { label: '見積書を取り込む画面を開く', onClick: () => navigate('/import') },
    },
    {
      title: '3つの書類を作る',
      body: (
        <>
          案件の画面で、<Ui>次にやること</Ui> の <Ui>3つの書類を作る</Ui> を押します。注文書・注文請書・基本契約書（約款）ができます。
          中身は <Ui>書類</Ui> タブの <Ui>書類の中身を見る</Ui> で確認・印刷できます。
        </>
      ),
      hint: '見積書の内容がそのまま入るので、書き写しは必要ありません。',
      action: { label: '書類を作る前の案件を開く', onClick: () => openProject(p => p.status === 'imported' && !isGenerated(p)) },
    },
    {
      title: '注文書・約款を受け取り、注文請書を送る',
      body: (
        <>
          お客様から押印済みの注文書と基本契約書（約款）が届いたら <Ui>注文書・約款を受け取った</Ui> を押します。約款は「締結済み」になります。
          注文請書を送ったら <Ui>注文請書を送った</Ui> を押すと、契約成立です。
        </>
      ),
      hint: 'お客様が注文書を出さない場合は、ここで作った注文書に押印をいただくだけで大丈夫です。',
      action: {
        label: '注文書を受け取る前の案件を開く',
        onClick: () => openProject(p => (p.status === 'imported' && isGenerated(p)) || p.status === 'ordered'),
      },
    },
    {
      title: '工事完了を登録し、書類をまとめる',
      body: (
        <>
          工事が終わったら <Ui>工事が完了した</Ui> を押します。<Ui>1つのファイルにまとめる</Ui> を押すと、
          見積書・注文書・注文請書・約款の4点を1つのファイルにして保管できます。
        </>
      ),
      hint: 'まとめたファイルは、案件番号の名前で保存されます。',
      action: { label: '契約成立した案件を開く', onClick: () => openProject(p => p.status === 'accepted') },
    },
  ];

  const faqs: { q: string; a: ReactNode }[] = [
    {
      q: '次に何をすればよいか分からない',
      a: (
        <>
          案件の画面の <Ui>次にやること</Ui> に出ているボタンを押してください。手が止まっている案件は、
          一覧の <Ui>対応が必要</Ui> を押すと探せます。
        </>
      ),
    },
    {
      q: '「書類に必要な項目が〇件足りません」と出た',
      a: <>案件の画面の <Ui>足りない項目を入力する</Ui> を押し、赤く表示された項目を入力して保存してください。</>,
    },
    {
      q: '見積書の金額が変わった',
      a: (
        <>
          Excel の見積書を直してから、<Ui>見積書の内容</Ui> タブの <Ui>見積書を差し替える</Ui> を押します。
          そのあと <Ui>3つの書類を作り直す</Ui> を押すと、書類が新しい金額になります。
        </>
      ),
    },
    {
      q: '取引先の住所や支払条件が変わった',
      a: <>メニューの <Ui>取引先</Ui> で、その会社の行を押して直し、<Ui>保存する</Ui> を押してください。書類の記載にも反映されます。</>,
    },
    {
      q: '誰がいつ操作したか確認したい',
      a: <>案件の画面の <Ui>これまでの記録</Ui> タブに、操作した人と日時が残っています。</>,
    },
  ];

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">操作ガイド</h1>
          <p className="page-sub">
            はじめて使う方向けの手順です。上から順に進めれば、見積書の取り込みから書類4点の保管まで完了します。
          </p>
        </div>
      </div>

      <div className="card card-pad mb-16">
        <h2 className="section-title"><span className="bar" />仕事の流れ</h2>
        <ol className="guide-flow">
          {FLOW.map((f, i) => (
            <li key={f}>
              <span className="guide-flow-no">{i + 1}</span>
              {f}
            </li>
          ))}
        </ol>
        <div className="alert alert-info mt-16">
          <span aria-hidden="true">i</span>
          <div>
            迷ったときは、案件の画面の <Ui>次にやること</Ui> を見てください。次に押すボタンが、いつも1つだけ大きく表示されます。
          </div>
        </div>
      </div>

      <ol className="guide-steps">
        {steps.map((s, i) => (
          <li key={s.title} className="card card-pad guide-step">
            <div className="guide-step-no" aria-hidden="true">{i + 1}</div>
            <div className="grow">
              <h2 className="guide-step-title">
                <span className="visually-hidden">手順{i + 1}：</span>
                {s.title}
              </h2>
              <p className="guide-step-body">{s.body}</p>
              <p className="guide-step-hint">
                <span className="fw-700">ポイント：</span>
                {s.hint}
              </p>
              <button className="btn btn-secondary mt-12" onClick={s.action.onClick}>
                {s.action.label}
              </button>
            </div>
          </li>
        ))}
      </ol>

      <div className="card card-pad mt-16">
        <h2 className="section-title"><span className="bar" />困ったときは</h2>
        <dl className="guide-faq">
          {faqs.map(f => (
            <div key={f.q}>
              <dt>{f.q}</dt>
              <dd>{f.a}</dd>
            </div>
          ))}
        </dl>
      </div>
    </>
  );
}
