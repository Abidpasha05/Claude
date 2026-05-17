// ZATCA Fatoora clearance / reporting submission.
//
// Production credentials are issued by ZATCA's onboarding (CSID flow). This
// helper assumes the seller has already onboarded and stored:
//   - ZATCA_USERNAME (CSID compliance username)
//   - ZATCA_SECRET   (CSID secret)
//   - ZATCA_API_BASE (sandbox vs production base URL)
//
// Simplified invoices (B2C — most restaurants) are "reported" rather than
// "cleared": they're submitted within 24 hours and the response confirms
// acceptance.

const API_BASE =
  process.env.ZATCA_API_BASE ??
  'https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal';

interface ReportingResult {
  ok: boolean;
  reportingStatus?: string;
  warnings?: unknown[];
  errors?: unknown[];
}

export async function reportSimplifiedInvoice(args: {
  invoice_xml: string;
  invoice_hash: string;
  invoice_uuid: string;
}): Promise<ReportingResult> {
  if (!process.env.ZATCA_USERNAME || !process.env.ZATCA_SECRET) {
    // Sandbox/dev mode: pretend it was accepted so the rest of the flow can
    // be exercised without onboarding.
    return { ok: true, reportingStatus: 'REPORTED_MOCK' };
  }

  const auth = Buffer.from(
    `${process.env.ZATCA_USERNAME}:${process.env.ZATCA_SECRET}`
  ).toString('base64');

  const res = await fetch(`${API_BASE}/invoices/reporting/single`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Accept-Version': 'V2',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      invoiceHash: args.invoice_hash,
      uuid: args.invoice_uuid,
      invoice: Buffer.from(args.invoice_xml, 'utf8').toString('base64'),
    }),
  });

  const json = await res.json().catch(() => ({}));
  return {
    ok: res.ok,
    reportingStatus: json.reportingStatus,
    warnings: json.warnings,
    errors: json.errors ?? (res.ok ? undefined : [json]),
  };
}
