import { useCallback, useMemo, useState } from 'react';
import { HashRouter, Routes, Route, useNavigate } from 'react-router-dom';
import type { AppUser, ContractTerms, DocKind, Partner, Project, QuoteReadResult } from './types';
import { DEMO_ACCOUNTS, partners as initialPartners, sampleProjects } from './data/sampleData';
import { generateDocuments } from './utils/docs';
import { nowIso, todayIso } from './utils/format';
import type { ImportRow } from './utils/partnerImport';
import { Layout } from './components/Layout';
import { Modal } from './components/Modal';
import { ToastContainer, type ToastState } from './components/Toast';
import { ProjectList } from './pages/ProjectList';
import { ProjectDetail } from './pages/ProjectDetail';
import { QuoteImport } from './pages/QuoteImport';
import { PartnerMaster } from './pages/PartnerMaster';
import { PartnerImport } from './pages/PartnerImport';
import { Guide } from './pages/Guide';
import { Login } from './pages/Login';

/** ログイン状態はタブを閉じるまで保持する（保存できない環境ではログインし直すだけ） */
const SESSION_KEY = 'ccd-demo-login';

function restoreUser(): AppUser | null {
  try {
    const id = sessionStorage.getItem(SESSION_KEY);
    const account = DEMO_ACCOUNTS.find(a => a.loginId === id);
    return account ? { loginId: account.loginId, name: account.name, department: account.department } : null;
  } catch {
    return null;
  }
}

function saveUser(user: AppUser | null) {
  try {
    if (user) sessionStorage.setItem(SESSION_KEY, user.loginId);
    else sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // 保存できなくても、この画面を開いている間はログインしたまま使える
  }
}

let seq = 5000;
function nextId(prefix: string) {
  seq += 1;
  return `${prefix}-${seq}`;
}

export interface ProjectActions {
  /** 見積書の内容から注文書・注文請書・約款を作る */
  generateDocs: (projectId: string) => void;
  /** お客様から押印済みの注文書と基本契約書（約款）を受け取り、約款を締結済みにする */
  receiveSealedDocs: (projectId: string) => void;
  /** 注文請書を送付して契約成立にする */
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
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
}

function AppContent() {
  const navigate = useNavigate();
  const [user, setUser] = useState<AppUser | null>(restoreUser);
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>(sampleProjects);
  const [partners, setPartners] = useState<Partner[]>(initialPartners);
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((message: string, type: ToastState['type'] = 'success') => {
    setToast({ message, type });
  }, []);

  const login = useCallback(
    (next: AppUser) => {
      saveUser(next);
      setUser(next);
      setWelcomeOpen(true);
      showToast(`${next.name} さん、ログインしました`);
    },
    [showToast],
  );

  const logout = useCallback(() => {
    saveUser(null);
    setUser(null);
    setWelcomeOpen(false);
    navigate('/');
    showToast('ログアウトしました', 'info');
  }, [navigate, showToast]);

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
              ? [...updated.history, { id: nextId('hx'), at: nowIso(), actorName: user?.name ?? '', action }]
              : updated.history,
          };
        }),
      );
    },
    [user],
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

      receiveSealedDocs: projectId => {
        mutate(
          projectId,
          p => ({ ...setDocStatus(setDocStatus(p, 'order', 'sealed'), 'terms', 'sealed'), status: 'ordered' }),
          '押印済みの注文書・基本契約書（約款）を受け取りました。基本契約書（約款）は締結済みです',
        );
        showToast('注文書・基本契約書（約款）を受け取りました。約款は締結済みです');
      },

      confirmAcceptance: projectId => {
        mutate(
          projectId,
          p => ({ ...setDocStatus(p, 'acceptance', 'sent'), status: 'accepted' }),
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

  const importPartners = useCallback(
    (rows: ImportRow[]) => {
      const added = rows.filter(r => r.action === 'new');
      const updated = rows.filter(r => r.action === 'update');
      setPartners(prev => {
        const byId = new Map(updated.map(r => [r.existingId, r.values]));
        const merged = prev.map(p => (byId.has(p.id) ? { ...p, ...byId.get(p.id)! } : p));
        return [...added.map(r => ({ id: nextId('p'), ...r.values })), ...merged];
      });
      showToast(`取引先を ${added.length} 件登録し、${updated.length} 件の情報を更新しました`);
    },
    [showToast],
  );

  const newPartnerId = useCallback(() => nextId('p'), []);
  const newProjectId = useCallback(() => nextId('kj'), []);

  if (!user) {
    return (
      <>
        <Login onLogin={login} />
        <ToastContainer toast={toast} onClose={() => setToast(null)} />
      </>
    );
  }

  return (
    <>
      <Layout user={user} onLogout={logout}>
        <Routes>
          <Route path="/" element={<ProjectList projects={projects} partners={partners} />} />
          <Route
            path="/import"
            element={
              <QuoteImport
                partners={partners}
                projects={projects}
                userName={user.name}
                onCreate={addProject}
                newId={newProjectId}
                onToast={showToast}
              />
            }
          />
          <Route
            path="/project/:id"
            element={<ProjectDetail projects={projects} partners={partners} actions={actions} />}
          />
          <Route
            path="/partners"
            element={<PartnerMaster partners={partners} projects={projects} onSave={savePartner} newId={newPartnerId} />}
          />
          <Route
            path="/partners/import"
            element={<PartnerImport partners={partners} onImport={importPartners} onToast={showToast} />}
          />
          <Route path="/guide" element={<Guide projects={projects} />} />
        </Routes>
      </Layout>

      <Modal
        isOpen={welcomeOpen}
        onClose={() => setWelcomeOpen(false)}
        title="はじめてお使いの方へ"
        width={560}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setWelcomeOpen(false)}>閉じて始める</button>
            <button
              className="btn btn-primary"
              onClick={() => {
                setWelcomeOpen(false);
                navigate('/guide');
              }}
            >
              操作ガイドを見る
            </button>
          </>
        }
      >
        <p className="fs-15 mb-12">このシステムでは、次の3つの手順で工事の契約書類がそろいます。</p>
        <ol className="welcome-steps">
          <li><span className="fw-700">見積書を取り込む</span>：Excel の見積書を選ぶだけで、取引先・明細・金額が入ります。</li>
          <li><span className="fw-700">4つの項目を入力する</span>：工期・工事ができない日・支払い方法を入れて登録します。</li>
          <li><span className="fw-700">「次にやること」のボタンを押す</span>：書類づくりから契約成立まで、順番に案内します。</li>
        </ol>
        <p className="fs-14 text-sub mt-12">操作ガイドは、上のメニューの「操作ガイド」からいつでも開けます。</p>
      </Modal>

      <ToastContainer toast={toast} onClose={() => setToast(null)} />
    </>
  );
}
