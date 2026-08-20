import { useCallback, useMemo, useState } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import type {
  AccountingJob,
  Contract,
  ContractType,
  Envelope,
  Member,
  Request,
  RequestKind,
  SignField,
  Signer,
} from './types';
import {
  members as initialMembers,
  sampleAccountingJobs,
  sampleContracts,
  sampleEnvelopes,
  sampleInbox,
  sampleRequests,
  DEFAULT_VIEWER_ID,
  OPERATING_COMPANY,
} from './data/sampleData';
import type { InboxFile } from './types';
import { autoFolder, autoTags, canAct, currentStep } from './utils/domain';
import { buildSteps } from './utils/route';
import { nowIso, todayIso, formatDate } from './utils/format';
import { AUDIT_SOURCES, documentHash, isInProgress } from './utils/esign';
import { Layout } from './components/Layout';
import { ToastContainer, type ToastState } from './components/Toast';
import { Tour, WelcomeDialog } from './components/Tour';
import { Dashboard } from './pages/Dashboard';
import { RequestList } from './pages/RequestList';
import { RequestNew } from './pages/RequestNew';
import { RequestDetail } from './pages/RequestDetail';
import { ContractList } from './pages/ContractList';
import { ContractDetail } from './pages/ContractDetail';
import { ContractImport } from './pages/ContractImport';
import { RouteSettings } from './pages/RouteSettings';
import { EsignList } from './pages/EsignList';
import { EsignNew } from './pages/EsignNew';
import { EsignDetail } from './pages/EsignDetail';
import { EsignSign } from './pages/EsignSign';
import { Integrations } from './pages/Integrations';
import { Guide } from './pages/Guide';

let seq = 2000;
const nextId = (prefix: string) => `${prefix}-${(seq += 1)}`;

let requestNo = 412;
let contractNo = 88;
let envelopeNo = 31;
let jobNo = 146;

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

/** 電子契約の送信内容（送信準備ウィザードの入力値） */
export interface EnvelopeDraft {
  requestId?: string;
  requestCode?: string;
  title: string;
  counterparty: string;
  contractType: ContractType;
  property: string;
  amount: number;
  rentMonthly: number;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  signers: Signer[];
  fields: SignField[];
  deadline: string;
}

export interface AppActions {
  /** 現在の承認段階を承認する（代理承認を含む） */
  approve: (requestId: string, comment: string) => void;
  /** 現在の承認段階を差し戻す */
  reject: (requestId: string, comment: string) => void;
  /** 承認済の申請を紙で締結し（捺印＋原本スキャン）、契約書を登録する */
  concludeOnPaper: (requestId: string) => string | null;
  /** 新規申請を登録する。登録した申請IDを返す */
  addRequest: (input: NewRequestInput) => string;
  /** 取込ファイルから契約書を登録する。登録した契約書IDを返す */
  registerContract: (fileId: string | null, draft: ContractDraft, origin: Contract['origin']) => string;
  /** 電子契約を送信する（署名依頼）。作成した締結案件IDを返す */
  sendEnvelope: (draft: EnvelopeDraft) => string;
  /** 署名する。全署名が完了した場合は登録した契約書IDを返す */
  signEnvelope: (envelopeId: string, signerId: string, signatureName: string) => string | null;
  /** 署名を拒否する（相手先の署名画面から実行） */
  declineEnvelope: (envelopeId: string, signerId: string, reason: string) => void;
  /** 署名リマインドを送信する */
  remindEnvelope: (envelopeId: string) => void;
  /** 送信を取り消す */
  cancelEnvelope: (envelopeId: string, reason: string) => void;
  /** 署名期限を延長して再送する */
  resendEnvelope: (envelopeId: string, deadline: string) => void;
  /** 会計システムへ連携する */
  linkAccounting: (contractId: string, kind: AccountingJob['kind']) => void;
  /** 失敗した会計システム連携をやり直す */
  retryAccountingJob: (jobId: string) => void;
  /** 不在（出張・休暇）設定を切り替える */
  setMemberAbsent: (memberId: string, absent: boolean) => void;
  /** 代理承認者を変更する */
  setMemberDelegate: (memberId: string, delegateId: string) => void;
}

export default function App() {
  const [requests, setRequests] = useState<Request[]>(sampleRequests);
  const [contracts, setContracts] = useState<Contract[]>(sampleContracts);
  const [envelopes, setEnvelopes] = useState<Envelope[]>(sampleEnvelopes);
  const [accountingJobs, setAccountingJobs] = useState<AccountingJob[]>(sampleAccountingJobs);
  const [inbox, setInbox] = useState<InboxFile[]>(sampleInbox);
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [viewerId, setViewerId] = useState<string>(DEFAULT_VIEWER_ID);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [tourIndex, setTourIndex] = useState<number | null>(null);
  const [welcomeOpen, setWelcomeOpen] = useState(true);

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

  const esignPendingCount = useMemo(() => envelopes.filter(isInProgress).length, [envelopes]);

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

  /** 契約書を1件作る（電子契約の締結完了・紙の原本取込で共用） */
  const buildContract = useCallback(
    (input: {
      title: string;
      counterparty: string;
      contractType: ContractType;
      property: string;
      rentMonthly: number;
      amount: number;
      startDate: string;
      endDate: string;
      autoRenew: boolean;
      origin: Contract['origin'];
      aiExtracted: boolean;
      sourceRequestCode?: string;
      envelopeCode?: string;
    }): Contract => {
      const code = `CT-2026-${String((contractNo += 1)).padStart(4, '0')}`;
      return {
        id: nextId('ct'),
        code,
        title: input.title,
        counterparty: input.counterparty,
        contractType: input.contractType,
        property: input.property,
        rentMonthly: input.rentMonthly,
        amount: input.amount,
        startDate: input.startDate,
        endDate: input.endDate,
        autoRenew: input.autoRenew,
        origin: input.origin,
        aiExtracted: input.aiExtracted,
        folder: autoFolder(input.counterparty, input.contractType),
        tags: autoTags(input.contractType, input.property, input.rentMonthly),
        accounting: 'unlinked',
        sourceRequestCode: input.sourceRequestCode,
        envelopeCode: input.envelopeCode,
        registeredAt: todayIso(),
      };
    },
    [],
  );

  const concludeOnPaper = useCallback(
    (requestId: string) => {
      const req = requests.find(r => r.id === requestId);
      if (!req || req.status !== 'approved') return null;

      const contract = buildContract({
        title: `${req.property ? `${req.property} ` : ''}${req.contractType}`,
        counterparty: req.counterparty,
        contractType: req.contractType,
        property: req.property ?? '',
        rentMonthly: req.rentMonthly ?? 0,
        amount: req.amount,
        startDate: req.startDate ?? todayIso(),
        endDate: req.endDate ?? todayIso(),
        autoRenew: false,
        origin: 'scan',
        aiExtracted: false,
        sourceRequestCode: req.code,
      });
      setContracts(prev => [contract, ...prev]);
      setRequests(prev =>
        prev.map(r =>
          r.id === requestId
            ? {
                ...r,
                status: 'completed' as const,
                sealMethod: 'paper' as const,
                contractId: contract.id,
                events: [
                  ...r.events,
                  {
                    id: nextId('ev'),
                    at: nowIso(),
                    actor: viewer.name,
                    text: `捺印済の原本をスキャン取込し、契約書 ${contract.code} を登録しました`,
                  },
                ],
              }
            : r,
        ),
      );
      showToast(`捺印と原本のスキャン取込が完了しました。契約書 ${contract.code} を登録しました`);
      return contract.id;
    },
    [buildContract, requests, showToast, viewer],
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
      const contract = buildContract({ ...draft, origin, aiExtracted: true });
      setContracts(prev => [contract, ...prev]);
      if (fileId) setInbox(prev => prev.filter(f => f.id !== fileId));
      showToast(`契約書 ${contract.code} を登録し、「${contract.folder}」へ自動振り分けしました`);
      return contract.id;
    },
    [buildContract, showToast],
  );

  /* ===== 電子契約 ===== */

  const sendEnvelope = useCallback(
    (draft: EnvelopeDraft) => {
      const id = nextId('env');
      const code = `ES-2026-${String((envelopeNo += 1)).padStart(4, '0')}`;
      const first = [...draft.signers].sort((a, b) => a.order - b.order)[0];
      const envelope: Envelope = {
        id,
        code,
        requestId: draft.requestId,
        requestCode: draft.requestCode,
        title: draft.title,
        counterparty: draft.counterparty,
        contractType: draft.contractType,
        property: draft.property,
        amount: draft.amount,
        rentMonthly: draft.rentMonthly,
        startDate: draft.startDate,
        endDate: draft.endDate,
        autoRenew: draft.autoRenew,
        status: 'sent',
        signers: draft.signers.map(s => ({ ...s, status: s.id === first?.id ? 'current' : 'waiting' })),
        fields: draft.fields,
        sentAt: nowIso(),
        deadline: draft.deadline,
        reminderCount: 0,
        documentHash: documentHash(`${code}|${draft.counterparty}|${draft.amount}|${draft.startDate}`),
        audit: [
          {
            id: nextId('au'),
            at: nowIso(),
            actor: viewer.name,
            action: `署名依頼を送信しました（署名者${draft.signers.length}名・署名期限 ${formatDate(draft.deadline)}）`,
            ip: AUDIT_SOURCES.internal.ip,
            device: AUDIT_SOURCES.internal.device,
          },
        ],
      };
      setEnvelopes(prev => [envelope, ...prev]);
      if (draft.requestId) {
        setRequests(prev =>
          prev.map(r =>
            r.id === draft.requestId
              ? {
                  ...r,
                  status: 'signing' as const,
                  sealMethod: 'esign' as const,
                  envelopeId: id,
                  events: [
                    ...r.events,
                    {
                      id: nextId('ev'),
                      at: nowIso(),
                      actor: viewer.name,
                      text: `電子契約 ${code} で署名依頼を送信しました`,
                    },
                  ],
                }
              : r,
          ),
        );
      }
      showToast(`${first?.name} さんへ署名依頼を送信しました（${code}）`);
      return id;
    },
    [showToast, viewer],
  );

  const signEnvelope = useCallback(
    (envelopeId: string, signerId: string, signatureName: string) => {
      const env = envelopes.find(e => e.id === envelopeId);
      if (!env || !isInProgress(env)) return null;
      const signer = env.signers.find(s => s.id === signerId);
      if (!signer || signer.status !== 'current') return null;

      const at = nowIso();
      const source = signer.side === 'internal' ? AUDIT_SOURCES.internal : AUDIT_SOURCES.counterparty;
      const actor = `${signer.name}（${signer.side === 'internal' ? signer.title : signer.company}）`;
      const ordered = [...env.signers].sort((a, b) => a.order - b.order);
      const idx = ordered.findIndex(s => s.id === signerId);
      const next = ordered[idx + 1];

      const signers = env.signers.map(s => {
        if (s.id === signerId) {
          return { ...s, status: 'signed' as const, signedAt: at, signatureName, viewedAt: s.viewedAt ?? at };
        }
        if (next && s.id === next.id) return { ...s, status: 'current' as const };
        return s;
      });

      const fields = env.fields.map(f =>
        f.signerId === signerId
          ? { ...f, value: f.kind === 'sign' ? signatureName : formatDate(at.slice(0, 10)).slice(0, 10) }
          : f,
      );

      const audit = [
        ...env.audit,
        {
          id: nextId('au'),
          at,
          actor,
          action: `署名しました（${signer.auth}）`,
          ip: source.ip,
          device: source.device,
        },
      ];

      const completed = !next;
      let newContract: Contract | null = null;

      if (completed) {
        audit.push({
          id: nextId('au'),
          at,
          actor: '本システム',
          action: '全署名が完了し、締結を確定しました（タイムスタンプ付与）',
          ip: AUDIT_SOURCES.system.ip,
          device: AUDIT_SOURCES.system.device,
        });
        newContract = buildContract({
          title: `${env.property !== '' ? `${env.property} ` : ''}${env.contractType}`,
          counterparty: env.counterparty,
          contractType: env.contractType,
          property: env.property,
          rentMonthly: env.rentMonthly,
          amount: env.amount,
          startDate: env.startDate,
          endDate: env.endDate,
          autoRenew: env.autoRenew,
          origin: 'esign',
          aiExtracted: false,
          sourceRequestCode: env.requestCode,
          envelopeCode: env.code,
        });
        audit.push({
          id: nextId('au'),
          at,
          actor: '本システム',
          action: `契約書 ${newContract.code} として契約書管理へ登録しました`,
          ip: AUDIT_SOURCES.system.ip,
          device: AUDIT_SOURCES.system.device,
        });
        setContracts(prev => [newContract as Contract, ...prev]);
      } else {
        audit.push({
          id: nextId('au'),
          at,
          actor: '本システム',
          action: `次の署名者（${next.name}）へ署名依頼を送信しました`,
          ip: AUDIT_SOURCES.system.ip,
          device: AUDIT_SOURCES.system.device,
        });
      }

      setEnvelopes(prev =>
        prev.map(e =>
          e.id === envelopeId
            ? {
                ...e,
                signers,
                fields,
                audit,
                status: completed ? ('completed' as const) : ('signing' as const),
                completedAt: completed ? at : undefined,
                contractId: newContract ? newContract.id : undefined,
              }
            : e,
        ),
      );

      if (completed && env.requestId) {
        const contractId = newContract?.id;
        const contractCode = newContract?.code;
        setRequests(prev =>
          prev.map(r =>
            r.id === env.requestId
              ? {
                  ...r,
                  status: 'completed' as const,
                  contractId,
                  events: [
                    ...r.events,
                    {
                      id: nextId('ev'),
                      at,
                      actor: '本システム',
                      text: `電子契約で締結が完了し、契約書 ${contractCode} を登録しました`,
                    },
                  ],
                }
              : r,
          ),
        );
      }

      showToast(
        completed
          ? `全署名が完了しました。契約書 ${newContract?.code} を登録しました`
          : `${signer.name} さんの署名が完了しました。次は ${next?.name} さんの署名です`,
      );
      return completed ? (newContract?.id ?? null) : null;
    },
    [buildContract, envelopes, showToast],
  );

  const declineEnvelope = useCallback(
    (envelopeId: string, signerId: string, reason: string) => {
      const env = envelopes.find(e => e.id === envelopeId);
      if (!env) return;
      const signer = env.signers.find(s => s.id === signerId);
      const at = nowIso();
      setEnvelopes(prev =>
        prev.map(e =>
          e.id === envelopeId
            ? {
                ...e,
                status: 'declined' as const,
                stopReason: reason,
                signers: e.signers.map(s => (s.id === signerId ? { ...s, status: 'declined' as const } : s)),
                audit: [
                  ...e.audit,
                  {
                    id: nextId('au'),
                    at,
                    actor: `${signer?.name}（${signer?.company}）`,
                    action: `署名を拒否しました（理由: ${reason}）`,
                    ip: AUDIT_SOURCES.counterparty.ip,
                    device: AUDIT_SOURCES.counterparty.device,
                  },
                ],
              }
            : e,
        ),
      );
      if (env.requestId) {
        setRequests(prev =>
          prev.map(r =>
            r.id === env.requestId
              ? {
                  ...r,
                  status: 'approved' as const,
                  envelopeId: undefined,
                  events: [
                    ...r.events,
                    {
                      id: nextId('ev'),
                      at,
                      actor: '本システム',
                      text: `電子契約 ${env.code} の署名が拒否されました。内容を修正のうえ再送してください`,
                    },
                  ],
                }
              : r,
          ),
        );
      }
      showToast('署名が拒否されました。申請担当者へ通知しました', 'error');
    },
    [envelopes, showToast],
  );

  const remindEnvelope = useCallback(
    (envelopeId: string) => {
      const env = envelopes.find(e => e.id === envelopeId);
      const target = env?.signers.find(s => s.status === 'current');
      const at = nowIso();
      setEnvelopes(prev =>
        prev.map(e =>
          e.id === envelopeId
            ? {
                ...e,
                reminderCount: e.reminderCount + 1,
                lastReminderAt: at,
                audit: [
                  ...e.audit,
                  {
                    id: nextId('au'),
                    at,
                    actor: viewer.name,
                    action: `${target?.name ?? '署名者'} へ署名リマインドを送信しました`,
                    ip: AUDIT_SOURCES.internal.ip,
                    device: AUDIT_SOURCES.internal.device,
                  },
                ],
              }
            : e,
        ),
      );
      showToast(`${target?.name ?? '署名者'} さんへリマインドを送信しました`, 'info');
    },
    [envelopes, showToast, viewer],
  );

  const cancelEnvelope = useCallback(
    (envelopeId: string, reason: string) => {
      const env = envelopes.find(e => e.id === envelopeId);
      const at = nowIso();
      setEnvelopes(prev =>
        prev.map(e =>
          e.id === envelopeId
            ? {
                ...e,
                status: 'canceled' as const,
                stopReason: reason,
                audit: [
                  ...e.audit,
                  {
                    id: nextId('au'),
                    at,
                    actor: viewer.name,
                    action: `送信を取り消しました（理由: ${reason}）`,
                    ip: AUDIT_SOURCES.internal.ip,
                    device: AUDIT_SOURCES.internal.device,
                  },
                ],
              }
            : e,
        ),
      );
      if (env?.requestId) {
        setRequests(prev =>
          prev.map(r =>
            r.id === env.requestId
              ? {
                  ...r,
                  status: 'approved' as const,
                  envelopeId: undefined,
                  events: [
                    ...r.events,
                    { id: nextId('ev'), at, actor: viewer.name, text: `電子契約 ${env.code} の送信を取り消しました` },
                  ],
                }
              : r,
          ),
        );
      }
      showToast('電子契約の送信を取り消しました', 'info');
    },
    [envelopes, showToast, viewer],
  );

  const resendEnvelope = useCallback(
    (envelopeId: string, deadline: string) => {
      const at = nowIso();
      setEnvelopes(prev =>
        prev.map(e =>
          e.id === envelopeId
            ? {
                ...e,
                status: 'sent' as const,
                deadline,
                sentAt: at,
                audit: [
                  ...e.audit,
                  {
                    id: nextId('au'),
                    at,
                    actor: viewer.name,
                    action: `署名期限を ${formatDate(deadline)} に延長して再送しました`,
                    ip: AUDIT_SOURCES.internal.ip,
                    device: AUDIT_SOURCES.internal.device,
                  },
                ],
              }
            : e,
        ),
      );
      showToast(`署名期限を ${formatDate(deadline)} に延長して再送しました`);
    },
    [showToast, viewer],
  );

  /* ===== 会計システム連携（唯一の外部連携） ===== */

  const linkAccounting = useCallback(
    (contractId: string, kind: AccountingJob['kind']) => {
      const contract = contracts.find(c => c.id === contractId);
      if (!contract) return;
      const at = nowIso();
      const code = `AJ-2026-${String((jobNo += 1)).padStart(4, '0')}`;
      setContracts(prev =>
        prev.map(c =>
          c.id === contractId
            ? { ...c, accounting: 'linked' as const, accountingLinkedAt: at, accountingJobCode: code }
            : c,
        ),
      );
      setAccountingJobs(prev => [
        {
          id: nextId('aj'),
          code,
          contractCode: contract.code,
          contractTitle: contract.title,
          counterparty: contract.counterparty,
          amount: contract.amount,
          kind,
          sentAt: at,
          status: 'success',
        },
        ...prev,
      ]);
      showToast(`会計システムへ連携しました（連携番号 ${code}）`);
    },
    [contracts, showToast],
  );

  const retryAccountingJob = useCallback(
    (jobId: string) => {
      setAccountingJobs(prev =>
        prev.map(j =>
          j.id === jobId ? { ...j, status: 'success' as const, sentAt: nowIso(), message: undefined } : j,
        ),
      );
      const job = accountingJobs.find(j => j.id === jobId);
      if (job) {
        setContracts(prev =>
          prev.map(c =>
            c.code === job.contractCode
              ? { ...c, accounting: 'linked' as const, accountingLinkedAt: nowIso(), accountingJobCode: job.code }
              : c,
          ),
        );
      }
      showToast('会計システムへ再連携しました');
    },
    [accountingJobs, showToast],
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
    concludeOnPaper,
    addRequest,
    registerContract,
    sendEnvelope,
    signEnvelope,
    declineEnvelope,
    remindEnvelope,
    cancelEnvelope,
    resendEnvelope,
    linkAccounting,
    retryAccountingJob,
    setMemberAbsent,
    setMemberDelegate,
  };

  return (
    <HashRouter>
      <Layout
        members={members}
        viewer={viewer}
        onChangeViewer={setViewerId}
        myPendingCount={myPendingCount}
        esignPendingCount={esignPendingCount}
        onStartTour={() => {
          setWelcomeOpen(false);
          setTourIndex(0);
        }}
      >
        <Routes>
          <Route
            path="/"
            element={
              <Dashboard
                requests={requests}
                contracts={contracts}
                envelopes={envelopes}
                members={members}
                viewer={viewer}
              />
            }
          />
          <Route path="/requests" element={<RequestList requests={requests} members={members} viewer={viewer} />} />
          <Route path="/requests/new" element={<RequestNew members={members} actions={actions} />} />
          <Route
            path="/requests/:id"
            element={
              <RequestDetail
                requests={requests}
                members={members}
                viewer={viewer}
                envelopes={envelopes}
                actions={actions}
              />
            }
          />
          <Route path="/esign" element={<EsignList envelopes={envelopes} />} />
          <Route
            path="/esign/new"
            element={<EsignNew requests={requests} members={members} company={OPERATING_COMPANY} actions={actions} />}
          />
          <Route
            path="/esign/:id"
            element={
              <EsignDetail envelopes={envelopes} viewer={viewer} company={OPERATING_COMPANY} actions={actions} />
            }
          />
          <Route
            path="/esign/:id/sign/:signerId"
            element={<EsignSign envelopes={envelopes} company={OPERATING_COMPANY} actions={actions} />}
          />
          <Route path="/contracts" element={<ContractList contracts={contracts} />} />
          <Route
            path="/contracts/:id"
            element={
              <ContractDetail contracts={contracts} requests={requests} envelopes={envelopes} actions={actions} />
            }
          />
          <Route path="/import" element={<ContractImport inbox={inbox} actions={actions} />} />
          <Route
            path="/integrations"
            element={<Integrations contracts={contracts} jobs={accountingJobs} actions={actions} />}
          />
          <Route path="/guide" element={<Guide onStartTour={() => setTourIndex(0)} />} />
          <Route path="/settings" element={<RouteSettings members={members} requests={requests} actions={actions} />} />
        </Routes>
      </Layout>

      {welcomeOpen && tourIndex === null && (
        <WelcomeDialog
          onStartTour={() => {
            setWelcomeOpen(false);
            setTourIndex(0);
          }}
          onOpenGuide={() => {
            setWelcomeOpen(false);
            window.location.hash = '#/guide';
          }}
          onClose={() => setWelcomeOpen(false)}
        />
      )}

      <Tour index={tourIndex} onChangeIndex={setTourIndex} onClose={() => setTourIndex(null)} />
      <ToastContainer toast={toast} onClose={() => setToast(null)} />
    </HashRouter>
  );
}
