import { useState } from 'react';
import type { Project, ScanUpload, SealedKind } from '../types';
import { Modal } from './Modal';

interface Props {
  project: Project;
  /** アップロードする書類。登録済みの書類を指定したときは差し替えになる */
  targets: SealedKind[];
  onClose: () => void;
  onRegister: (scans: Partial<Record<SealedKind, ScanUpload>>) => void;
}

const LABEL: Record<SealedKind, string> = {
  order: '注文書',
  terms: '基本契約書（約款）',
};

const ACCEPT = '.pdf,.jpg,.jpeg,.png';
const MAX_MB = 20;

/** 取り込めるファイルか確かめる。問題があれば日本語の理由を返す */
function checkFile(file: File): string | null {
  if (!/\.(pdf|jpe?g|png)$/i.test(file.name)) return 'PDF か写真（JPG・PNG）のファイルを選んでください。';
  if (file.size > MAX_MB * 1024 * 1024) return `ファイルが大きすぎます（${MAX_MB}MB まで）。`;
  return null;
}

function toUpload(file: File): ScanUpload {
  return {
    fileName: file.name,
    sizeKb: Math.max(1, Math.round(file.size / 1024)),
    url: URL.createObjectURL(file),
    mime: file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
  };
}

const formatSize = (kb: number) => (kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`);

/**
 * お客様から返ってきた押印済みの注文書・基本契約書（約款）を登録する。
 * 電子契約は使わず、紙で押印された書類をスキャンした PDF や写真を案件に保管する。
 */
export function SealedUploadModal({ project, targets, onClose, onRegister }: Props) {
  const replacing = targets.every(k => project.documents.find(d => d.kind === k)?.status === 'sealed');
  const canCombine = targets.length > 1;
  const [combined, setCombined] = useState(false);
  const [files, setFiles] = useState<Partial<Record<SealedKind | 'both', ScanUpload>>>({});
  const [errors, setErrors] = useState<Partial<Record<SealedKind | 'both', string>>>({});
  const [confirmed, setConfirmed] = useState(false);

  const slots: (SealedKind | 'both')[] = combined ? ['both'] : targets;
  const slotLabel = (s: SealedKind | 'both') => (s === 'both' ? targets.map(k => LABEL[k]).join('と') : LABEL[s]);

  const pick = (slot: SealedKind | 'both', file: File | undefined) => {
    if (!file) return;
    const problem = checkFile(file);
    setErrors(prev => ({ ...prev, [slot]: problem ?? undefined }));
    if (!problem) setFiles(prev => ({ ...prev, [slot]: toUpload(file) }));
  };

  const clear = (slot: SealedKind | 'both') => {
    setFiles(prev => ({ ...prev, [slot]: undefined }));
  };

  /** 実演用：スキャンしたファイルを選んだことにする */
  const useSample = () => {
    const next: Partial<Record<SealedKind | 'both', ScanUpload>> = {};
    for (const s of slots) {
      const name = s === 'both' ? `押印済み_注文書・約款_${project.no}.pdf` : `押印済み_${LABEL[s].replace(/（.*）/, '')}_${project.no}.pdf`;
      next[s] = { fileName: name, sizeKb: s === 'both' ? 1486 : 842, mime: 'application/pdf' };
    }
    setFiles(next);
    setErrors({});
  };

  const missing = slots.filter(s => !files[s]).map(slotLabel);
  const ready = missing.length === 0 && confirmed;

  const submit = () => {
    if (!ready) return;
    const scans: Partial<Record<SealedKind, ScanUpload>> = {};
    for (const k of targets) scans[k] = combined ? files.both : files[k];
    onRegister(scans);
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={replacing ? `押印済みの${targets.map(k => LABEL[k]).join('・')}を差し替える` : 'お客様から届いた押印済みの書類を登録する'}
      width={680}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>やめる</button>
          <button className="btn btn-primary" onClick={submit} disabled={!ready} data-tour="upload-submit">
            {replacing ? '差し替える' : '登録する'}
          </button>
        </>
      }
    >
      <p className="fs-15 mb-12">
        お客様の記名押印がある書類を、スキャンした PDF かスマートフォンで撮った写真でアップロードしてください。
        {!replacing && '登録すると基本契約書（約款）は締結済みになり、案件は次の段階へ進みます。'}
      </p>

      {canCombine && (
        <label className="check-line mb-12">
          <input
            type="checkbox"
            checked={combined}
            onChange={e => {
              setCombined(e.target.checked);
              setFiles({});
              setErrors({});
            }}
          />
          注文書と約款を1つのファイルにまとめてスキャンした
        </label>
      )}

      <div className="upload-slots">
        {slots.map(slot => {
          const file = files[slot];
          return (
            <div className="upload-slot" key={slot}>
              <div className="upload-slot-head">
                <span className="fw-700">{slotLabel(slot)}</span>
                <span className="req-tag">必須</span>
                <span className="fs-13 text-sub">お客様の記名押印があるもの</span>
              </div>
              {file ? (
                <div className="upload-file">
                  <span className="file-icon pdf" aria-hidden="true">{file.mime?.startsWith('image/') ? 'IMG' : 'PDF'}</span>
                  <div className="grow" style={{ minWidth: 0 }}>
                    <div className="fw-700 file-name">{file.fileName}</div>
                    <div className="fs-13 text-sub">{formatSize(file.sizeKb)}・アップロードの準備ができました</div>
                  </div>
                  <button className="btn btn-secondary btn-sm" onClick={() => clear(slot)}>取り消す</button>
                </div>
              ) : (
                <label
                  className="dropzone compact"
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => {
                    e.preventDefault();
                    pick(slot, e.dataTransfer.files[0]);
                  }}
                >
                  <input
                    type="file"
                    accept={ACCEPT}
                    className="visually-hidden"
                    aria-label={`${slotLabel(slot)}のファイルを選ぶ`}
                    onChange={e => {
                      pick(slot, e.target.files?.[0]);
                      e.target.value = '';
                    }}
                  />
                  <span className="dropzone-title">ファイルを選ぶ</span>
                  <span className="dropzone-sub">ここにドラッグしても選べます（PDF・JPG・PNG、{MAX_MB}MB まで）</span>
                </label>
              )}
              {errors[slot] && <span className="field-error" role="alert">{errors[slot]}</span>}
            </div>
          );
        })}
      </div>

      <button className="btn btn-secondary btn-sm mt-12" onClick={useSample}>
        サンプルファイルで試す
      </button>

      <label className="check-line confirm mt-16">
        <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} />
        お客様の記名押印があることを確認しました
      </label>

      {!ready && (
        <p className="fs-14 text-sub mt-8">
          {missing.length > 0
            ? `登録するには、${missing.join('・')}のファイルを選んでください。`
            : '登録するには、記名押印の確認にチェックを入れてください。'}
        </p>
      )}
    </Modal>
  );
}
