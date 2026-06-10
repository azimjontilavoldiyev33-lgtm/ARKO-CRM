import mongoose from 'mongoose';
import Transaction from '@/models/Transaction';
import type { IOrder } from '@/models/Order';

/**
 * Buyurtma "completed" bo'lganda Moliya ledger'idagi avtomatik daromad yozuvini sinxronlaydi.
 * - Bir buyurtmaga BITTA auto-yozuv (Transaction.order ref bo'yicha dedupe — qayta chaqirilsa takrorlanmaydi).
 * - completed + narx > 0  → yozuv yo'q bo'lsa yaratadi; narx/nom o'zgargan bo'lsa yangilaydi.
 * - completed emas yoki narx 0 → mavjud auto-yozuv bo'lsa o'chiradi.
 * Qo'lda kiritilgan (order ref'siz) daromadlarga tegmaydi.
 */
export async function reconcileOrderIncome(
  companyId: mongoose.Types.ObjectId | string,
  order: IOrder,
) {
  const existing = await Transaction.findOne({ company: companyId, order: order._id });
  const shouldHave = order.status === 'completed' && (order.amount ?? 0) > 0;

  if (shouldHave) {
    if (!existing) {
      await Transaction.create({
        company: companyId,
        type: 'income',
        category: 'buyurtma',
        amount: order.amount,
        note: order.title,
        date: new Date(),
        order: order._id,
      });
    } else if (existing.amount !== order.amount || existing.note !== order.title) {
      existing.amount = order.amount;
      existing.note = order.title;
      await existing.save();
    }
  } else if (existing) {
    await Transaction.deleteOne({ _id: existing._id });
  }
}
