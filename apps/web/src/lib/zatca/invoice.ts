// UBL 2.1 simplified tax invoice generator for ZATCA Phase 2.
// Spec reference: ZATCA E-Invoicing Standards v3.0 — Annex 1.
//
// This produces the XML body required by the Fatoora clearance / reporting
// API. We generate it eagerly on order completion so the document, hash,
// and QR are immediately available — clearance/submission is a separate
// background step.

import { createHash, randomUUID } from 'node:crypto';

export interface InvoiceLine {
  name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  vat_rate: number; // e.g. 0.15
  vat_amount: number;
}

export interface InvoiceInput {
  invoice_uuid: string;          // ZATCA UUID
  invoice_number: string;        // human-readable e.g. "ORD-260517-100023"
  invoice_counter: number;       // monotonic per seller (ICV)
  previous_invoice_hash: string; // PIH; first invoice = base64("0")
  issue_date: string;            // YYYY-MM-DD
  issue_time: string;            // HH:MM:SS
  seller: {
    name: string;
    vat_number: string;
    address_street: string;
    address_building: string;
    address_district: string;
    address_city: string;
    address_postal_code: string;
    country_code: string;
  };
  buyer?: {
    name?: string;
    vat_number?: string;
  };
  currency: string;
  lines: InvoiceLine[];
  subtotal: number;
  vat_total: number;
  grand_total: number;
}

function esc(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function money(n: number): string {
  return n.toFixed(2);
}

export function buildInvoiceXML(input: InvoiceInput): string {
  const lines = input.lines
    .map((line, i) => {
      const id = i + 1;
      return `
  <cac:InvoiceLine>
    <cbc:ID>${id}</cbc:ID>
    <cbc:InvoicedQuantity unitCode="PCE">${line.quantity}</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="${input.currency}">${money(line.line_total)}</cbc:LineExtensionAmount>
    <cac:TaxTotal>
      <cbc:TaxAmount currencyID="${input.currency}">${money(line.vat_amount)}</cbc:TaxAmount>
      <cbc:RoundingAmount currencyID="${input.currency}">${money(line.line_total + line.vat_amount)}</cbc:RoundingAmount>
    </cac:TaxTotal>
    <cac:Item>
      <cbc:Name>${esc(line.name)}</cbc:Name>
      <cac:ClassifiedTaxCategory>
        <cbc:ID>S</cbc:ID>
        <cbc:Percent>${(line.vat_rate * 100).toFixed(2)}</cbc:Percent>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:ClassifiedTaxCategory>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="${input.currency}">${money(line.unit_price)}</cbc:PriceAmount>
    </cac:Price>
  </cac:InvoiceLine>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
  xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
  xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
  xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2">
  <cbc:ProfileID>reporting:1.0</cbc:ProfileID>
  <cbc:ID>${esc(input.invoice_number)}</cbc:ID>
  <cbc:UUID>${input.invoice_uuid}</cbc:UUID>
  <cbc:IssueDate>${input.issue_date}</cbc:IssueDate>
  <cbc:IssueTime>${input.issue_time}</cbc:IssueTime>
  <cbc:InvoiceTypeCode name="0200000">388</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>${input.currency}</cbc:DocumentCurrencyCode>
  <cbc:TaxCurrencyCode>${input.currency}</cbc:TaxCurrencyCode>
  <cac:AdditionalDocumentReference>
    <cbc:ID>ICV</cbc:ID>
    <cbc:UUID>${input.invoice_counter}</cbc:UUID>
  </cac:AdditionalDocumentReference>
  <cac:AdditionalDocumentReference>
    <cbc:ID>PIH</cbc:ID>
    <cac:Attachment>
      <cbc:EmbeddedDocumentBinaryObject mimeCode="text/plain">${input.previous_invoice_hash}</cbc:EmbeddedDocumentBinaryObject>
    </cac:Attachment>
  </cac:AdditionalDocumentReference>
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="CRN">${esc(input.seller.vat_number)}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PostalAddress>
        <cbc:StreetName>${esc(input.seller.address_street)}</cbc:StreetName>
        <cbc:BuildingNumber>${esc(input.seller.address_building)}</cbc:BuildingNumber>
        <cbc:CitySubdivisionName>${esc(input.seller.address_district)}</cbc:CitySubdivisionName>
        <cbc:CityName>${esc(input.seller.address_city)}</cbc:CityName>
        <cbc:PostalZone>${esc(input.seller.address_postal_code)}</cbc:PostalZone>
        <cac:Country>
          <cbc:IdentificationCode>${input.seller.country_code}</cbc:IdentificationCode>
        </cac:Country>
      </cac:PostalAddress>
      <cac:PartyTaxScheme>
        <cbc:CompanyID>${esc(input.seller.vat_number)}</cbc:CompanyID>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${esc(input.seller.name)}</cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty>
    <cac:Party>
      ${input.buyer?.name ? `<cac:PartyLegalEntity><cbc:RegistrationName>${esc(input.buyer.name)}</cbc:RegistrationName></cac:PartyLegalEntity>` : ''}
    </cac:Party>
  </cac:AccountingCustomerParty>
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="${input.currency}">${money(input.vat_total)}</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="${input.currency}">${money(input.subtotal)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="${input.currency}">${money(input.vat_total)}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cbc:ID>S</cbc:ID>
        <cbc:Percent>15.00</cbc:Percent>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="${input.currency}">${money(input.subtotal)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="${input.currency}">${money(input.subtotal)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="${input.currency}">${money(input.grand_total)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="${input.currency}">${money(input.grand_total)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>${lines}
</Invoice>`;
}

/**
 * SHA-256 hash of the canonicalised invoice XML, base64-encoded.
 * In full Phase 2 you must canonicalise with a specific XSLT (ZATCA provides
 * one) before hashing; here we hash the raw bytes which is sufficient for
 * Phase 1 storage + Phase 2 PIH chaining bootstrap.
 */
export function invoiceHash(xml: string): string {
  return createHash('sha256').update(xml, 'utf8').digest('base64');
}

export function newInvoiceUUID(): string {
  return randomUUID();
}
