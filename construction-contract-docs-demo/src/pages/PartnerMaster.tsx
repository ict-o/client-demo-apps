import { useMemo, useState } from 'react';
import type { Partner, PartnerKind, Project } from '../types';
import { PARTNER_KIND_LABELS } from '../types';
import { EmptyState } from '../components/EmptyState';
import { Modal } from '../components/Modal';

interface Props {
  partners: Partner[];
  projects: Project[];
  onSave: (partner: Partner) => void;
  newId: () => string;
}

const EMPTY: Omit<Partner, 'id'> = {
  name: '',
  kind: 'client',
  department: '',
  contactName: '',
  postalCode: '',
  address: '',
  tel: '',
  email: '',
  licenseNo: '',
  paymentTerms: '',
  note: '',
};

export function PartnerMaster({ partners, projects, onSave, newId }: Props) {
  const [keyword, setKeyword] = useState('');
  const [kind, setKind] = useState<PartnerKind | 'all'>('all');
  const [editing, setEditing] = useState<Partner | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const projectCount = useMemo(() => {
    const map = new Map<string, number>();
    projects.forEach(p => map.set(p.partnerId, (map.get(p.partnerId) ?? 0) + 1));
    return map;
  }, [projects]);

  const filtered = partners.filter(p => {
    if (kind !== 'all' && p.kind !== kind) return false;
    const kw = keyword.trim();
    if (!kw) return true;
    return [p.name, p.contactName, p.address, p.department].join(' ').includes(kw);
  });

  const openNew = () => {
    setEditing({ id: newId(), ...EMPTY });
    setIsNew(true);
    setErrors({});
  };

  const openEdit = (partner: Partner) => {
    setEditing({ ...partner });
    setIsNew(false);
    setErrors({});
  };

  const save = () => {
    if (!editing) return;
    const e: Record<string, string> = {};
    if (!editing.name.trim()) e.name = '会社名を入力してください';
    if (!editing.contactName.trim()) e.contactName = '担当者名を入力してください';
    if (!editing.address.trim()) e.address = '所在地を入力してください';
    if (!editing.tel.trim()) e.tel = '電話番号を入力してください';
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    onSave(editing);
    setEditing(null);
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">取引先マスタ</h1>
          <div className="page-sub">
            ここで登録した会社名・所在地・支払条件が、見積書・注文書・注文請書・約款へ自動反映されます（全 {partners.length} 件）
          </div>
        </div>
        <button className="btn btn-primary" onClick={openNew}>＋ 取引先を登録</button>
      </div>

      <div className="filter-bar">
        <div className="search">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
          </svg>
          <label htmlFor="pkw" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
            取引先の検索
          </label>
          <input id="pkw" className="input" value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="会社名・担当者名・所在地で検索" />
        </div>
        <select className="select" style={{ width: 'auto' }} value={kind} onChange={e => setKind(e.target.value as PartnerKind | 'all')} aria-label="区分で絞り込み">
          <option value="all">区分：すべて</option>
          <option value="client">発注者（得意先）</option>
          <option value="subcontractor">協力会社（下請）</option>
        </select>
        {(keyword.trim() || kind !== 'all') && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setKeyword(''); setKind('all'); }}>
            絞り込みを解除
          </button>
        )}
      </div>

      <div className="fs-12 text-sub mb-8">{filtered.length} 件を表示中</div>

      {filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            title="該当する取引先はありません"
            desc="検索条件を変更するか、新しく取引先を登録してください。"
            action={<button className="btn btn-secondary btn-sm" onClick={openNew}>取引先を登録する</button>}
          />
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>会社名 / 区分</th>
                <th>担当者</th>
                <th>所在地 / 連絡先</th>
                <th>建設業許可番号</th>
                <th>支払条件</th>
                <th className="num">関連案件</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="clickable" onClick={() => openEdit(p)}>
                  <td>
                    <div className="fw-600">{p.name}</div>
                    <span className={p.kind === 'subcontractor' ? 'tag tag-order mt-4' : 'tag tag-receive mt-4'}>
                      {PARTNER_KIND_LABELS[p.kind]}
                    </span>
                  </td>
                  <td>
                    <div>{p.contactName} 様</div>
                    <div className="fs-12 text-sub">{p.department}</div>
                  </td>
                  <td style={{ minWidth: '230px' }}>
                    <div className="fs-12">〒{p.postalCode} {p.address}</div>
                    <div className="fs-12 text-sub">TEL {p.tel}</div>
                  </td>
                  <td className="fs-12">
                    {p.licenseNo ? p.licenseNo : p.kind === 'subcontractor'
                      ? <span style={{ color: 'var(--error)', fontWeight: 600 }}>未登録（要確認）</span>
                      : <span className="text-sub">—</span>}
                  </td>
                  <td className="fs-12">{p.paymentTerms || <span className="text-sub">—</span>}</td>
                  <td className="num">{projectCount.get(p.id) ?? 0} 件</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={editing !== null}
        onClose={() => setEditing(null)}
        title={isNew ? '取引先の新規登録' : '取引先情報の編集'}
        width={640}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setEditing(null)}>キャンセル</button>
            <button className="btn btn-primary" onClick={save}>保存する</button>
          </>
        }
      >
        {editing && (
          <>
            <div className="alert alert-info mb-16">
              <span aria-hidden="true">i</span>
              <div>保存した内容は、この取引先の見積書・注文書・注文請書・約款の記載へ自動的に反映されます。</div>
            </div>

            <div className="field">
              <span className="field-label">区分</span>
              <div className="row gap-10 wrap">
                {(['client', 'subcontractor'] as PartnerKind[]).map(k => (
                  <label
                    key={k}
                    className="row gap-8"
                    style={{
                      border: `1px solid ${editing.kind === k ? 'var(--accent)' : 'var(--border-strong)'}`,
                      background: editing.kind === k ? 'var(--accent-soft)' : 'var(--card)',
                      borderRadius: 'var(--radius-md)',
                      padding: '10px 14px',
                      cursor: 'pointer',
                      minHeight: '44px',
                    }}
                  >
                    <input type="radio" name="pkind" checked={editing.kind === k} onChange={() => setEditing({ ...editing, kind: k })} />
                    <span className="fs-13 fw-600">{PARTNER_KIND_LABELS[k]}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="field">
              <label className="field-label" htmlFor="p-name">会社名<span className="req">必須</span></label>
              <input id="p-name" className={errors.name ? 'input invalid' : 'input'} value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} />
              {errors.name && <span className="field-error">{errors.name}</span>}
              <div className="field-hint">デモ用のため、会社名の固有部分は「〇〇」で表記しています。</div>
            </div>

            <div className="form-grid">
              <div className="field">
                <label className="field-label" htmlFor="p-dept">部署</label>
                <input id="p-dept" className="input" value={editing.department} onChange={e => setEditing({ ...editing, department: e.target.value })} />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="p-contact">担当者名<span className="req">必須</span></label>
                <input id="p-contact" className={errors.contactName ? 'input invalid' : 'input'} value={editing.contactName} onChange={e => setEditing({ ...editing, contactName: e.target.value })} />
                {errors.contactName && <span className="field-error">{errors.contactName}</span>}
              </div>
            </div>

            <div className="form-grid">
              <div className="field">
                <label className="field-label" htmlFor="p-post">郵便番号</label>
                <input id="p-post" className="input" value={editing.postalCode} onChange={e => setEditing({ ...editing, postalCode: e.target.value })} />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="p-tel">電話番号<span className="req">必須</span></label>
                <input id="p-tel" className={errors.tel ? 'input invalid' : 'input'} value={editing.tel} onChange={e => setEditing({ ...editing, tel: e.target.value })} />
                {errors.tel && <span className="field-error">{errors.tel}</span>}
              </div>
            </div>

            <div className="field">
              <label className="field-label" htmlFor="p-addr">所在地<span className="req">必須</span></label>
              <input id="p-addr" className={errors.address ? 'input invalid' : 'input'} value={editing.address} onChange={e => setEditing({ ...editing, address: e.target.value })} />
              {errors.address && <span className="field-error">{errors.address}</span>}
            </div>

            <div className="field">
              <label className="field-label" htmlFor="p-mail">メールアドレス</label>
              <input id="p-mail" className="input" value={editing.email} onChange={e => setEditing({ ...editing, email: e.target.value })} />
            </div>

            <div className="field">
              <label className="field-label" htmlFor="p-lic">建設業許可番号</label>
              <input id="p-lic" className="input" value={editing.licenseNo} onChange={e => setEditing({ ...editing, licenseNo: e.target.value })} />
              <div className="field-hint">
                協力会社へ発注する場合、許可番号の確認・記録が必要です（未登録の場合は法令チェックで不足として表示されます）。
              </div>
            </div>

            <div className="field">
              <label className="field-label" htmlFor="p-pay">支払条件</label>
              <input id="p-pay" className="input" value={editing.paymentTerms} onChange={e => setEditing({ ...editing, paymentTerms: e.target.value })} />
            </div>

            <div className="field">
              <label className="field-label" htmlFor="p-note">備考</label>
              <textarea id="p-note" className="textarea" value={editing.note} onChange={e => setEditing({ ...editing, note: e.target.value })} />
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
