import { useCallback, useMemo, useState } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import type { ContractTerms, DocKind, Partner, Project, QuoteReadResult } from './types';
import { partners as initialPartners, sampleProjects, CURRENT_USER } from './data/sampleData';
import { generateDocuments } from './utils/docs';
import { nowIso, todayIso } from './utils/format';
import { Layout } from './components/Layout';
import { ToastContainer, type ToastState } from './components/Toast';
import { ProjectList } from './pages/ProjectList';
import { ProjectDetail } from './pages/ProjectDetail';
import { QuoteImport } from './pages/QuoteImport';
import { PartnerMaster } from './pages/PartnerMaster';

let seq = 5000;
function nextId(prefix: string) {
  seq += 1;
  return `${prefix}-${seq}`;
}

export interface ProjectActions {
  /** 見積書の内容から注文書・注文請書・約款を作る */
  generateDocs: (projectId: string) => void;
  /** 書類を送付済みにする */
  sendDoc: (projectId: string, kind: DocKind) => void;
  /** 押印済み書類の受領を登録する */
  receiveSealed: (projectId: string, kind: DocKind) => void;
  /** 注文請書を送付して契約成立にする（受注案件） */
  confirmAcceptance: (projectId: string) => void;
  /** 工事完了・引渡しを登録する */
  completeProject: (projectId: string) => void;
  /** 書類一式を1ファイルにまとめて出力する */
  exportBundle: (projectId: string, projectNo: string) => void;
  /** 工事の条件（工期・支払いなど）を保存する */
  updateTerms: (projectId: string, terms: ContractTerms) => void;
  /** 見積書を差し替えて、読み取り内容を入れ替える */
  replaceQuote: (projectId: string, fileName: string, read: QuoteReadResult) => void;
}

export default function App() {
  const [projects, setProjects] = useState<Project[]>(sampleProjects);
  const [partners, setPartners] = useState<Partner[]>(initialPartners);
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((message: string, type: ToastState['type'] = 'success') => {
    setToast({ message, type });
  }, []);

  const mutate = useCallback(
    (projectId: string, updater: (p: Project) => Project, action?: string) => {
      setProjects(prev =>
        prev.map(p => {
          if (p.id !== projectId) return p;
          const updated = updater(p);
          return {
            ...updated,
            updatedAt: nowIso(),
            history: action
              ? [...updated.history, { id: nextId('hx'), at: nowIso(), actorName: CURRENT_USER.name, action }]
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
      generateDocs: projectId => {
        mutate(
          projectId,
          p => ({ ...p, documents: generateDocuments(p, todayIso()) }),
          '見積書の内容から注文書・注文請書・基本契約書（約款）を作成しました',
        );
        showToast('注文書・注文請書・基本契約書（約款）を作成しました');
      },

      sendDoc: (projectId, kind) => {
        const label = kind === 'order' ? '注文書' : kind === 'acceptance' ? '注文請書' : '基本契約書（約款）';
        mutate(
          projectId,
          p => {
            const next = setDocStatus(p, kind, 'sent');
            // 協力会社への発注では、注文書を送った時点で「注文書を送付済み」に進める
            if (kind === 'order' && p.dealKind === 'order' && p.status === 'imported') {
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
          `押印済みの${label}を受け取りました`,
        );
        showToast(`押印済みの${label}を受け取りました`);
      },

      confirmAcceptance: projectId => {
        mutate(
          projectId,
          p => ({ ...setDocStatus(setDocStatus(p, 'acceptance', 'sent'), 'terms', 'sealed'), status: 'accepted' }),
          '注文請書を送付し、契約成立としました',
        );
        showToast('注文請書を送付しました。契約成立になりました');
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
          `書類4点を1つのファイル「${fileName}」にまとめて出力しました`,
        );
        showToast('書類4点を1つのファイルにまとめました');
      },

      updateTerms: (projectId, terms) => {
        mutate(projectId, p => ({ ...p, revision: p.revision + 1, terms }), '工事の条件を変更しました');
        showToast('工事の条件を保存しました。書類の記載に反映されます');
      },

      replaceQuote: (projectId, fileName, read) => {
        mutate(
          projectId,
          p => ({
            ...p,
            revision: p.revision + 1,
            title: read.title,
            site: read.site,
            scope: read.scope,
            quotedOn: read.quotedOn,
            quoteExpiry: read.quoteExpiry,
            items: read.items.map((it, i) => ({ ...it, id: `it-${p.no}-r${p.revision + 1}-${i + 1}` })),
            discount: read.discount,
            sourceFile: { name: fileName, importedAt: nowIso() },
          }),
          `見積書ファイル「${fileName}」に差し替えました`,
        );
        showToast('見積書を差し替えました。金額と工事内容を更新しました');
      },
    }),
    [mutate, showToast],
  );

  const addProject = useCallback(
    (project: Project) => {
      setProjects(prev => [project, ...prev]);
      showToast(`見積書を取り込み、案件 ${project.no} として登録しました`);
    },
    [showToast],
  );

  const savePartner = useCallback(
    (partner: Partner) => {
      setPartners(prev => {
        const exists = prev.some(p => p.id === partner.id);
        return exists ? prev.map(p => (p.id === partner.id ? partner : p)) : [partner, ...prev];
      });
      showToast(`${partner.name} の情報を保存しました。書類の記載に反映されます`);
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
            path="/import"
            element={<QuoteImport partners={partners} projects={projects} onCreate={addProject} newId={newProjectId} onToast={showToast} />}
          />
          <Route
            path="/project/:id"
            element={<ProjectDetail projects={projects} partners={partners} actions={actions} />}
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
