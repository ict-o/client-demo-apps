import { useCallback, useMemo, useState } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import type { DocKind, Partner, Project, QuoteItem, ContractTerms } from './types';
import { partners as initialPartners, sampleProjects, CURRENT_USER } from './data/sampleData';
import { generateDocuments } from './utils/docs';
import { nowIso, todayIso } from './utils/format';
import { Layout } from './components/Layout';
import { ToastContainer, type ToastState } from './components/Toast';
import { ProjectList } from './pages/ProjectList';
import { ProjectDetail } from './pages/ProjectDetail';
import { ProjectNew } from './pages/ProjectNew';
import { PartnerMaster } from './pages/PartnerMaster';

let seq = 5000;
function nextId(prefix: string) {
  seq += 1;
  return `${prefix}-${seq}`;
}

export interface ProjectActions {
  /** 見積書を確定して発注者へ送付（発注案件では受領見積の確定） */
  submitQuote: (projectId: string, isOrderDeal: boolean) => void;
  /** 見積書から注文書・注文請書・約款を自動生成する */
  generateDocs: (projectId: string) => void;
  /** 書類を送付済みにする */
  sendDoc: (projectId: string, kind: DocKind) => void;
  /** 押印済み書類の受領を登録する */
  receiveSealed: (projectId: string, kind: DocKind) => void;
  /** 注文請書を送付して受注確定にする（受注案件） */
  confirmAcceptance: (projectId: string) => void;
  /** 工事完了・引渡しを登録する */
  completeProject: (projectId: string) => void;
  /** 書類一式を1ファイルにまとめて出力する */
  exportBundle: (projectId: string, projectNo: string) => string;
  /** 見積明細の更新 */
  updateItem: (projectId: string, itemId: string, patch: Partial<QuoteItem>) => void;
  addItem: (projectId: string) => void;
  removeItem: (projectId: string, itemId: string) => void;
  updateDiscount: (projectId: string, discount: number) => void;
  /** 契約条件（建設業法の記載事項）の更新 */
  updateTerms: (projectId: string, terms: ContractTerms) => void;
}

export default function App() {
  const [projects, setProjects] = useState<Project[]>(sampleProjects);
  const [partners, setPartners] = useState<Partner[]>(initialPartners);
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((message: string, type: ToastState['type'] = 'success') => {
    setToast({ message, type });
  }, []);

  const mutate = useCallback(
    (projectId: string, updater: (p: Project) => Project, action?: string | ((p: Project) => string)) => {
      setProjects(prev =>
        prev.map(p => {
          if (p.id !== projectId) return p;
          const updated = updater(p);
          const actionText = typeof action === 'function' ? action(p) : action;
          return {
            ...updated,
            updatedAt: nowIso(),
            history: actionText
              ? [...updated.history, { id: nextId('hx'), at: nowIso(), actorName: CURRENT_USER.name, action: actionText }]
              : updated.history,
          };
        }),
      );
    },
    [],
  );

  const setDocStatus = (p: Project, kind: DocKind, status: Project['documents'][number]['status']): Project => ({
    ...p,
    documents: p.documents.map(d => (d.kind === kind ? { ...d, status, issuedOn: d.issuedOn ?? todayIso() } : d)),
  });

  const actions: ProjectActions = useMemo(
    () => ({
      submitQuote: (projectId, isOrderDeal) => {
        mutate(
          projectId,
          p => ({
            ...setDocStatus(p, 'quote', 'sent'),
            status: p.status === 'draft' ? 'quoted' : p.status,
          }),
          isOrderDeal ? '協力会社から受領した見積書を確定しました' : '見積書を発注者へ送付しました',
        );
        showToast(
          isOrderDeal
            ? '受領見積を確定しました。ステータスを「見積提出済」に更新しました'
            : '見積書を送付しました。ステータスを「見積提出済」に更新しました',
        );
      },

      generateDocs: projectId => {
        mutate(
          projectId,
          p => ({ ...p, documents: generateDocuments(p, todayIso()) }),
          '見積書から注文書・注文請書・基本契約書（約款）を自動生成しました',
        );
        showToast('注文書・注文請書・基本契約書（約款）を自動生成しました');
      },

      sendDoc: (projectId, kind) => {
        const label = kind === 'order' ? '注文書' : kind === 'acceptance' ? '注文請書' : kind === 'terms' ? '基本契約書（約款）' : '見積書';
        mutate(
          projectId,
          p => {
            const next = setDocStatus(p, kind, 'sent');
            // 協力会社への発注案件では、注文書の送付をもって「注文書発行済」に進める
            if (kind === 'order' && p.dealKind === 'order' && p.status === 'quoted') {
              return { ...next, status: 'ordered' };
            }
            return next;
          },
          `${label}を送付しました`,
        );
        showToast(`${label}を送付しました`);
      },

      receiveSealed: (projectId, kind) => {
        const label = kind === 'order' ? '注文書' : kind === 'acceptance' ? '注文請書' : '基本契約書（約款）';
        mutate(
          projectId,
          p => {
            let next = setDocStatus(p, kind, 'sealed');
            if (kind === 'order' && p.dealKind === 'receive') {
              next = { ...next, status: 'ordered' };
            }
            if (kind === 'acceptance' && p.dealKind === 'order') {
              next = { ...setDocStatus(next, 'terms', 'sealed'), status: 'accepted' };
            }
            return next;
          },
          `押印済みの${label}を受領しました`,
        );
        showToast(`押印済みの${label}を受領しました`);
      },

      confirmAcceptance: projectId => {
        mutate(
          projectId,
          p => ({ ...setDocStatus(setDocStatus(p, 'acceptance', 'sent'), 'terms', 'sealed'), status: 'accepted' }),
          '注文請書を送付し、受注確定としました',
        );
        showToast('注文請書を送付しました。ステータスを「受注確定」に更新しました');
      },

      completeProject: projectId => {
        mutate(projectId, p => ({ ...p, status: 'completed' }), '工事完了・引渡しを登録しました');
        showToast('工事完了・引渡しを登録しました');
      },

      exportBundle: (projectId, projectNo) => {
        const fileName = `${projectNo}_工事関係書類一式.pdf`;
        mutate(
          projectId,
          p => ({ ...p, bundleFileName: fileName }),
          `書類一式（見積書・注文書・注文請書・約款）を1ファイル「${fileName}」として出力しました`,
        );
        showToast('書類一式（4点）を1ファイルにまとめて出力しました');
        return fileName;
      },

      updateItem: (projectId, itemId, patch) => {
        mutate(projectId, p => ({
          ...p,
          revision: p.revision + 1,
          items: p.items.map(it => (it.id === itemId ? { ...it, ...patch } : it)),
        }));
      },

      addItem: projectId => {
        mutate(projectId, p => ({
          ...p,
          revision: p.revision + 1,
          items: [...p.items, { id: nextId('it'), name: '', spec: '', quantity: 1, unit: '式', unitPrice: 0 }],
        }));
      },

      removeItem: (projectId, itemId) => {
        mutate(projectId, p => ({
          ...p,
          revision: p.revision + 1,
          items: p.items.filter(it => it.id !== itemId),
        }));
        showToast('明細を1行削除しました', 'info');
      },

      updateDiscount: (projectId, discount) => {
        mutate(projectId, p => ({ ...p, revision: p.revision + 1, discount }));
      },

      updateTerms: (projectId, terms) => {
        mutate(projectId, p => ({ ...p, revision: p.revision + 1, terms }), '契約条件を更新しました');
        showToast('契約条件を保存しました。書類の記載内容へ反映されます');
      },
    }),
    [mutate, showToast],
  );

  const addProject = useCallback(
    (project: Project) => {
      setProjects(prev => [project, ...prev]);
      showToast(`見積書 ${project.documents[0].no} を作成しました`);
    },
    [showToast],
  );

  const savePartner = useCallback(
    (partner: Partner) => {
      setPartners(prev => {
        const exists = prev.some(p => p.id === partner.id);
        return exists ? prev.map(p => (p.id === partner.id ? partner : p)) : [partner, ...prev];
      });
      showToast(`${partner.name} の情報を保存しました。関連する書類へ自動反映されます`);
    },
    [showToast],
  );

  const newPartnerId = useCallback(() => nextId('p'), []);
  const newProjectId = useCallback(() => nextId('kj'), []);

  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<ProjectList projects={projects} partners={partners} />} />
          <Route
            path="/new"
            element={<ProjectNew partners={partners} projects={projects} onCreate={addProject} newId={newProjectId} onToast={showToast} />}
          />
          <Route
            path="/project/:id"
            element={<ProjectDetail projects={projects} partners={partners} actions={actions} onToast={showToast} />}
          />
          <Route
            path="/partners"
            element={<PartnerMaster partners={partners} projects={projects} onSave={savePartner} newId={newPartnerId} />}
          />
        </Routes>
      </Layout>
      <ToastContainer toast={toast} onClose={() => setToast(null)} />
    </HashRouter>
  );
}
