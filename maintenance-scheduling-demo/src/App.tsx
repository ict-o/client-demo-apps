import { useState, useCallback } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import type { Role, WorkOrder, CandidateSlot, SlotResponse, WorkPhoto } from './types';
import { sampleWorkOrders } from './data/sampleData';
import { nowIso } from './utils/format';
import { Layout } from './components/Layout';
import { ToastContainer, type ToastState } from './components/Toast';
import { WorkOrderList } from './pages/WorkOrderList';
import { WorkOrderDetail } from './pages/WorkOrderDetail';
import { WorkOrderNew } from './pages/WorkOrderNew';
import { CalendarView } from './pages/CalendarView';

/** 現在の視点に対応する操作者情報（履歴に残す名前） */
function getActor(role: Role): { name: string } {
  if (role === 'customer') return { name: '施設管理課 森田' };
  if (role === 'partner') return { name: 'みどり環境サービス 高橋' };
  return { name: '川島 涼太' };
}

let historySeq = 1000;
function newHistoryId() {
  historySeq += 1;
  return `hx-${historySeq}`;
}

export interface OrderActions {
  respondSlot: (orderId: string, slotId: string, response: SlotResponse, comment?: string) => void;
  confirmSlot: (orderId: string, slotId: string) => void;
  proposeCandidates: (orderId: string, candidates: CandidateSlot[], isRepropose: boolean) => void;
  startWork: (orderId: string) => void;
  toggleTask: (orderId: string, taskId: string) => void;
  updateReportField: (orderId: string, field: 'summary' | 'result' | 'nextAdvice', value: string) => void;
  addPhoto: (orderId: string, kind: WorkPhoto['kind'], caption: string) => void;
  removePhoto: (orderId: string, photoId: string) => void;
  submitReport: (orderId: string) => void;
}

export default function App() {
  const [orders, setOrders] = useState<WorkOrder[]>(sampleWorkOrders);
  const [role, setRole] = useState<Role>('company');
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((message: string, type: ToastState['type'] = 'success') => {
    setToast({ message, type });
  }, []);

  /** 案件を1件更新しつつ履歴を追加する共通ヘルパー */
  const mutate = useCallback(
    (
      orderId: string,
      updater: (o: WorkOrder) => WorkOrder,
      action?: string | ((o: WorkOrder) => string),
    ) => {
      const actor = getActor(role);
      setOrders(prev =>
        prev.map(o => {
          if (o.id !== orderId) return o;
          const updated = updater(o);
          const actionText = typeof action === 'function' ? action(o) : action;
          if (actionText) {
            return {
              ...updated,
              history: [
                ...o.history,
                { id: newHistoryId(), at: nowIso(), actorRole: role, actorName: actor.name, action: actionText },
              ],
            };
          }
          return updated;
        }),
      );
    },
    [role],
  );

  const addWorkOrder = useCallback(
    (order: WorkOrder) => {
      setOrders(prev => [order, ...prev]);
      showToast('新しい作業予定を登録しました');
    },
    [showToast],
  );

  const actions: OrderActions = {
    respondSlot: (orderId, slotId, response, comment) => {
      mutate(
        orderId,
        o => ({
          ...o,
          candidates: o.candidates.map(c =>
            c.id === slotId ? { ...c, response, comment: comment?.trim() ? comment.trim() : undefined } : c,
          ),
        }),
        o => {
          const slot = o.candidates.find(c => c.id === slotId);
          const label = slot ? `${slot.date} ${slot.timeSlot}` : '候補日';
          return `${label} に ${response === 'ok' ? 'OK（実施可）' : 'NG（実施不可）'} と回答しました`;
        },
      );
      showToast(
        response === 'ok' ? 'OKで回答しました。当社の日程確定をお待ちください' : 'NGで回答しました。当社が再調整します',
        response === 'ok' ? 'success' : 'info',
      );
    },

    confirmSlot: (orderId, slotId) => {
      mutate(
        orderId,
        o => ({ ...o, status: 'confirmed', confirmedSlotId: slotId }),
        o => {
          const slot = o.candidates.find(c => c.id === slotId);
          return slot ? `${slot.date} ${slot.timeSlot} で日程を確定しました` : '日程を確定しました';
        },
      );
      showToast('日程を確定しました。カレンダーに反映されます');
    },

    proposeCandidates: (orderId, candidates, isRepropose) => {
      mutate(
        orderId,
        o => ({
          ...o,
          candidates,
          confirmedSlotId: undefined,
          status: 'proposed',
        }),
        isRepropose
          ? `候補日を${candidates.length}件で再提示しました`
          : `候補日を${candidates.length}件提示しました`,
      );
      showToast(isRepropose ? '候補日を再提示しました' : '候補日を提示しました');
    },

    startWork: orderId => {
      mutate(orderId, o => ({ ...o, status: 'in_progress' }), '作業を開始しました');
      showToast('作業を開始しました');
    },

    toggleTask: (orderId, taskId) => {
      mutate(orderId, o => ({
        ...o,
        tasks: o.tasks.map(t => (t.id === taskId ? { ...t, done: !t.done } : t)),
      }));
    },

    updateReportField: (orderId, field, value) => {
      mutate(orderId, o => ({ ...o, report: { ...o.report, [field]: value } }));
    },

    addPhoto: (orderId, kind, caption) => {
      const photo: WorkPhoto = { id: `ph-${newHistoryId()}`, kind, caption };
      mutate(orderId, o => ({ ...o, report: { ...o.report, photos: [...o.report.photos, photo] } }));
      showToast(`${kind === 'before' ? '作業前' : '作業後'}の写真を追加しました`);
    },

    removePhoto: (orderId, photoId) => {
      mutate(orderId, o => ({
        ...o,
        report: { ...o.report, photos: o.report.photos.filter(p => p.id !== photoId) },
      }));
    },

    submitReport: orderId => {
      const actor = getActor(role);
      mutate(
        orderId,
        o => ({
          ...o,
          status: 'reported',
          report: { ...o.report, submittedAt: nowIso(), submittedBy: actor.name },
        }),
        '作業報告書を提出しました',
      );
      showToast('作業報告書を提出しました。業務が完了しました');
    },
  };

  return (
    <HashRouter>
      <Layout role={role} onRoleChange={setRole}>
        <Routes>
          <Route path="/" element={<WorkOrderList orders={orders} role={role} />} />
          <Route path="/new" element={<WorkOrderNew onCreate={addWorkOrder} />} />
          <Route path="/calendar" element={<CalendarView orders={orders} role={role} />} />
          <Route
            path="/order/:id"
            element={<WorkOrderDetail orders={orders} role={role} actions={actions} onToast={showToast} />}
          />
        </Routes>
      </Layout>
      <ToastContainer toast={toast} onClose={() => setToast(null)} />
    </HashRouter>
  );
}
