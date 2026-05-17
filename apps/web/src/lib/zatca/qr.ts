// ZATCA Phase 1 (Generation Phase) — TLV-encoded QR code.
//
// Spec: ZATCA Standards/Specifications for E-Invoicing Standards section 4.5.
// Every simplified tax invoice issued in Saudi Arabia must carry this QR.
//
// Structure: base64(concatenation of 5 TLV fields)
//   Tag 1: Seller name (UTF-8)
//   Tag 2: VAT registration number (UTF-8)
//   Tag 3: Invoice timestamp (ISO 8601 with timezone)
//   Tag 4: Invoice total with VAT (decimal as string, 2 dp)
//   Tag 5: VAT total (decimal as string, 2 dp)
//
// For Phase 2 (Integration), tags 6–9 (XML hash, public key, ECDSA stamp)
// are also required. Those are appended by clearance.ts after signing.

export interface ZatcaQRPayload {
  seller_name: string;
  vat_number: string;
  invoice_timestamp: string; // ISO 8601, e.g. "2026-05-17T12:30:00Z"
  invoice_total: number;     // grand total including VAT
  vat_total: number;
}

function encodeTLV(tag: number, value: string): Buffer {
  const valueBuf = Buffer.from(value, 'utf8');
  if (valueBuf.length > 255) {
    throw new Error(`ZATCA TLV value for tag ${tag} exceeds 255 bytes`);
  }
  return Buffer.concat([Buffer.from([tag]), Buffer.from([valueBuf.length]), valueBuf]);
}

export function generateZatcaQR(payload: ZatcaQRPayload): string {
  const fields = [
    encodeTLV(1, payload.seller_name),
    encodeTLV(2, payload.vat_number),
    encodeTLV(3, payload.invoice_timestamp),
    encodeTLV(4, payload.invoice_total.toFixed(2)),
    encodeTLV(5, payload.vat_total.toFixed(2)),
  ];
  return Buffer.concat(fields).toString('base64');
}

/**
 * Append the Phase 2 cryptographic fields (tags 6–9) to a base TLV string.
 * Hash, key, and stamp come from the clearance flow.
 */
export function appendPhase2Tags(
  baseQrBase64: string,
  args: { xml_hash: string; public_key: string; signature: string; cert_signature: string }
): string {
  const base = Buffer.from(baseQrBase64, 'base64');
  const ext = Buffer.concat([
    encodeTLV(6, args.xml_hash),
    encodeTLV(7, args.public_key),
    encodeTLV(8, args.signature),
    encodeTLV(9, args.cert_signature),
  ]);
  return Buffer.concat([base, ext]).toString('base64');
}
