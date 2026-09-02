import { useCallback, useMemo, useState } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import type {
  AccountingExport,
  Contract,
  ContractType,
  Envelope,
  Member,
  Request,
  RequestKind,
  Role,
  SignField,
  Signer,
  SystemAuditLog,
} from './types';
import {
  members as initialMembers,
  sampleAccountingExports,
  sampleSystemAuditLogs,
  LOG_SOURCES,
  sampleContracts,
  sampleEnvelopes,
  sampleInbox,
  sampleRequests,
  OPERATING_COMPANY,
  roleMeta,
} from './data/sampleData';
import type { InboxFile } from './types';
import { autoFolder, autoTags, canAct, currentStep } from './utils/domain';
import { buildSteps } from './utils/route';
import { nowIso, todayIso, formatDate } from './utils/format';
import { AUDIT_SOURCES, documentHash, isInProgress } from './utils/esign';
import { Layout } from './components/Layout';
import { ToastContainer, type ToastState } from './components/Toast';
import { Tour, WelcomeDialog } from './components/Tour';
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
import { Accounting } from './pages/Accounting';
import { Guide } from './pages/Guide';
import { Login } from './pages/Login';
import { UserAdmin } from './pages/UserAdmin';
import { AuditLog } from './pages/AuditLog';

/** 締結・登録した契約書に持たせる本文（全文検索の対象。デモ用の要約本文） */
const CLAUSES: Record<string, string> = {
  賃貸借契約:
    '乙は、契約終了時に本物件を原状回復して返還する。賃料の改定は、経済情勢の変動により相当でなくなったときに甲乙協議のうえ行う。敷金は退去時に原状回復費用を控除して返還する。',
  売買契約:
    '所有権は売買代金の全額支払いをもって移転する。引渡し後に隠れた瑕疵が判明した場合、引渡しから1年間に限り甲は補修または代金減額の請求に応じる。',
  管理受託契約:
    '乙は、受託業務の全部または一部を第三者に再委託してはならない。ただし、甲の書面による事前承諾を得た場合はこの限りでない。乙は毎月の業務報告書を翌月10日までに甲へ提出する。',
  工事請負契約:
    '乙は工期内に工事を完成し、甲の検査に合格したうえで引き渡す。工事目的物の契約不適合について、引渡しから2年間、乙は補修の責を負う。',
  業務委託契約:
    '乙は、本業務の遂行にあたり知り得た甲の情報を第三者に開示してはならない。この秘密保持義務は契約終了後3年間存続する。',
};

function contractBody(contractType: string, counterparty: string, property: string): string {
  return (
    `本${contractType}は、${counterparty}（以下「乙」という。）と当社（以下「甲」という。）との間で、` +
    `${property !== '' ? property : '本件業務'}に関し締結するものである。` +
    `${CLAUSES[contractType] ?? ''}本契約に定めのない事項は、甲乙誠意をもって協議のうえ定める。`
  );
}

let seq = 2000;
const nextId = (prefix: string) => `${prefix}-${(seq += 1)}`;

let requestNo = 412;
let contractNo = 88;
let envelopeNo = 31;
let exportNo = 146;

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

/** 契約書登録の入力値（紙契約書のPDF登録画面から入力する） */
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
  /** 現在の承認段階を承認する */
  approve: (requestId: string, comment: string) => void;
  /** 現在の承認段階を差し戻す */
  reject: (requestId: string, comment: string) => void;
  /** 承認済の申請を紙で締結し（捺印＋原本スキャン）、契約書を登録する */
  concludeOnPaper: (requestId: string) => string | null;
  /** 新規申請を登録する。登録した申請IDを返す */
  addRequest: (input: NewRequestInput) => string;
  /** 受領した紙契約書のPDFから契約書を登録する。登録した契約書IDを返す */
  registerContract: (
    fileId: string | null,
    draft: ContractDraft,
    origin: Contract['origin'],
    bodyText?: string,
  ) => string;
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
  /** 選択した契約書を会計システム向けのCSVとして出力する */
  exportAccountingCsv: (contractIds: string[]) => void;
  /** 利用者の権限を変更する */
  setMemberRole: (memberId: string, role: Role) => void;
  /** 利用者アカウントの有効・無効を切り替える */
  setMemberActive: (memberId: string, active: boolean) => void;
}

export default function App() {
  const [requests, setRequests] = useState<Request[]>(sampleRequests);
  const [contracts, setContracts] = useState<Contract[]>(sampleContracts);
  const [envelopes, setEnvelopes] = useState<Envelope[]>(sampleEnvelopes);
  const [accountingExports, setAccountingExports] = useState<AccountingExport[]>(sampleAccountingExports);
  const [inbox, setInbox] = useState<InboxFile[]>(sampleInbox);
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [auditLogs, setAuditLogs] = useState<SystemAuditLog[]>(sampleSystemAuditLogs);
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [tourIndex, setTourIndex] = useState<number | null>(null);
  const [welcomeOpen, setWelcomeOpen] = useState(false);

  /** ログイン中の利用者（未ログインの間は先頭の利用者を仮に参照する） */
  const viewer = useMemo(() => members.find(m => m.id === viewerId) ?? members[0], [members, viewerId]);
  const signedIn = viewerId !== null;

  const showToast = useCallback((message: string, type: ToastState['type'] = 'success') => {
    setToast({ message, type });
  }, []);

  /** システム全体の監査ログに1件記録する */
  const writeLog = useCallback(
    (
      entry: {
        category: SystemAuditLog['category'];
        actor: string;
        action: string;
        target?: string;
        result?: SystemAuditLog['result'];
      },
      source: { ip: string; device: string } = LOG_SOURCES.internal,
    ) => {
      setAuditLogs(prev => [
        {
          id: nextId('sl'),
          at: nowIso(),
          category: entry.category,
          actor: entry.actor,
          action: entry.action,
          target: entry.target,
          ip: source.ip,
          device: source.device,
          result: entry.result ?? '成功',
        },
        ...prev,
      ]);
    },
    [],
  );

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
          const idx = r.steps.findIndex(s => s.id === step.id);
          const steps = r.steps.map((s, i) => {
            if (i === idx) {
              return {
                ...s,
                status: 'approved' as const,
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
            : `「${step.name}」を承認しました。次の承認者へ回覧します`;
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
                text: `「${step.name}」を承認しました`,
              },
            ],
          };
        }),
      );
      if (message) showToast(message);
      const req = requests.find(r => r.id === requestId);
      const step = req ? currentStep(req) : undefined;
      writeLog({ category: '申請', actor: viewer.name, action: `「${step?.name ?? '承認段階'}」を承認しました`, target: req?.code });
    },
    [requests, showToast, viewer, writeLog],
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
      const req = requests.find(r => r.id === requestId);
      writeLog({ category: '申請', actor: viewer.name, action: '申請を差し戻しました', target: req?.code });
    },
    [requests, showToast, viewer, writeLog],
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
      bodyText: string;
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
        bodyText: input.bodyText,
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
        bodyText: contractBody(req.contractType, req.counterparty, req.property ?? ''),
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
      writeLog({ category: '申請', actor: viewer.name, action: '申請を起票しました', target: code });
      return id;
    },
    [showToast, viewer, writeLog],
  );

  const registerContract = useCallback(
    (fileId: string | null, draft: ContractDraft, origin: Contract['origin'], bodyText?: string) => {
      const contract = buildContract({
        ...draft,
        origin,
        aiExtracted: true,
        bodyText: bodyText ?? contractBody(draft.contractType, draft.counterparty, draft.property),
      });
      setContracts(prev => [contract, ...prev]);
      if (fileId) setInbox(prev => prev.filter(f => f.id !== fileId));
      showToast(`契約書 ${contract.code} を登録し、「${contract.folder}」へ自動振り分けしました`);
      writeLog({
        category: '契約書',
        actor: viewer.name,
        action: origin === 'scan' ? '契約書を登録しました（OCR・AI項目抽出）' : '契約書を登録しました',
        target: contract.code,
      });
      return contract.id;
    },
    [buildContract, showToast, viewer, writeLog],
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
      writeLog({
        category: '電子契約',
        actor: viewer.name,
        action: `署名依頼を送信しました（署名者${draft.signers.length}名）`,
        target: code,
      });
      return id;
    },
    [showToast, viewer, writeLog],
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
          bodyText: contractBody(env.contractType, env.counterparty, env.property),
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
      writeLog(
        {
          category: '電子契約',
          actor,
          action: completed ? '署名しました（全署名完了・締結）' : '署名しました',
          target: env.code,
        },
        signer.side === 'internal' ? LOG_SOURCES.internal : LOG_SOURCES.counterparty,
      );
      return completed ? (newContract?.id ?? null) : null;
    },
    [buildContract, envelopes, showToast, writeLog],
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
      writeLog(
        { category: '電子契約', actor: signer?.name ?? '相手先', action: '署名を拒否しました', target: env.code },
        LOG_SOURCES.counterparty,
      );
    },
    [envelopes, showToast, writeLog],
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
      writeLog({ category: '電子契約', actor: viewer.name, action: '署名リマインドを送信しました', target: env?.code });
    },
    [envelopes, showToast, viewer, writeLog],
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
      writeLog({ category: '電子契約', actor: viewer.name, action: '送信を取り消しました', target: env?.code });
    },
    [envelopes, showToast, viewer, writeLog],
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
      const env = envelopes.find(e => e.id === envelopeId);
      writeLog({
        category: '電子契約',
        actor: viewer.name,
        action: `署名期限を ${formatDate(deadline)} に延長して再送しました`,
        target: env?.code,
      });
    },
    [envelopes, showToast, viewer, writeLog],
  );

  /* ===== 会計システム連携（外部連携。CSV出力） ===== */

  const exportAccountingCsv = useCallback(
    (contractIds: string[]) => {
      if (contractIds.length === 0) return;
      const targets = contracts.filter(c => contractIds.includes(c.id));
      if (targets.length === 0) return;
      const at = nowIso();
      const code = `EX-2026-${String((exportNo += 1)).padStart(4, '0')}`;
      const fileName = `keiri_keiyaku_${at.slice(0, 10).replace(/-/g, '')}.csv`;

      setContracts(prev =>
        prev.map(c =>
          contractIds.includes(c.id)
            ? { ...c, accounting: 'linked' as const, accountingLinkedAt: at, accountingJobCode: code }
            : c,
        ),
      );
      setAccountingExports(prev => [
        {
          id: nextId('ae'),
          code,
          fileName,
          contractCodes: targets.map(c => c.code),
          totalAmount: targets.reduce((sum, c) => sum + c.amount, 0),
          kind: '新規登録',
          exportedAt: at,
          exportedBy: viewer.name,
        },
        ...prev,
      ]);
      showToast(`${targets.length} 件を ${fileName} として出力しました（出力番号 ${code}）`);
      writeLog({
        category: '外部連携',
        actor: viewer.name,
        action: `会計システム向けCSVを出力しました（${targets.length}件）`,
        target: code,
      });
    },
    [contracts, showToast, viewer, writeLog],
  );

  const setMemberRole = useCallback(
    (memberId: string, role: Role) => {
      setMembers(prev => prev.map(m => (m.id === memberId ? { ...m, role } : m)));
      showToast(`${memberName(memberId)} の権限を「${roleMeta[role].label}」に変更しました`, 'info');
      writeLog({
        category: '権限',
        actor: viewer.name,
        action: `${memberName(memberId)} の権限を「${roleMeta[role].label}」に変更しました`,
        target: members.find(m => m.id === memberId)?.loginId,
      });
    },
    [memberName, members, showToast, viewer, writeLog],
  );

  const setMemberActive = useCallback(
    (memberId: string, active: boolean) => {
      setMembers(prev => prev.map(m => (m.id === memberId ? { ...m, active } : m)));
      showToast(
        active
          ? `${memberName(memberId)} のアカウントを有効にしました`
          : `${memberName(memberId)} のアカウントを無効にしました。ログインできなくなります`,
        'info',
      );
      writeLog({
        category: '権限',
        actor: viewer.name,
        action: active
          ? `${memberName(memberId)} のアカウントを有効にしました`
          : `${memberName(memberId)} のアカウントを無効にしました`,
        target: members.find(m => m.id === memberId)?.loginId,
      });
    },
    [memberName, members, showToast, viewer, writeLog],
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
    exportAccountingCsv,
    setMemberRole,
    setMemberActive,
  };

  const login = (member: Member) => {
    setViewerId(member.id);
    setMembers(prev => prev.map(m => (m.id === member.id ? { ...m, lastLoginAt: nowIso() } : m)));
    setWelcomeOpen(true);
    writeLog({ category: '認証', actor: member.name, action: 'ログインしました' });
  };

  const loginFailed = (name: string, reason: string) => {
    writeLog({ category: '認証', actor: name, action: `ログインに失敗しました（${reason}）`, result: '失敗' });
  };

  const logout = () => {
    writeLog({ category: '認証', actor: viewer.name, action: 'ログアウトしました' });
    setViewerId(null);
    setTourIndex(null);
    setWelcomeOpen(false);
    window.location.hash = '#/';
  };

  if (!signedIn) {
    return (
      <>
        <Login members={members} onLogin={login} onLoginFailed={loginFailed} />
        <ToastContainer toast={toast} onClose={() => setToast(null)} />
      </>
    );
  }

  return (
    <HashRouter>
      <Layout
        members={members}
        viewer={viewer}
        onChangeViewer={setViewerId}
        onLogout={logout}
        myPendingCount={myPendingCount}
        esignPendingCount={esignPendingCount}
        onStartTour={() => {
          setWelcomeOpen(false);
          setTourIndex(0);
        }}
      >
        <Routes>
          <Route path="/" element={<RequestList requests={requests} members={members} viewer={viewer} />} />
          <Route path="/requests" element={<RequestList requests={requests} members={members} viewer={viewer} />} />
          <Route path="/requests/new" element={<RequestNew members={members} viewer={viewer} actions={actions} />} />
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
          <Route path="/contracts" element={<ContractList contracts={contracts} viewer={viewer} />} />
          <Route
            path="/contracts/:id"
            element={
              <ContractDetail
                contracts={contracts}
                requests={requests}
                envelopes={envelopes}
                viewer={viewer}
                actions={actions}
              />
            }
          />
          <Route path="/register" element={<ContractImport inbox={inbox} viewer={viewer} actions={actions} />} />
          <Route
            path="/accounting"
            element={
              <Accounting contracts={contracts} exports={accountingExports} viewer={viewer} actions={actions} />
            }
          />
          <Route path="/users" element={<UserAdmin members={members} viewer={viewer} actions={actions} />} />
          <Route path="/audit" element={<AuditLog logs={auditLogs} viewer={viewer} />} />
          <Route path="/guide" element={<Guide onStartTour={() => setTourIndex(0)} />} />
          <Route path="/settings" element={<RouteSettings members={members} requests={requests} viewer={viewer} />} />
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
