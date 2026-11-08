import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { getInvoiceFile } from '@/services/invoiceService';
import { createReadStream } from 'fs';
import { join } from 'path';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { userId } = getAuth(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const invoiceId = params.id;
  const filePath = await getInvoiceFile(userId, invoiceId);
  if (!filePath) {
    // Either not found or not owned
    return NextResponse.json({ error: 'Not found or access denied' }, { status: 404 });
  }
  // Resolve file within public/invoices directory
  const absolutePath = join(process.cwd(), 'public', 'invoices', filePath);
  try {
    const stream = createReadStream(absolutePath);
    const response = new NextResponse(stream);
    // Set headers for download
    response.headers.set('Content-Type', 'application/pdf');
    response.headers.set('Content-Disposition', `attachment; filename="${filePath}"`);
    return response;
  } catch (e) {
    console.error('[download invoice] error', e);
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}
