import { notFound } from 'next/navigation';
import QRCode from 'qrcode';
import { createAdminClient } from '@/lib/supabase/server';
import { formatMoney } from '@aklio/shared';
import { generateZatcaQR } from '@/lib/zatca/qr';
import { ReceiptActions } from './receipt-actions';

export const dynamic = 'force-dynamic';

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = await createAdminClient();

  const { data: order } = await admin
    .from('orders')
    .select('*, order_items(*), restaurants(*)')
    .eq('id', id)
    .single();

  if (!order) notFound();

  const restaurant = (order as any).restaurants;
  const issueDate = new Date(order.completed_at ?? order.placed_at ?? order.created_at);

  // Use stored QR if available, otherwise compute on the fly (preview before
  // the order is completed).
  const qrPayload =
    order.metadata?.zatca_qr ??
    generateZatcaQR({
      seller_name: restaurant.name,
      vat_number: restaurant.vat_number ?? 'PREVIEW',
      invoice_timestamp: issueDate.toISOString(),
      invoice_total: Number(order.grand_total),
      vat_total: Number(order.tax_total),
    });

  const qrDataUrl = await QRCode.toDataURL(qrPayload, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 220,
  });

  return (
    <div className="min-h-screen bg-neutral-100 py-8 print:bg-white print:py-0">
      <div className="max-w-md mx-auto bg-white p-8 shadow print:shadow-none">
        <header className="text-center border-b pb-4">
          <h1 className="text-xl font-bold">{restaurant.name}</h1>
          {restaurant.name_ar && <p className="text-sm" dir="rtl">{restaurant.name_ar}</p>}
          {restaurant.vat_number && (
            <p className="text-xs text-neutral-500 mt-1">VAT: {restaurant.vat_number}</p>
          )}
        </header>

        <section className="mt-4 text-sm">
          <Row label="Invoice #" value={order.order_number} />
          <Row label="Date" value={issueDate.toLocaleString()} />
          {order.zatca_invoice_uuid && (
            <Row label="ZATCA UUID" value={<span className="font-mono text-xs">{order.zatca_invoice_uuid}</span>} />
          )}
          <Row label="Type" value={order.order_type} />
        </section>

        <table className="w-full mt-4 text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-1">Item</th>
              <th className="text-right py-1">Qty</th>
              <th className="text-right py-1">Total</th>
            </tr>
          </thead>
          <tbody>
            {(order as any).order_items.map((it: any) => (
              <tr key={it.id} className="border-b border-dashed">
                <td className="py-1">{it.name_snapshot}</td>
                <td className="text-right py-1">{it.quantity}</td>
                <td className="text-right py-1">{formatMoney(it.line_total, order.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <section className="mt-4 text-sm">
          <Row label="Subtotal (excl. VAT)" value={formatMoney(order.subtotal, order.currency)} />
          {order.delivery_fee > 0 && <Row label="Delivery" value={formatMoney(order.delivery_fee, order.currency)} />}
          <Row label="VAT (15%)" value={formatMoney(order.tax_total, order.currency)} />
          <div className="flex justify-between font-bold border-t mt-2 pt-2">
            <span>Total</span>
            <span>{formatMoney(order.grand_total, order.currency)}</span>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Paid via {order.payment_method?.replace('_', ' ')} ({order.payment_status})
          </p>
        </section>

        <div className="flex justify-center mt-6">
          <img src={qrDataUrl} alt="ZATCA QR" width={220} height={220} />
        </div>
        <p className="text-center text-xs text-neutral-500 mt-2">
          Scan with the ZATCA / Fatoora app to verify this invoice.
        </p>

        <ReceiptActions orderId={order.id} />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between py-0.5">
      <span className="text-neutral-500">{label}</span>
      <span>{value}</span>
    </div>
  );
}
