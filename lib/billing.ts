// Per-ishchi billing modeli (ARKO bilan kelishilgan reja):
//   - Bazaviy $50/oy — INCLUDED_WORKERS (20) ishchigacha
//   - undan oshsa — har qo'shimcha ishchi uchun +$2.5/oy
// Narxni o'zgartirish kerak bo'lsa — faqat shu konstantalarni tahrirlang.

export const BILLING = {
  basePriceUsd: 50,
  includedWorkers: 20,
  extraWorkerUsd: 2.5,
} as const;

export interface BillBreakdown {
  workers: number;
  base: number;          // bazaviy narx ($)
  extraWorkers: number;  // limitdan oshgan ishchilar
  extraCost: number;     // qo'shimcha narx ($)
  total: number;         // jami ($/oy)
}

/** Ishchi soniga qarab oylik hisob ($). */
export function computeBill(workerCount: number): BillBreakdown {
  const workers = Math.max(0, Math.floor(workerCount || 0));
  const extraWorkers = Math.max(0, workers - BILLING.includedWorkers);
  const extraCost = extraWorkers * BILLING.extraWorkerUsd;
  return {
    workers,
    base: BILLING.basePriceUsd,
    extraWorkers,
    extraCost,
    total: BILLING.basePriceUsd + extraCost,
  };
}
