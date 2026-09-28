import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Partner } from '../types';
import {
  IMPORT_COLUMNS,
  ImportError,
  SAMPLE_IMPORT_FILE_NAME,
  buildImportRows,
  readTable,
  sampleImportTable,
  templateCsv,
  type ImportAction,
  type ImportRow,
} from '../utils/partnerImport';

interface Props {
  partners: Partner[];
  onImport: (rows: ImportRow[]) => void;
  onToast: (message: string, type?: 'success' | 'info' | 'error') => void;
}

const STEPS = ['ファイルを選ぶ', '内容を確認して登録する'];

const ACTION_LABEL: Record<ImportAction, string> = {
  new: '新しく登録',
  update: '情報を更新',
  error: '登録できません',
};

export function PartnerImport({ partners, onImport, onToast }: Props) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState<ImportRow[] | null>(null);
  const [error, setError] = useState('');
  const [reading, setReading] = useState(false);
  const [dragging, setDragging] = useState(false);

  const load = async (file: File) => {
    setReading(true);
    setError('');
    try {
      const table = await readTable(file);
      const built = buildImportRows(table, partners);
      setFileName(file.name);
      setRows(built);
      onToast(`「${file.name}」を読み取りました。内容をご確認ください`, 'info');
    } catch (e) {
      setError(e instanceof ImportError ? e.message : 'ファイルを読み取れませんでした。ひな形の形式で保存されているか確認してください。');
    } finally {
      setReading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const loadSample = () => {
    setError('');
    setFileName(SAMPLE_IMPORT_FILE_NAME);
    setRows(buildImportRows(sampleImportTable(), partners));
    onToast(`「${SAMPLE_IMPORT_FILE_NAME}」を読み取りました。内容をご確認ください`, 'info');
  };

  const downloadTemplate = () => {
    const url = URL.createObjectURL(templateCsv());
    const a = document.createElement('a');
    a.href = url;
    a.download = '取引先一括登録_ひな形.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    onToast('ひな形（CSV）をダウンロードしました。Excel で開いて入力できます');
  };

  const reset = () => {
    setRows(null);
    setFileName('');
    setError('');
  };

  const counts = {
    new: rows?.filter(r => r.action === 'new').length ?? 0,
    update: rows?.filter(r => r.action === 'update').length ?? 0,
    error: rows?.filter(r => r.action === 'error').length ?? 0,
  };
  const registrable = counts.new + counts.update;

  const submit = () => {
    if (!rows || registrable === 0) return;
    onImport(rows);
    navigate('/partners');
  };

  const step = rows ? 1 : 0;

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">取引先を一括登録する</h1>
          <p className="page-sub">
            Excel（.xlsx）または CSV で作った取引先の一覧を取り込み、まとめて登録します。会社名が同じ取引先は、新しい内容で更新します。
          </p>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/partners')}>
          取引先の一覧に戻る
        </button>
      </div>

      <ol className="steps" aria-label="一括登録の手順">
        {STEPS.map((s, i) => (
          <li key={s} className={i === step ? 'step active' : i < step ? 'step done' : 'step'}>
            <span className="step-no">{i < step ? '✓' : i + 1}</span>
            {s}
          </li>
        ))}
      </ol>

      {!rows && (
        <>
          <div className="card card-pad mb-16">
            <h2 className="section-title"><span className="bar" />取り込むファイルを選んでください</h2>
            <label
              className={dragging ? 'dropzone dragging' : 'dropzone'}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => {
                e.preventDefault();
                setDragging(false);
                const file = e.dataTransfer.files[0];
                if (file) void load(file);
              }}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.csv"
                className="visually-hidden"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) void load(file);
                }}
              />
              <span className="dropzone-title">{reading ? 'ファイルを読み取っています…' : 'ここにファイルをドラッグするか、押してファイルを選んでください'}</span>
              <span className="dropzone-sub">Excel（.xlsx）・CSV（.csv）に対応しています</span>
              <span className="btn btn-primary btn-lg mt-12" aria-hidden="true">ファイルを選ぶ</span>
            </label>

            {error && (
              <div className="alert alert-error mt-16" role="alert">
                <span aria-hidden="true">!</span>
                <div>{error}</div>
              </div>
            )}

            <div className="row gap-10 wrap mt-16">
              <button className="btn btn-secondary" onClick={downloadTemplate}>ひな形（CSV）をダウンロード</button>
              <button className="btn btn-secondary" onClick={loadSample}>サンプルファイルで試す</button>
            </div>
          </div>

          <div className="card card-pad">
            <h2 className="section-title"><span className="bar" />ファイルの作り方</h2>
            <ol className="howto">
              <li>1行目に見出し、2行目から1行に1社ずつ入力します。ひな形の2行目は記入例なので、消してから入力してください。</li>
              <li>見出しは次の名前にしてください。<strong>必須</strong>の列は空欄にできません。</li>
            </ol>
            <div className="table-wrap mt-12">
              <table className="data">
                <thead>
                  <tr>
                    {IMPORT_COLUMNS.map(c => (
                      <th key={c.key}>
                        {c.label}
                        {c.required && <span className="req-tag">必須</span>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>株式会社〇〇商事</td>
                    <td>総務部</td>
                    <td>山田 太郎</td>
                    <td className="tnum">000-0000</td>
                    <td>東京都〇〇区〇〇0-0-0</td>
                    <td className="tnum">03-0000-0000</td>
                    <td>月末締め翌月末 銀行振込</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="field-hint">
              Excel で保存するときは「Excel ブック（.xlsx）」か「CSV」を選んでください。会社名がすでに登録されている取引先は、新しい内容で上書きされます。
            </p>
          </div>
        </>
      )}

      {rows && (
        <>
          <div className="card card-pad mb-16">
            <h2 className="section-title"><span className="bar" />読み取った内容</h2>
            <p className="fs-14 text-sub mb-12">ファイル：<span className="fw-700">{fileName}</span>（{rows.length} 件）</p>
            <div className="import-summary">
              <div className="import-count new"><span className="import-count-num tnum">{counts.new}</span>件<span className="import-count-label">新しく登録</span></div>
              <div className="import-count update"><span className="import-count-num tnum">{counts.update}</span>件<span className="import-count-label">情報を更新</span></div>
              <div className="import-count error"><span className="import-count-num tnum">{counts.error}</span>件<span className="import-count-label">登録できません</span></div>
            </div>
            {counts.error > 0 && (
              <div className="alert alert-warning mt-16">
                <span aria-hidden="true">!</span>
                <div>
                  「登録できません」の行は登録されません。ファイルを直して取り込み直すか、そのまま残りの取引先だけを登録できます。
                </div>
              </div>
            )}
          </div>

          <div className="table-wrap mb-16">
            <table className="data">
              <thead>
                <tr>
                  <th className="num">行</th>
                  <th>登録のしかた</th>
                  <th>会社名</th>
                  <th>担当者</th>
                  <th>所在地・電話番号</th>
                  <th>支払条件</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.line} className={r.action === 'error' ? 'row-error' : undefined}>
                    <td className="num">{r.line}</td>
                    <td>
                      <span className={`import-badge ${r.action}`}>{ACTION_LABEL[r.action]}</span>
                      {r.errors.map(e => (
                        <div key={e} className="fs-13 text-error fw-600 mt-4">{e}</div>
                      ))}
                    </td>
                    <td style={{ minWidth: '180px' }} className="fw-600">{r.values.name || <span className="text-error">（空欄）</span>}</td>
                    <td>
                      <div>{r.values.contactName || <span className="text-error">（空欄）</span>}</div>
                      <div className="fs-13 text-sub">{r.values.department}</div>
                    </td>
                    <td style={{ minWidth: '220px' }}>
                      <div className="fs-14">{r.values.postalCode && `〒${r.values.postalCode} `}{r.values.address || <span className="text-error">（空欄）</span>}</div>
                      <div className="fs-13 text-sub">{r.values.tel ? `TEL ${r.values.tel}` : <span className="text-error">電話番号が空欄</span>}</div>
                    </td>
                    <td className="fs-14">{r.values.paymentTerms || <span className="text-sub">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="row between wrap gap-12">
            <button className="btn btn-secondary" onClick={reset}>別のファイルを選び直す</button>
            <div className="row gap-10 wrap" style={{ alignItems: 'center' }}>
              {registrable === 0 && <span className="fs-14 text-error fw-600">登録できる取引先がありません</span>}
              <button className="btn btn-primary btn-lg" onClick={submit} disabled={registrable === 0}>
                {registrable} 件を登録する
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
