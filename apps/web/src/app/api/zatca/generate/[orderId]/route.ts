// Generate (and optionally report) a ZATCA-compliant invoice for an order.
// Idempotent: if the order already has a zatca_invoice_uuid, returns it.

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { buildInvoiceXML, invoiceHash, newInvoiceUUID, type InvoiceInput } from '@/lib/zatca/invoice';
import { generateZatcaQR } from '@/lib/zatca/qr';
import { reportSimplifiedInvoice } from '@/lib/zatca/clearance';

export async function POST(req: Request, ctx: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await ctx.params;
  const admin = await createAdminClient();

  const { data: order } = await admin
    .from('orders')
    .select('*, order_items(*), restaurants(*)')
    .eq('id', orderId)
    .single();

  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  // Idempotency
  if (order.zatca_invoice_uuid && order.zatca_invoice_hash) {
    return NextResponse.json({
      ok: true,
      idempotent: true,
      invoice_uuid: order.zatca_invoice_uuid,
      invoice_hash: order.zatca_invoice_hash,
      qr: order.metadata?.zatca_qr,
    });
  }

  const restaurant = (order as any).restaurants;
  if (!restaurant?.vat_number) {
    return NextResponse.json({ error: 'Restaurant VAT number missing' }, { status: 400 });
  }

  // ICV = monotonic counter per seller. Pull the current high-water from
  // a separate counter table; lazily create it.
  const { data: counter } = await admin.rpc('next_zatca_counter', {
    p_restaurant_id: restaurant.id,
  });

  // Previous Invoice Hash (PIH). First invoice for this seller = base64("0").
  const { data: prev } = await admin
    .from('orders')
    .select('zatca_invoice_hash')
    .eq('restaurant_id', restaurant.id)
    .not('zatca_invoice_hash', 'is', null)
    .order('completed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const previous_invoice_hash =
    prev?.zatca_invoice_hash ?? Buffer.from('0').toString('base64');

  const invoice_uuid = newInvoiceUUID();
  const now = new Date(order.completed_at ?? order.placed_at ?? order.created_at);

  const linesInput: InvoiceInput['lines'] = (order as any).order_items.map((it: any) => {
    const lineSubtotal = Number(it.unit_price) * it.quantity;
    return {
      name: it.name_snapshot,
      quantity: it.quantity,
      unit_price: Number(it.unit_price),
      line_total: lineSubtotal,
      vat_rate: 0.15,
      vat_amount: Math.round(lineSubtotal * 0.15 * 100) / 100,
    };
  });

  const input: InvoiceInput = {
    invoice_uuid,
    invoice_number: order.order_number,
    invoice_counter: counter ?? 1,
    previous_invoice_hash,
    issue_date: now.toISOString().slice(0, 10),
    issue_time: now.toISOString().slice(11, 19),
    seller: {
      name: restaurant.name,
      vat_number: restaurant.vat_number,
      address_street: restaurant.address_street ?? 'N/A',
      address_building: restaurant.address_building ?? '0000',
      address_district: restaurant.address_district ?? 'N/A',
      address_city: restaurant.address_city ?? 'Riyadh',
      address_postal_code: restaurant.address_postal_code ?? '00000',
      country_code: restaurant.country_code ?? 'SA',
    },
    buyer: order.guest_name ? { name: order.guest_name } : undefined,
    currency: order.currency,
    lines: linesInput,
    subtotal: Number(order.subtotal),
    vat_total: Number(order.tax_total),
    grand_total: Number(order.grand_total),
  };

  const xml = buildInvoiceXML(input);
  const hash = invoiceHash(xml);

  const qr = generateZatcaQR({
    seller_name: restaurant.name,
    vat_number: restaurant.vat_number,
    invoice_timestamp: now.toISOString(),
    invoice_total: Number(order.grand_total),
    vat_total: Number(order.tax_total),
  });

  // Optionally submit to Fatoora reporting (sandbox-friendly).
  const report = restaurant.zatca_enabled
    ? await reportSimplifiedInvoice({ invoice_xml: xml, invoice_hash: hash, invoice_uuid })
    : { ok: true, reportingStatus: 'SKIPPED' };

  await admin
    .from('orders')
    .update({
      zatca_invoice_uuid: invoice_uuid,
      zatca_invoice_hash: hash,
      metadata: { ...(order.metadata ?? {}), zatca_qr: qr, zatca_reporting: report },
    })
    .eq('id', orderId);

  return NextResponse.json({
    ok: true,
    invoice_uuid,
    invoice_hash: hash,
    qr,
    reporting: report,
  });
}

export const GET = POST;
