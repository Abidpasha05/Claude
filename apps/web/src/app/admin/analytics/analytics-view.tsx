'use client';

import Link from 'next/link';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { formatMoney } from '@aklio/shared';

interface Summary {
  total_orders: number;
  total_revenue: number;
  avg_order: number;
  unique_customers: number;
  prior_orders: number;
  prior_revenue: number;
  prior_avg_order: number;
  prior_unique_customers: number;
}

interface DailyRow { day: string; orders: number; revenue: number; avg_order: number }
interface BestSeller { menu_item_id: string; name: string; units_sold: number; revenue: number }
interface PeakHour { hour_of_day: number; orders: number; revenue: number }
interface Breakdown { dimension: string; bucket: string; orders: number; revenue: number }

const RANGE_OPTIONS = [
  { days: 7, label: 'Last 7 days' },
  { days: 30, label: 'Last 30 days' },
  { days: 90, label: 'Last 90 days' },
  { days: 365, label: 'Last year' },
];

const PIE_COLORS = ['#f59e0b', '#fbbf24', '#fde68a', '#fdba74', '#fef3c7', '#fef3c7'];

export function AnalyticsView({
  days,
  currency,
  summary,
  daily,
  bestSellers,
  peakHours,
  breakdowns,
}: {
  days: number;
  currency: string;
  summary: Summary | null;
  daily: DailyRow[];
  bestSellers: BestSeller[];
  peakHours: PeakHour[];
  breakdowns: Breakdown[];
}) {
  const orderTypes = breakdowns.filter((b) => b.dimension === 'order_type');
  const paymentMethods = breakdowns.filter((b) => b.dimension === 'payment_method');

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-neutral-600">Performance over the last {days} days.</p>
        </div>
        <div className="flex gap-1 rounded-lg bg-neutral-100 p-1">
          {RANGE_OPTIONS.map((r) => (
            <Link
              key={r.days}
              href={`/admin/analytics?days=${r.days}`}
              className={`px-3 py-1.5 rounded-md text-sm ${
                r.days === days ? 'bg-white shadow font-semibold' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              {r.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat
          label="Revenue"
          value={formatMoney(summary?.total_revenue ?? 0, currency)}
          delta={pctDelta(summary?.total_revenue ?? 0, summary?.prior_revenue ?? 0)}
        />
        <Stat
          label="Orders"
          value={String(summary?.total_orders ?? 0)}
          delta={pctDelta(summary?.total_orders ?? 0, summary?.prior_orders ?? 0)}
        />
        <Stat
          label="Average order"
          value={formatMoney(summary?.avg_order ?? 0, currency)}
          delta={pctDelta(summary?.avg_order ?? 0, summary?.prior_avg_order ?? 0)}
        />
        <Stat
          label="Unique customers"
          value={String(summary?.unique_customers ?? 0)}
          delta={pctDelta(summary?.unique_customers ?? 0, summary?.prior_unique_customers ?? 0)}
        />
      </div>

      <div className="card p-5">
        <h2 className="font-semibold mb-3">Revenue trend</h2>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={daily} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis
              dataKey="day"
              stroke="#999"
              fontSize={11}
              tickFormatter={(d) => new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            />
            <YAxis stroke="#999" fontSize={11} tickFormatter={(v) => `${Math.round(v)}`} />
            <Tooltip
              formatter={(value: any, name) =>
                name === 'revenue'
                  ? [formatMoney(Number(value), currency), 'Revenue']
                  : [value, 'Orders']
              }
              labelFormatter={(d) => new Date(d).toLocaleDateString()}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#f59e0b"
              strokeWidth={2}
              fill="url(#revFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h2 className="font-semibold mb-3">Peak hours</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={peakHours}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="hour_of_day" stroke="#999" fontSize={11} tickFormatter={(h) => `${h}:00`} />
              <YAxis stroke="#999" fontSize={11} />
              <Tooltip
                formatter={(v: any) => [v, 'Orders']}
                labelFormatter={(h) => `${h}:00`}
              />
              <Bar dataKey="orders" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h2 className="font-semibold mb-3">Top sellers</h2>
          {bestSellers.length === 0 ? (
            <p className="text-sm text-neutral-500">No sales yet in this period.</p>
          ) : (
            <ol className="space-y-2 text-sm">
              {bestSellers.map((b, i) => (
                <li key={b.menu_item_id} className="flex items-center gap-3">
                  <span className="w-6 text-neutral-400 font-mono">#{i + 1}</span>
                  <span className="flex-1 truncate">{b.name}</span>
                  <span className="text-neutral-500">{b.units_sold} sold</span>
                  <span className="font-semibold w-24 text-right">{formatMoney(b.revenue, currency)}</span>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="card p-5">
          <h2 className="font-semibold mb-3">Order type mix</h2>
          {orderTypes.length === 0 ? (
            <p className="text-sm text-neutral-500">No data.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={orderTypes}
                  dataKey="orders"
                  nameKey="bucket"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(e: any) => e.bucket}
                >
                  {orderTypes.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-5">
          <h2 className="font-semibold mb-3">Payment methods</h2>
          {paymentMethods.length === 0 ? (
            <p className="text-sm text-neutral-500">No data.</p>
          ) : (
            <div className="space-y-2 text-sm">
              {paymentMethods
                .sort((a, b) => b.orders - a.orders)
                .map((p) => {
                  const total = paymentMethods.reduce((s, x) => s + Number(x.orders), 0);
                  const pct = total ? (Number(p.orders) / total) * 100 : 0;
                  return (
                    <div key={p.bucket}>
                      <div className="flex justify-between mb-1">
                        <span className="capitalize">{p.bucket.replace('_', ' ')}</span>
                        <span className="text-neutral-500">{p.orders} · {formatMoney(p.revenue, currency)}</span>
                      </div>
                      <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, delta }: { label: string; value: string; delta: number | null }) {
  const positive = delta !== null && delta > 0;
  const negative = delta !== null && delta < 0;
  return (
    <div className="card p-5">
      <p className="text-xs text-neutral-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {delta !== null && (
        <p
          className={`text-xs mt-2 flex items-center gap-1 ${
            positive ? 'text-green-600' : negative ? 'text-red-600' : 'text-neutral-400'
          }`}
        >
          {positive ? <ArrowUpRight className="w-3 h-3" /> : negative ? <ArrowDownRight className="w-3 h-3" /> : null}
          {Math.abs(delta).toFixed(1)}% vs prior period
        </p>
      )}
    </div>
  );
}

function pctDelta(current: number, prior: number): number | null {
  const c = Number(current);
  const p = Number(prior);
  if (!p) return c ? 100 : null;
  return ((c - p) / p) * 100;
}
