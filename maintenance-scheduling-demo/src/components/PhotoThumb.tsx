import type { WorkPhoto } from '../types';

/**
 * 現場写真のプレースホルダ。
 * デモのため実ファイルは扱わず、作業前/作業後が一目で分かる装飾サムネイルを描画する。
 */
export function PhotoThumb({ photo }: { photo: WorkPhoto }) {
  const before = photo.kind === 'before';
  const base = before ? '#8A97A0' : '#3E8E7E';
  const accent = before ? '#B4BFC6' : '#6FB9A7';
  const label = before ? '作業前' : '作業後';
  const badgeBg = before ? '#5B6B72' : '#2F7A6B';

  return (
    <svg className="thumb" viewBox="0 0 200 150" role="img" aria-label={`${label}の現場写真: ${photo.caption}`}>
      <rect width="200" height="150" fill={base} />
      <rect x="0" y="98" width="200" height="52" fill={accent} opacity="0.55" />
      <circle cx="158" cy="34" r="15" fill={accent} opacity="0.7" />
      <path d="M0 118 L46 84 L82 108 L128 70 L172 100 L200 82 L200 150 L0 150 Z" fill={accent} opacity="0.85" />
      <path d="M0 130 L58 104 L104 124 L150 96 L200 118 L200 150 L0 150 Z" fill={base} opacity="0.6" />
      <g opacity="0.9">
        <rect x="12" y="10" width="52" height="20" rx="10" fill={badgeBg} />
        <text x="38" y="24" fontSize="11" fontWeight="700" fill="#fff" textAnchor="middle" fontFamily="sans-serif">{label}</text>
      </g>
    </svg>
  );
}
