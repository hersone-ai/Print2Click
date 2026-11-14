import { NextResponse } from 'next/server';
import { createPaymentOrder } from '@/server/services/create-payment-order';
export const runtime = 'nodejs';
export async function POST(req: Request) {
  try {
    const { amountPaise, campaignId } = await req.json();
    if (!Number.isInteger(amountPaise) || amountPaise < 100 || amountPaise > 50000000 || typeof campaignId !== 'string') return NextResponse.json({ error: 'Invalid order request.' }, { status: 400 });
    const order = await createPaymentOrder(amountPaise, campaignId);
    return NextResponse.json(order);
  } catch { return NextResponse.json({ error: 'Payment setup failed.' }, { status: 503 }); }
}
