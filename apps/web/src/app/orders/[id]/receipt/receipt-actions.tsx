'use client';

export function ReceiptActions({ orderId }: { orderId: string }) {
  return (
    <footer className="text-center text-xs text-neutral-400 mt-6 print:hidden">
      <a href={`/api/zatca/generate/${orderId}`} className="underline">Regenerate</a>
      {' · '}
      <button onClick={() => window.print()} className="underline">Print</button>
    </footer>
  );
}
