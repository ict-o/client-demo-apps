import { useCallback, useMemo, useState } from 'react';
import { HashRouter, Routes, Route, useNavigate } from 'react-router-dom';
import type { AppUser, ContractTerms, DocKind, Partner, Project, QuoteReadResult, ScanUpload, SealedKind } from './types';
import { DEMO_ACCOUNTS, partners as initialPartners, sampleProjects } from './data/sampleData';
import { generateDocuments } from './utils/docs';
import { nowIso, todayIso } from './utils/format';
import type { ImportRow } from './utils/partnerImport';
import { Layout } from './components/Layout';
import { Tutorial, WelcomeDialog } from './components/Tutorial';
import { ToastContainer, type ToastState } from './components/Toast';
import { ProjectList } from './pages/ProjectList';
import { ProjectDetail } from './pages/ProjectDetail';
import { QuoteImport } from './pages/QuoteImport';
import { PartnerMaster } from './pages/PartnerMaster';
import { PartnerImport } from './pages/PartnerImport';
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
  /**
   * お客様から届いた押印済みの注文書・基本契約書（約款）のスキャンを登録する。
   * 両方そろうと約款は締結済みになり、案件は「注文書・約款を受領済み」へ進む。登録済みの書類なら差し替え。
   */
  registerSealedDocs: (projectId: string, scans: Partial<Record<SealedKind, ScanUpload>>) => void;
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
  const [tutorialIndex, setTutorialIndex] = useState<number | null>(null);
  const closeWelcome = useCallback(() => setWelcomeOpen(false), []);
  const closeTutorial = useCallback(() => setTutorialIndex(null), []);
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
    setTutorialIndex(null);
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

      registerSealedDocs: (projectId, scans) => {
        const target = projects.find(p => p.id === projectId);
        if (!target) return;
        const kinds = (Object.keys(scans) as SealedKind[]).filter(k => scans[k]);
        const replacing = kinds.every(k => target.documents.find(d => d.kind === k)?.status === 'sealed');
        const label = kinds.map(k => (k === 'order' ? '注文書' : '基本契約書（約款）')).join('・');
        const files = [...new Set(kinds.map(k => scans[k]!.fileName))].join('、');
        const uploadedAt = nowIso();
        const uploadedBy = user?.name ?? '';
        mutate(
          projectId,
          p => {
            const documents = p.documents.map(d => {
              const scan = scans[d.kind as SealedKind];
              if (!scan) return d;
              return { ...d, status: 'sealed' as const, issuedOn: d.issuedOn ?? todayIso(), scan: { ...scan, uploadedAt, uploadedBy } };
            });
            const bothSealed = documents.filter(d => d.kind === 'order' || d.kind === 'terms').every(d => d.status === 'sealed');
            return { ...p, documents, status: bothSealed && p.status === 'imported' ? 'ordered' : p.status };
          },
          replacing
            ? `押印済みの${label}のファイルを差し替えました（${files}）`
            : `押印済みの${label}のスキャンをアップロードしました（${files}）。基本契約書（約款）は締結済みです`,
        );
        showToast(
          replacing ? `押印済みの${label}のファイルを差し替えました` : '押印済みの書類を登録しました。約款は締結済みになりました',
        );
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
        mutate(projectId, p => ({ ...p, terms }), '工事の条件を変更しました');
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
    [mutate, showToast, projects, user],
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
      <Layout user={user} onLogout={logout} onStartTutorial={() => setTutorialIndex(0)}>
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
        </Routes>
      </Layout>

      {welcomeOpen && tutorialIndex === null && (
        <WelcomeDialog
          userName={user.name}
          onStart={() => {
            setWelcomeOpen(false);
            setTutorialIndex(0);
          }}
          onClose={closeWelcome}
        />
      )}

      <Tutorial index={tutorialIndex} onChangeIndex={setTutorialIndex} onClose={closeTutorial} />

      <ToastContainer toast={toast} onClose={() => setToast(null)} />
    </>
  );
}
