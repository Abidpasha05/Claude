'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Bell, BellOff, Volume2, VolumeX } from 'lucide-react';

interface Restaurant {
  id: string;
  name: string;
  currency: string;
  preparation_time_minutes: number;
}

interface Order {
  id: string;
  order_number: string;
  order_type: string;
  status: 'placed' | 'confirmed' | 'preparing' | 'ready_for_pickup';
  slot_start: string | null;
  placed_at: string | null;
  notes: string | null;
  guest_name: string | null;
  grand_total: number;
  currency: string;
  order_items: { name_snapshot: string; quantity: number; notes?: string | null }[];
}

const COLUMNS: { status: Order['status'][]; title: string; bg: string }[] = [
  { status: ['placed', 'confirmed'], title: 'New', bg: 'bg-amber-500' },
  { status: ['preparing'], title: 'Preparing', bg: 'bg-blue-500' },
  { status: ['ready_for_pickup'], title: 'Ready', bg: 'bg-green-500' },
];

const NEXT_STATUS: Record<Order['status'], Order['status'] | 'completed'> = {
  placed: 'preparing',
  confirmed: 'preparing',
  preparing: 'ready_for_pickup',
  ready_for_pickup: 'completed',
};

const NEXT_LABEL: Record<Order['status'], string> = {
  placed: 'Start preparing',
  confirmed: 'Start preparing',
  preparing: 'Mark ready',
  ready_for_pickup: 'Bump (complete)',
};

export function KdsBoard({
  restaurant,
  initialOrders,
}: {
  restaurant: Restaurant;
  initialOrders: Order[];
}) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [now, setNow] = useState(Date.now());
  const [soundOn, setSoundOn] = useState(true);
  const knownIds = useRef(new Set(initialOrders.map((o) => o.id)));

  // Tick every second to keep wait-time counters live.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Sound for new orders. Use Web Audio so we don't ship an asset.
  const playBeep = useCallback(() => {
    if (!soundOn) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = 'sine';
      o.frequency.setValueAtTime(880, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.25);
      g.gain.setValueAtTime(0.25, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      o.start();
      o.stop(ctx.currentTime + 0.4);
    } catch {}
  }, [soundOn]);

  // Realtime subscription: new orders → INSERT, status changes → UPDATE.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`kds:${restaurant.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${restaurant.id}` },
        async (payload: any) => {
          const id = payload.new.id;
          if (knownIds.current.has(id)) return;
          knownIds.current.add(id);
          // Fetch full row with items joined.
          const { data: full } = await supabase
            .from('orders')
            .select('id, order_number, order_type, status, slot_start, placed_at, notes, guest_name, grand_total, currency, order_items(name_snapshot, quantity, notes)')
            .eq('id', id)
            .single();
          if (full && ['placed', 'confirmed', 'preparing', 'ready_for_pickup'].includes(full.status as any)) {
            setOrders((curr) => [...curr, full as any]);
            playBeep();
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${restaurant.id}` },
        (payload: any) => {
          setOrders((curr) => {
            const idx = curr.findIndex((o) => o.id === payload.new.id);
            const updated = { ...(idx >= 0 ? curr[idx] : ({} as Order)), ...payload.new };
            // Remove from board once it leaves the cooking pipeline.
            if (!['placed', 'confirmed', 'preparing', 'ready_for_pickup'].includes(updated.status)) {
              knownIds.current.delete(updated.id);
              return curr.filter((o) => o.id !== updated.id);
            }
            if (idx === -1) return curr;
            const next = [...curr];
            next[idx] = updated;
            return next;
          });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurant.id, playBeep]);

  async function advance(order: Order) {
    const next = NEXT_STATUS[order.status];
    const supabase = createClient();
    await supabase
      .from('orders')
      .update({ status: next, completed_at: next === 'completed' ? new Date().toISOString() : null })
      .eq('id', order.id);
    await supabase.from('order_status_history').insert({ order_id: order.id, status: next });
    // Optimistic — Realtime will follow.
    setOrders((curr) =>
      next === 'completed'
        ? curr.filter((o) => o.id !== order.id)
        : curr.map((o) => (o.id === order.id ? { ...o, status: next as Order['status'] } : o))
    );
  }

  const byColumn = useMemo(() => {
    return COLUMNS.map((col) => ({
      ...col,
      orders: orders
        .filter((o) => col.status.includes(o.status))
        .sort((a, b) => new Date(a.placed_at ?? 0).getTime() - new Date(b.placed_at ?? 0).getTime()),
    }));
  }, [orders]);

  return (
    <div className="min-h-screen bg-neutral-900 text-white flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
        <div>
          <h1 className="text-lg font-bold">{restaurant.name}</h1>
          <p className="text-xs text-neutral-400">Kitchen Display · {orders.length} active</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundOn((s) => !s)}
            className="p-2 rounded-md hover:bg-neutral-800"
            title={soundOn ? 'Mute new-order chime' : 'Unmute new-order chime'}
          >
            {soundOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
          <span className="text-sm text-neutral-400 font-mono">
            {new Date(now).toLocaleTimeString()}
          </span>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2 p-2 overflow-hidden">
        {byColumn.map((col) => (
          <section key={col.title} className="flex flex-col bg-neutral-800 rounded-lg overflow-hidden">
            <div className={`${col.bg} px-4 py-2 font-semibold flex justify-between`}>
              <span>{col.title}</span>
              <span>{col.orders.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {col.orders.length === 0 && (
                <p className="text-center text-neutral-500 text-sm p-8">No orders</p>
              )}
              {col.orders.map((o) => (
                <OrderCard key={o.id} order={o} now={now} prepMinutes={restaurant.preparation_time_minutes} onAdvance={() => advance(o)} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function OrderCard({
  order,
  now,
  prepMinutes,
  onAdvance,
}: {
  order: Order;
  now: number;
  prepMinutes: number;
  onAdvance: () => void;
}) {
  const placedMs = order.placed_at ? new Date(order.placed_at).getTime() : now;
  const waitSec = Math.max(0, Math.floor((now - placedMs) / 1000));
  const waitMin = Math.floor(waitSec / 60);
  const overdue = waitMin >= prepMinutes;
  const warn = waitMin >= prepMinutes - 5 && !overdue;

  const wait =
    waitSec < 60 ? `${waitSec}s`
    : `${String(Math.floor(waitSec / 60)).padStart(1, '0')}:${String(waitSec % 60).padStart(2, '0')}`;

  return (
    <article
      className={`rounded-lg p-3 ${
        overdue ? 'bg-red-950 border border-red-500'
        : warn ? 'bg-amber-950 border border-amber-500'
        : 'bg-neutral-900 border border-neutral-700'
      }`}
    >
      <header className="flex justify-between items-start mb-2">
        <div>
          <div className="font-mono text-sm">{order.order_number}</div>
          <div className="text-xs text-neutral-400 capitalize">{order.order_type}</div>
        </div>
        <div className={`text-right ${overdue ? 'text-red-300' : warn ? 'text-amber-300' : 'text-neutral-400'}`}>
          <div className="font-mono text-xl font-bold">{wait}</div>
          {order.slot_start && (
            <div className="text-[10px]">due {new Date(order.slot_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
          )}
        </div>
      </header>

      <ul className="space-y-1 mb-3">
        {order.order_items?.map((it, i) => (
          <li key={i} className="flex items-baseline gap-2 text-sm">
            <span className="font-bold text-amber-400 w-6">{it.quantity}×</span>
            <span className="flex-1">{it.name_snapshot}</span>
          </li>
        ))}
      </ul>

      {order.notes && (
        <p className="text-xs text-amber-300 mb-2 italic">"{order.notes}"</p>
      )}

      <button
        onClick={onAdvance}
        className="w-full bg-white text-neutral-900 font-semibold py-2 rounded-md hover:bg-neutral-200 active:scale-95 transition"
      >
        {NEXT_LABEL[order.status]}
      </button>
    </article>
  );
}
