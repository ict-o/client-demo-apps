import { useState, useCallback, useMemo } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import type { Alert, Case, CaseEvent, CheckStatus, Checkpoint } from './types';
import { sampleCases, sampleAlerts, VIEWER, CHECKPOINT_TEMPLATE } from './data/sampleData';
import { nowIso, todayIso } from './utils/format';
import { Layout } from './components/Layout';
import { ToastContainer, type ToastState } from './components/Toast';
import { Dashboard } from './pages/Dashboard';
import { CaseList } from './pages/CaseList';
import { CaseDetail } from './pages/CaseDetail';
import { CaseNew } from './pages/CaseNew';
import { AlertCenter } from './pages/AlertCenter';

let seq = 5000;
const nextId = (prefix: string) => `${prefix}-${(seq += 1)}`;

/** 新規案件フォームの入力値 */
export interface NewCaseInput {
  title: string;
  client: string;
  owner: string;
  department: string;
  amount: number;
  dueDate: string;
}

export interface AppActions {
  /** チェック項目の状態を進める（着手→完了 など） */
  setCheckStatus: (caseId: string, cpId: string, status: CheckStatus) => void;
  /** チェック項目に不備を報告する（→ 管理者へアラート発報） */
  reportDefect: (caseId: string, cpId: string, note: string) => void;
  /** 新規案件を登録する。登録した案件IDを返す */
  addCase: (input: NewCaseInput) => string;
  /** アラートの対応状況を更新する */
  setAlertStatus: (alertId: string, status: Alert['status']) => void;
}

/** テンプレートから均等な期限でチェック項目を生成する */
function buildCheckpoints(input: NewCaseInput): Checkpoint[] {
  const start = new Date(`${todayIso()}T00:00:00`);
  const end = new Date(`${input.dueDate}T00:00:00`);
  const span = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000));
  const n = CHECKPOINT_TEMPLATE.length;
  return CHECKPOINT_TEMPLATE.map((name, i) => {
    const offset = Math.round((span * (i + 1)) / n);
    const due = new Date(start.getTime() + offset * 86400000);
    const pad = (v: number) => String(v).padStart(2, '0');
    const dueDate = `${due.getFullYear()}-${pad(due.getMonth() + 1)}-${pad(due.getDate())}`;
    return {
      id: nextId('cp'),
      name,
      owner: name.includes('入金') || name.includes('請求') ? '経理 川口 花' : input.owner,
      dueDate,
      status: 'pending' as CheckStatus,
    };
  });
}

export default function App() {
  const [cases, setCases] = useState<Case[]>(sampleCases);
  const [alerts, setAlerts] = useState<Alert[]>(sampleAlerts);
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((message: string, type: ToastState['type'] = 'success') => {
    setToast({ message, type });
  }, []);

  const openAlerts = useMemo(() => alerts.filter(a => a.status === 'open').length, [alerts]);

  const addEvent = (c: Case, text: string, actor = VIEWER.name): Case => ({
    ...c,
    events: [...c.events, { id: nextId('ev'), at: nowIso(), actor, text } as CaseEvent],
  });

  const setCheckStatus = useCallback(
    (caseId: string, cpId: string, status: CheckStatus) => {
      let cpName = '';
      let resolvedAlert = false;
      setCases(prev =>
        prev.map(c => {
          if (c.id !== caseId) return c;
          let updated = {
            ...c,
            checkpoints: c.checkpoints.map(cp => {
              if (cp.id !== cpId) return cp;
              cpName = cp.name;
              return {
                ...cp,
                status,
                completedDate: status === 'done' ? todayIso() : cp.completedDate,
                note: status === 'done' || status === 'in_progress' ? undefined : cp.note,
              };
            }),
          };
          const label =
            status === 'done' ? '完了' : status === 'in_progress' ? '着手（進行中）' : status;
          updated = addEvent(updated, `「${cpName}」を${label}にしました`);
          return updated;
        }),
      );
      // 完了にしたら、その項目に紐づく未解消アラートを対応済にする
      if (status === 'done') {
        setAlerts(prev =>
          prev.map(a => {
            if (a.caseId === caseId && a.checkpointName === cpName && a.status !== 'resolved') {
              resolvedAlert = true;
              return { ...a, status: 'resolved' };
            }
            return a;
          }),
        );
      }
      if (status === 'done') {
        showToast(resolvedAlert ? '完了にしました。関連アラートを解消しました' : '完了にしました');
      } else if (status === 'in_progress') {
        showToast('着手（進行中）にしました');
      }
    },
    [showToast],
  );

  const reportDefect = useCallback(
    (caseId: string, cpId: string, note: string) => {
      let cpName = '';
      let caseCode = '';
      let caseTitle = '';
      let owner = '';
      setCases(prev =>
        prev.map(c => {
          if (c.id !== caseId) return c;
          caseCode = c.code;
          caseTitle = c.title;
          let updated = {
            ...c,
            checkpoints: c.checkpoints.map(cp => {
              if (cp.id !== cpId) return cp;
              cpName = cp.name;
              owner = cp.owner;
              return { ...cp, status: 'flagged' as CheckStatus, note };
            }),
          };
          updated = addEvent(updated, `「${cpName}」に不備報告を登録しました`);
          return updated;
        }),
      );
      setAlerts(prev => [
        {
          id: nextId('al'),
          caseId,
          caseCode,
          caseTitle,
          kind: 'defect',
          level: 'high',
          status: 'open',
          message: `「${cpName}」に不備報告が登録されました。${note}（担当: ${owner}）`,
          checkpointName: cpName,
          at: nowIso(),
        },
        ...prev,
      ]);
      showToast('不備を報告し、管理者へ通知しました', 'info');
    },
    [showToast],
  );

  const addCase = useCallback(
    (input: NewCaseInput) => {
      const id = nextId('case');
      const code = `CASE-2026-${String(50 + Math.floor(seq % 40)).padStart(3, '0')}`;
      const newCase: Case = {
        id,
        code,
        title: input.title,
        client: input.client,
        owner: input.owner,
        department: input.department,
        orderDate: todayIso(),
        dueDate: input.dueDate,
        amount: input.amount,
        checkpoints: buildCheckpoints(input),
        events: [{ id: nextId('ev'), at: nowIso(), actor: VIEWER.name, text: '案件を新規登録しました' }],
      };
      setCases(prev => [newCase, ...prev]);
      showToast('新規案件を登録しました。監視を開始します');
      return id;
    },
    [showToast],
  );

  const setAlertStatus = useCallback(
    (alertId: string, status: Alert['status']) => {
      setAlerts(prev => prev.map(a => (a.id === alertId ? { ...a, status } : a)));
      showToast(status === 'resolved' ? 'アラートを対応済にしました' : 'アラートを確認済にしました', 'info');
    },
    [showToast],
  );

  const actions: AppActions = { setCheckStatus, reportDefect, addCase, setAlertStatus };

  return (
    <HashRouter>
      <Layout openAlerts={openAlerts}>
        <Routes>
          <Route path="/" element={<Dashboard cases={cases} alerts={alerts} />} />
          <Route path="/cases" element={<CaseList cases={cases} />} />
          <Route path="/cases/new" element={<CaseNew actions={actions} />} />
          <Route path="/cases/:id" element={<CaseDetail cases={cases} actions={actions} />} />
          <Route path="/alerts" element={<AlertCenter alerts={alerts} actions={actions} />} />
        </Routes>
      </Layout>
      <ToastContainer toast={toast} onClose={() => setToast(null)} />
    </HashRouter>
  );
}
