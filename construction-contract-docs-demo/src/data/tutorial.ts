// はじめて使う人向けのチュートリアル（実際に画面を操作しながら進める）

/** 次へ進む条件。満たされると「できました」を表示して自動で次へ進む */
export interface TutorialUntil {
  /** この文字で始まる画面に移ったら */
  pathPrefix?: string;
  /** この要素が画面に現れたら */
  selector?: string;
}

export interface TutorialStep {
  id: string;
  title: string;
  body: string;
  /** このステップで表示する画面（省略時は画面を移動しない） */
  path?: string;
  /** 案件の画面を使うステップで、案件の画面以外にいるときに開く案件 */
  fallbackPath?: string;
  /** 強調表示する要素（data-tour 属性の値） */
  anchor?: string;
  /** 「やってみよう」で案内する操作。条件 until を満たすと自動で次へ進む */
  action?: string;
  until?: TutorialUntil;
}

/** 案件の画面の「次にやること」が、指定の段階になったか */
const stage = (s: string) => `[data-tour="next-action"][data-stage="${s}"]`;

/** 取り込みをとばした場合に使う、書類を作る前の案件 */
const SAMPLE_PROJECT = '/project/kj-0036';

export const tutorialSteps: TutorialStep[] = [
  {
    id: 'intro',
    title: 'チュートリアルを始めます',
    body:
      '見積書を取り込んでから、注文書・注文請書・基本契約書（約款）ができて契約成立するまでを、実際に操作しながら体験します。全13ステップ、約3分です。「やってみよう」の手順は、光っているところを押すと自動で次へ進みます。',
    path: '/',
  },
  {
    id: 'list',
    title: '工事案件の一覧',
    body:
      'ここが最初の画面です。「対応が必要」を見れば、書類づくりが止まっている案件がすぐに分かります。押すと、その案件だけに絞り込めます。',
    path: '/',
    anchor: 'status-tiles',
  },
  {
    id: 'open-import',
    title: '見積書を取り込む画面を開く',
    body: '新しい工事は、Excel で作った見積書を取り込むところから始まります。',
    path: '/',
    anchor: 'nav-import',
    action: '上のメニューの「見積書を取り込む」を押してみましょう。',
    until: { pathPrefix: '/import' },
  },
  {
    id: 'pick-file',
    title: '取り込む見積書を選ぶ',
    body: '共有フォルダに保存された見積書が並んでいます。見積書はこれまでどおり Excel で作れば大丈夫です。',
    path: '/import',
    anchor: 'quote-files',
    action: 'どれか1つの「この見積書を取り込む」を押してみましょう。取引先・明細・金額が自動で入ります。',
    until: { selector: '[data-tour="terms-form"]' },
  },
  {
    id: 'terms',
    title: '4つの項目を入力する',
    body:
      '入力するのは、見積書に書かれていない工期・工事ができない日・支払い方法だけです。支払い方法は、取引先の登録内容から自動で入っています。工期は任意なので、まだ決まっていなければ空欄のままで大丈夫です（注文書を受け取ってから入力できます）。確認したら「次へ」を押してください。',
    anchor: 'terms-form',
  },
  {
    id: 'register',
    title: '案件として登録する',
    body: '見積書の内容と入力した4項目で、工事案件が1件できあがります。入力が足りないときは、赤い文字で教えてくれます。',
    anchor: 'register-button',
    action: '「この内容で登録する」を押してみましょう。',
    until: { pathPrefix: '/project/' },
  },
  {
    id: 'generate',
    title: '3つの書類を作る',
    body: '案件の画面では、「次にやること」に押すボタンがいつも1つだけ表示されます。迷ったらここを見てください。',
    fallbackPath: SAMPLE_PROJECT,
    anchor: 'next-button',
    action: '「3つの書類を作る」を押してみましょう。',
    until: { selector: stage('imported-gen') },
  },
  {
    id: 'docs',
    title: '書類ができました',
    body:
      '注文書・注文請書・基本契約書（約款）ができ、見積書の取引先・工事名・金額がそのまま入っています。「書類の中身を見る」で中身を確認・印刷できます。',
    fallbackPath: SAMPLE_PROJECT,
    anchor: 'doc-cards',
  },
  {
    id: 'receive',
    title: '注文書・約款を受け取る',
    body:
      'お客様から押印済みの注文書と約款が届いたら、ここで記録します。約款は「締結済み」になります。注文書を出さないお客様には、ここで作った注文書に押印をもらうだけで大丈夫です。',
    fallbackPath: SAMPLE_PROJECT,
    anchor: 'next-button',
    action: '「注文書・約款を受け取った」を押してみましょう。',
    until: { selector: stage('ordered-gen') },
  },
  {
    id: 'accept',
    title: '注文請書を送る',
    body: 'ここで作った注文請書は、そのままお客様へ送れます。送ったことを記録すると契約成立です。',
    fallbackPath: SAMPLE_PROJECT,
    anchor: 'next-button',
    action: '「注文請書を送った」を押してみましょう。',
    until: { selector: stage('accepted-gen') },
  },
  {
    id: 'check',
    title: '書類の抜け漏れも自動でチェック',
    body:
      '「書類に必要な項目」で、書類に書くべき内容がそろっているかを常に確認しています。足りないときは、ここから入力画面に移れます。',
    fallbackPath: SAMPLE_PROJECT,
    anchor: 'check-panel',
  },
  {
    id: 'partners',
    title: '取引先は1社ずつでも、まとめてでも',
    body:
      '取引先の会社名・所在地・支払条件は、ここで登録すると書類に自動で入ります。Excel・CSV の一覧から、まとめて登録することもできます。',
    path: '/partners',
    anchor: 'partner-actions',
  },
  {
    id: 'finish',
    title: 'チュートリアルは以上です',
    body:
      'おつかれさまでした。見積書の取り込みから契約成立までの流れを、ひととおり体験できました。迷ったときは、案件の画面の「次にやること」を見てください。チュートリアルは、画面右上の「チュートリアル」からいつでもやり直せます。',
    path: '/',
  },
];
