// 見積金額の計算（入力値に必ず追従させる）

import type { QuoteItem } from '../types';

/** 消費税率（10%） */
export const TAX_RATE = 0.1;

export interface QuoteTotals {
  /** 明細の合計（値引前） */
  subtotal: number;
  /** 値引額 */
  discount: number;
  /** 課税対象額（値引後） */
  taxable: number;
  /** 消費税額 */
  tax: number;
  /** 税込合計＝請負代金の額 */
  total: number;
}

export function lineAmount(item: QuoteItem): number {
  return Math.round(item.quantity * item.unitPrice);
}

export function calcTotals(items: QuoteItem[], discount: number): QuoteTotals {
  const subtotal = items.reduce((sum, it) => sum + lineAmount(it), 0);
  const safeDiscount = Math.min(Math.max(Math.round(discount) || 0, 0), subtotal);
  const taxable = subtotal - safeDiscount;
  const tax = Math.floor(taxable * TAX_RATE);
  return { subtotal, discount: safeDiscount, taxable, tax, total: taxable + tax };
}
