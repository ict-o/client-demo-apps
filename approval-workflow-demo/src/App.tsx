import { useCallback, useMemo, useState } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import type { Contract, ContractType, Member, Request, RequestKind, SealMethod } from './types';
import { members as initialMembers, sampleContracts, sampleInbox, sampleRequests, DEFAULT_VIEWER_ID } from './data/sampleData';
import type { InboxFile } from './types';
import { autoFolder, autoTags, canAct, currentStep } from './utils/domain';
import { buildSteps } from './utils/route';
import { nowIso, todayIso } from './utils/format';
import { Layout } from './components/Layout';
import { ToastContainer, type ToastState } from './components/Toast';
import { Dashboard } from './pages/Dashboard';
import { RequestList } from './pages/RequestList';
import { RequestNew } from './pages/RequestNew';
import { RequestDetail } from './pages/RequestDetail';
import { ContractList } from './pages/ContractList';
import { ContractDetail } from './pages/ContractDetail';
import { ContractImport } from './pages/ContractImport';
import { RouteSettings } from './pages/RouteSettings';

let seq = 2000;
const nextId = (prefix: string) => `${prefix}-${(seq += 1)}`;

let requestNo = 412;
let contractNo = 88;

/** 新規申請フォームの入力値 */
export interface NewRequestInput {
  kind: RequestKind;
  title: string;
  purpose: string;
  amount: number;
  contractType: ContractType;
  counterparty: string;
  counterpartyEsign: boolean;
  property: string;
  rentMonthly: number;
  startDate: string;
  endDate: string;
}

/** 契約書登録の入力値（AI抽出結果の確認画面から登録する） */
export interface ContractDraft {
  title: string;
  counterparty: string;
  contractType: ContractType;
  property: string;
  rentMonthly: number;
  amount: number;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
}

export interface AppActions {
  /** 現在の承認段階を承認する（代理承認を含む） */
  approve: (requestId: string, comment: string) => void;
  /** 現在の承認段階を差し戻す */
  reject: (requestId: string, comment: string) => void;
  /** 承認済の申請を締結し、契約書を登録する。登録した契約書IDを返す */
  conclude: (requestId: string, method: SealMethod) => string | null;
  /** 新規申請を登録する。登録した申請IDを返す */
  addRequest: (input: NewRequestInput) => string;
  /** 取込ファイルから契約書を登録する。登録した契約書IDを返す */
  registerContract: (fileId: string | null, draft: ContractDraft, origin: Contract['origin']) => string;
  /** 会計システムへ連携する */
  linkAccounting: (contractId: string) => void;
  /** 不在（出張・休暇）設定を切り替える */
  setMemberAbsent: (memberId: string, absent: boolean) => void;
  /** 代理承認者を変更する */
  setMemberDelegate: (memberId: string, delegateId: string) => void;
}

export default function App() {
  const [requests, setRequests] = useState<Request[]>(sampleRequests);
  const [contracts, setContracts] = useState<Contract[]>(sampleContracts);
  const [inbox, setInbox] = useState<InboxFile[]>(sampleInbox);
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [viewerId, setViewerId] = useState<string>(DEFAULT_VIEWER_ID);
  const [toast, setToast] = useState<ToastState | null>(null);

  const viewer = useMemo(
    () => members.find(m => m.id === viewerId) ?? members[0],
    [members, viewerId],
  );

  const showToast = useCallback((message: string, type: ToastState['type'] = 'success') => {
    setToast({ message, type });
  }, []);

  const myPendingCount = useMemo(
    () => requests.filter(r => canAct(r, viewer, members).ok).length,
    [requests, viewer, members],
  );

  const memberName = useCallback(
    (id: string) => members.find(m => m.id === id)?.name ?? '担当者',
    [members],
  );

  const approve = useCallback(
    (requestId: string, comment: string) => {
      let message = '';
      setRequests(prev =>
        prev.map(r => {
          if (r.id !== requestId) return r;
          const step = currentStep(r);
          if (!step) return r;
          const asDelegate = step.approverId !== viewer.id;
          const idx = r.steps.findIndex(s => s.id === step.id);
          const steps = r.steps.map((s, i) => {
            if (i === idx) {
              return {
                ...s,
                status: asDelegate ? ('delegated' as const) : ('approved' as const),
                actedAt: nowIso(),
                actedById: viewer.id,
                comment: comment.trim() === '' ? undefined : comment.trim(),
              };
            }
            if (i === idx + 1) return { ...s, status: 'current' as const };
            return s;
          });
          const isLast = idx === r.steps.length - 1;
          message = isLast
            ? '最終承認が完了しました。締結方法を選択してください'
            : `「${step.name}」を${asDelegate ? '代理' : ''}承認しました。次の承認者へ回覧します`;
          return {
            ...r,
            steps,
            status: isLast ? ('approved' as const) : r.status,
            events: [
              ...r.events,
              {
                id: nextId('ev'),
                at: nowIso(),
                actor: viewer.name,
                text: `「${step.name}」を${asDelegate ? '代理承認' : '承認'}しました`,
              },
            ],
          };
        }),
      );
      if (message) showToast(message);
    },
    [showToast, viewer],
  );

  const reject = useCallback(
    (requestId: string, comment: string) => {
      setRequests(prev =>
        prev.map(r => {
          if (r.id !== requestId) return r;
          const step = currentStep(r);
          if (!step) return r;
          return {
            ...r,
            status: 'rejected' as const,
            steps: r.steps.map(s =>
              s.id === step.id
                ? { ...s, status: 'rejected' as const, actedAt: nowIso(), actedById: viewer.id, comment: comment.trim() }
                : s,
            ),
            events: [
              ...r.events,
              { id: nextId('ev'), at: nowIso(), actor: viewer.name, text: `「${step.name}」を差し戻しました` },
            ],
          };
        }),
      );
      showToast('申請を差し戻しました。申請者へ通知しました', 'info');
    },
    [showToast, viewer],
  );

  const conclude = useCallback(
    (requestId: string, method: SealMethod) => {
      const req = requests.find(r => r.id === requestId);
      if (!req || req.status !== 'approved') return null;

      const contractId = nextId('ct');
      const code = `CT-2026-${String((contractNo += 1)).padStart(4, '0')}`;
      const contract: Contract = {
        id: contractId,
        code,
        title: `${req.property ? `${req.property} ` : ''}${req.contractType}`,
        counterparty: req.counterparty,
        contractType: req.contractType,
        property: req.property ?? '',
        rentMonthly: req.rentMonthly ?? 0,
        amount: req.amount,
        startDate: req.startDate ?? todayIso(),
        endDate: req.endDate ?? todayIso(),
        autoRenew: false,
        origin: method === 'esign' ? 'esign' : 'scan',
        aiExtracted: false,
        folder: autoFolder(req.counterparty, req.contractType),
        tags: autoTags(req.contractType, req.property ?? '', req.rentMonthly ?? 0),
        accounting: 'unlinked',
        sourceRequestCode: req.code,
        registeredAt: todayIso(),
      };
      setContracts(prev => [contract, ...prev]);
      setRequests(prev =>
        prev.map(r =>
          r.id === requestId
            ? {
                ...r,
                status: 'completed' as const,
                sealMethod: method,
                contractId,
                events: [
                  ...r.events,
                  {
                    id: nextId('ev'),
                    at: nowIso(),
                    actor: viewer.name,
                    text:
                      method === 'esign'
                        ? `電子契約で締結し、契約書 ${code} を登録しました`
                        : `捺印済の原本をスキャン取込し、契約書 ${code} を登録しました`,
                  },
                ],
              }
            : r,
        ),
      );
      showToast(
        method === 'esign'
          ? `電子契約の締結が完了しました。契約書 ${code} を登録しました`
          : `捺印と原本のスキャン取込が完了しました。契約書 ${code} を登録しました`,
      );
      return contractId;
    },
    [requests, showToast, viewer],
  );

  const addRequest = useCallback(
    (input: NewRequestInput) => {
      const id = nextId('req');
      const code = `RQ-2026-${String((requestNo += 1)).padStart(4, '0')}`;
      const newRequest: Request = {
        id,
        code,
        kind: input.kind,
        title: input.title,
        purpose: input.purpose,
        applicantId: viewer.id,
        department: viewer.department,
        appliedAt: nowIso(),
        amount: input.amount,
        contractType: input.contractType,
        counterparty: input.counterparty,
        counterpartyEsign: input.counterpartyEsign,
        property: input.property,
        rentMonthly: input.rentMonthly,
        startDate: input.startDate,
        endDate: input.endDate,
        steps: buildSteps({ kind: input.kind, amount: input.amount, contractType: input.contractType }, nextId),
        status: 'pending',
        events: [
          {
            id: nextId('ev'),
            at: nowIso(),
            actor: viewer.name,
            text: `${input.kind === 'seal' ? '捺印申請' : '稟議書'}を申請しました`,
          },
        ],
      };
      setRequests(prev => [newRequest, ...prev]);
      showToast(`${code} を申請しました。承認ルートの1段階目へ回覧します`);
      return id;
    },
    [showToast, viewer],
  );

  const registerContract = useCallback(
    (fileId: string | null, draft: ContractDraft, origin: Contract['origin']) => {
      const id = nextId('ct');
      const code = `CT-2026-${String((contractNo += 1)).padStart(4, '0')}`;
      const contract: Contract = {
        id,
        code,
        title: draft.title,
        counterparty: draft.counterparty,
        contractType: draft.contractType,
        property: draft.property,
        rentMonthly: draft.rentMonthly,
        amount: draft.amount,
        startDate: draft.startDate,
        endDate: draft.endDate,
        autoRenew: draft.autoRenew,
        origin,
        aiExtracted: true,
        folder: autoFolder(draft.counterparty, draft.contractType),
        tags: autoTags(draft.contractType, draft.property, draft.rentMonthly),
        accounting: 'unlinked',
        registeredAt: todayIso(),
      };
      setContracts(prev => [contract, ...prev]);
      if (fileId) setInbox(prev => prev.filter(f => f.id !== fileId));
      showToast(`契約書 ${code} を登録し、「${contract.folder}」へ自動振り分けしました`);
      return id;
    },
    [showToast],
  );

  const linkAccounting = useCallback(
    (contractId: string) => {
      setContracts(prev => prev.map(c => (c.id === contractId ? { ...c, accounting: 'linked' as const } : c)));
      showToast('会計システムへ支払データを連携しました', 'info');
    },
    [showToast],
  );

  const setMemberAbsent = useCallback(
    (memberId: string, absent: boolean) => {
      setMembers(prev => prev.map(m => (m.id === memberId ? { ...m, absent } : m)));
      showToast(
        absent
          ? `${memberName(memberId)} を不在に設定しました。承認は代理承認者へ引き継がれます`
          : `${memberName(memberId)} の不在設定を解除しました`,
        'info',
      );
    },
    [memberName, showToast],
  );

  const setMemberDelegate = useCallback(
    (memberId: string, delegateId: string) => {
      setMembers(prev => prev.map(m => (m.id === memberId ? { ...m, delegateId } : m)));
      showToast(`${memberName(memberId)} の代理承認者を ${memberName(delegateId)} に変更しました`, 'info');
    },
    [memberName, showToast],
  );

  const actions: AppActions = {
    approve,
    reject,
    conclude,
    addRequest,
    registerContract,
    linkAccounting,
    setMemberAbsent,
    setMemberDelegate,
  };

  return (
    <HashRouter>
      <Layout members={members} viewer={viewer} onChangeViewer={setViewerId} myPendingCount={myPendingCount}>
        <Routes>
          <Route path="/" element={<Dashboard requests={requests} contracts={contracts} members={members} viewer={viewer} />} />
          <Route path="/requests" element={<RequestList requests={requests} members={members} viewer={viewer} />} />
          <Route path="/requests/new" element={<RequestNew members={members} actions={actions} />} />
          <Route
            path="/requests/:id"
            element={<RequestDetail requests={requests} members={members} viewer={viewer} actions={actions} />}
          />
          <Route path="/contracts" element={<ContractList contracts={contracts} />} />
          <Route path="/contracts/:id" element={<ContractDetail contracts={contracts} requests={requests} actions={actions} />} />
          <Route path="/import" element={<ContractImport inbox={inbox} actions={actions} />} />
          <Route
            path="/settings"
            element={<RouteSettings members={members} requests={requests} actions={actions} />}
          />
        </Routes>
      </Layout>
      <ToastContainer toast={toast} onClose={() => setToast(null)} />
    </HashRouter>
  );
}
