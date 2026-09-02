// 電子契約（締結案件）まわりの判定・表示ヘルパー

import type { Envelope, EnvelopeStatus, Signer, SignerStatus } from '../types';

export function envelopeStatusMeta(status: EnvelopeStatus): { label: string; tone: string } {
  switch (status) {
    case 'sent':
      return { label: '送信済（署名待ち）', tone: 'warning' };
    case 'signing':
      return { label: '一部署名済', tone: 'info' };
    case 'completed':
      return { label: '締結済', tone: 'success' };
  }
}

export function signerStatusMeta(status: SignerStatus): { label: string; tone: string } {
  switch (status) {
    case 'waiting':
      return { label: '順番待ち', tone: 'muted' };
    case 'current':
      return { label: '署名待ち', tone: 'warning' };
    case 'signed':
      return { label: '署名済', tone: 'success' };
  }
}

/** 手続きが進行中（署名を待っている）状態か */
export function isInProgress(env: Envelope): boolean {
  return env.status === 'sent' || env.status === 'signing';
}

/** 次に署名する人（進行中でなければ undefined） */
export function nextSigner(env: Envelope): Signer | undefined {
  if (!isInProgress(env)) return undefined;
  return env.signers.find(s => s.status === 'current');
}

/** 署名の進捗（署名済 / 全体） */
export function signProgress(env: Envelope): { signed: number; total: number; percent: number } {
  const total = env.signers.length;
  const signed = env.signers.filter(s => s.status === 'signed').length;
  return { signed, total, percent: total === 0 ? 0 : Math.round((signed / total) * 100) };
}

/**
 * 書類のハッシュ値（改ざん検知の表示用）。
 * デモ表示のための疑似値で、暗号学的な用途には使いません。
 */
export function documentHash(seed: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x1000193;
  for (let i = 0; i < seed.length; i += 1) {
    h1 = Math.imul(h1 ^ seed.charCodeAt(i), 0x01000193) >>> 0;
    h2 = Math.imul(h2 + seed.charCodeAt(i) * (i + 7), 0x85ebca6b) >>> 0;
  }
  let out = '';
  for (let i = 0; i < 8; i += 1) {
    h1 = Math.imul(h1 ^ (h1 >>> 15), 0x2545f491) >>> 0;
    h2 = Math.imul(h2 ^ (h2 >>> 13), 0x9e3779b1) >>> 0;
    out += ((h1 ^ h2) >>> 0).toString(16).padStart(8, '0');
  }
  return out;
}

/** 署名欄に表示する書体の候補 */
export const SIGNATURE_FONTS = [
  { id: 'brush', label: '毛筆体', css: "'Yu Mincho', 'Hiragino Mincho ProN', serif" },
  { id: 'gothic', label: 'ゴシック体', css: "'Hiragino Sans', 'Noto Sans JP', sans-serif" },
  { id: 'mincho', label: '明朝体', css: "'Hiragino Mincho ProN', 'Yu Mincho', serif" },
] as const;

export type SignatureFontId = (typeof SIGNATURE_FONTS)[number]['id'];

export function signatureFontCss(id: SignatureFontId): string {
  return SIGNATURE_FONTS.find(f => f.id === id)?.css ?? SIGNATURE_FONTS[0].css;
}
