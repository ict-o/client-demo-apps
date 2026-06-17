import type { Estimate } from '../types';

export function formatCurrency(value: number): string {
  return `¥${value.toLocaleString('ja-JP')}`;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

export interface Totals {
  subtotal: number;
  serviceCharge: number;
  discountFixed: number;
  discountPercent: number;
  preTax: number;
  tax: number;
  total: number;
}

export function calcTotals(estimate: Estimate): Totals {
  const subtotal = estimate.items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );

  const serviceCharge = Math.round(subtotal * (estimate.serviceRatePercent / 100));

  const discountFixed = estimate.discounts
    .filter(d => d.type === 'fixed')
    .reduce((sum, d) => sum + d.amount, 0);

  const discountPercent = estimate.discounts
    .filter(d => d.type === 'percent')
    .reduce((sum, d) => {
      if (d.baseItemId) {
        const item = estimate.items.find(i => i.id === d.baseItemId);
        if (item) {
          return sum + Math.round(item.unitPrice * item.quantity * (d.amount / 100));
        }
      }
      return sum + Math.round((subtotal + serviceCharge) * (d.amount / 100));
    }, 0);

  const preTax = subtotal + serviceCharge - discountFixed - discountPercent;
  const tax = Math.round(preTax * (estimate.taxRatePercent / 100));
  const total = preTax + tax;

  return { subtotal, serviceCharge, discountFixed, discountPercent, preTax, tax, total };
}
