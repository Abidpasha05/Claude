'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { formatMoney } from '@aklio/shared';
import { Check, Clock, ChefHat, Package, Truck, Bike, CheckCircle2, XCircle } from 'lucide-react';

type Order = any;
type History = any;

// Timeline keyed by order_type — different flows show different milestones.
const DELIVERY_FLOW = [
  { key: 'placed', label: 'Placed', icon: Check },
  { key: 'confirmed', label: 'Confirmed', icon: Check },
  { key: 'preparing', label: 'Preparing', icon: ChefHat },
  { key: 'out_for_delivery', label: 'Out for delivery', icon: Bike },
  { key: 'completed', label: 'Delivered', icon: CheckCircle2 },
];

const TAKEAWAY_FLOW = [
  { key: 'placed', label: 'Placed', icon: Check },
  { key: 'confirmed', label: 'Confirmed', icon: Check },
  { key: 'preparing', label: 'Preparing', icon: ChefHat },
  { key: 'ready_for_pickup', label: 'Ready for pickup', icon: Package },
  { key: 'completed', label: 'Picked up', icon: CheckCircle2 },
];

const ORDER_INDEX = ['placed', 'confirmed', 'preparing', 'ready_for_pickup', 'out_for_delivery', 'completed'];

export function TrackingView({
  initialOrder,
  initialHistory,
}: {
  initialOrder: Order;
  initialHistory: History[];
}) {
  const [order, setOrder] = useState<Order>(initialOrder);
  const [history, setHistory] = useState<History[]>(initialHistory);

  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number; at: string } | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`order:${order.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${order.id}` },
        (payload) => setOrder((o: Order) => ({ ...o, ...payload.new }))
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'order_status_history', filter: `order_id=eq.${order.id}` },
        (payload) => setHistory((h) => [...h, payload.new])
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'driver_locations', filter: `order_id=eq.${order.id}` },
        (payload: any) =>
          setDriverLocation({
            lat: Number(payload.new.latitude),
            lng: Number(payload.new.longitude),
            at: payload.new.recorded_at,
          })
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [order.id]);

  const flow = order.order_type === 'delivery' ? DELIVERY_FLOW : TAKEAWAY_FLOW;
  const currentIdx = useMemo(() => {
    if (order.status === 'canceled' || order.status === 'failed') return -1;
    const idx = flow.findIndex((s) => s.key === order.status);
    if (idx >= 0) return idx;
    // Fall through: project from ORDER_INDEX
    return ORDER_INDEX.indexOf(order.status);
  }, [order.status, flow]);

  const isPendingPayment = order.status === 'pending_payment';
  const isFailed = order.status === 'failed' || order.status === 'canceled';

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="card p-6">
        <div className="flex items-start justify-between">
          <div>
            <Link href={`/r/${order.restaurants?.slug}`} className="text-xs text-neutral-500 hover:underline">
              ← Back to {order.restaurants?.name}
            </Link>
            <h1 className="text-2xl font-bold mt-1">Order {order.order_number}</h1>
            <p className="text-sm text-neutral-600 mt-1">{order.restaurants?.name}</p>
          </div>
          <StatusBadge status={order.status} />
        </div>

        {order.slot_start && (
          <div className="mt-4 flex items-center gap-2 text-sm text-neutral-700">
            <Clock className="w-4 h-4" />
            <span>
              {order.order_type === 'delivery' ? 'Delivery window' : 'Pickup window'}:{' '}
              <strong>{new Date(order.slot_start).toLocaleString()}</strong>
            </span>
          </div>
        )}
      </div>

      {isPendingPayment && (
        <div className="card p-6 bg-amber-50 border-amber-200">
          <p className="text-amber-900 font-medium">Waiting for payment to confirm…</p>
          <p className="text-sm text-amber-800 mt-1">
            This page will update automatically once Tap confirms your payment.
          </p>
        </div>
      )}

      {isFailed ? (
        <div className="card p-8 text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
          <h2 className="font-semibold">Order {order.status}</h2>
          {order.cancellation_reason && (
            <p className="text-sm text-neutral-600 mt-2">{order.cancellation_reason}</p>
          )}
        </div>
      ) : (
        <div className="card p-6">
          <h2 className="font-semibold mb-4">Progress</h2>
          <ol className="relative">
            {flow.map((step, i) => {
              const Icon = step.icon;
              const passed = currentIdx >= i;
              const current = currentIdx === i;
              const historyEntry = history.find((h) => h.status === step.key);
              return (
                <li key={step.key} className="flex gap-4 pb-6 last:pb-0 relative">
                  {i < flow.length - 1 && (
                    <div
                      className={`absolute left-4 top-8 bottom-0 w-0.5 ${
                        passed && currentIdx > i ? 'bg-brand-500' : 'bg-neutral-200'
                      }`}
                    />
                  )}
                  <div
                    className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      passed
                        ? 'bg-brand-500 text-white'
                        : 'bg-neutral-200 text-neutral-400'
                    } ${current ? 'ring-4 ring-brand-200 animate-pulse' : ''}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 pt-1">
                    <p className={`font-medium ${passed ? 'text-neutral-900' : 'text-neutral-400'}`}>
                      {step.label}
                    </p>
                    {historyEntry && (
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {new Date(historyEntry.created_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {order.status === 'out_for_delivery' && driverLocation && (
        <div className="card p-6">
          <h2 className="font-semibold mb-2">Driver location</h2>
          <p className="text-sm text-neutral-600 mb-3">
            Updated {new Date(driverLocation.at).toLocaleTimeString()}
          </p>
          <a
            className="btn-secondary inline-flex"
            target="_blank"
            href={`https://www.google.com/maps/search/?api=1&query=${driverLocation.lat},${driverLocation.lng}`}
          >
            View on map
          </a>
        </div>
      )}

      <div className="card p-6">
        <h2 className="font-semibold mb-3">Items</h2>
        <ul className="space-y-1 text-sm">
          {(order.order_items ?? []).map((it: any) => (
            <li key={it.id} className="flex justify-between">
              <span>{it.quantity}× {it.name_snapshot}</span>
              <span>{formatMoney(it.line_total, order.currency)}</span>
            </li>
          ))}
        </ul>
        <div className="border-t mt-3 pt-3 space-y-1 text-sm">
          <Row label="Subtotal" value={formatMoney(order.subtotal, order.currency)} />
          {order.delivery_fee > 0 && <Row label="Delivery" value={formatMoney(order.delivery_fee, order.currency)} />}
          <Row label="VAT" value={formatMoney(order.tax_total, order.currency)} />
          <div className="flex justify-between font-semibold pt-1 border-t">
            <span>Total</span>
            <span>{formatMoney(order.grand_total, order.currency)}</span>
          </div>
        </div>
        <p className="text-xs text-neutral-500 mt-3">
          Paid via {order.payment_method?.replace('_', ' ')} · {order.payment_status}
        </p>
        {order.status === 'completed' && (
          <Link href={`/orders/${order.id}/receipt`} className="btn-secondary mt-4 inline-flex">
            View tax invoice (ZATCA)
          </Link>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-neutral-600"><span>{label}</span><span>{value}</span></div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const color =
    status === 'completed' ? 'bg-green-100 text-green-700'
    : status === 'failed' || status === 'canceled' ? 'bg-red-100 text-red-700'
    : status === 'pending_payment' ? 'bg-amber-100 text-amber-700'
    : 'bg-blue-100 text-blue-700';
  return (
    <span className={`badge ${color} capitalize`}>{status.replace(/_/g, ' ')}</span>
  );
}
