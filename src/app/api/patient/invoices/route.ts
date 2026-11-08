import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { listInvoices } from '@/services/invoiceService';

export async function GET(request: Request) {
  const { userId } = getAuth(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') ?? '1', 10);
  const size = parseInt(url.searchParams.get('size') ?? '10', 10);
  const from = url.searchParams.get('from') ?? undefined;
  const to = url.searchParams.get('to') ?? undefined;

  const result = await listInvoices(userId, { page, size, from, to });
  return NextResponse.json(result);
}
