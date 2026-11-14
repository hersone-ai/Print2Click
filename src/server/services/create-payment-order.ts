import { createRazorpayClient } from '@/server/providers/razorpay-provider';

export async function createPaymentOrder(amountPaise: number, campaignId: string) {
  const order = await createRazorpayClient().orders.create({
    amount: amountPaise,
    currency: 'INR',
    receipt: campaignId.slice(0, 40),
    notes: { campaignId },
  });
  return {
    id: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  };
}
