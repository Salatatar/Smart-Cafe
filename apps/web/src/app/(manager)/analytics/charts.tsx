'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  getSales,
  getTopMenu,
  getPeakHours,
  type SalesRow,
  type TopMenuRow,
  type PeakHourRow,
} from '@/features/analytics/api';
import { toCSV, downloadCSV } from '@/features/analytics/csv';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

export default function Charts({
  defaultFrom,
  defaultTo,
}: {
  defaultFrom: string;
  defaultTo: string;
}) {
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);

  const sales = useQuery<SalesRow[]>({
    queryKey: ['sales', { from, to }],
    queryFn: () => getSales(from, to),
  });
  const top = useQuery<TopMenuRow[]>({
    queryKey: ['top', { from, to }],
    queryFn: () => getTopMenu(from, to, 10),
  });
  const hours = useQuery<PeakHourRow[]>({
    queryKey: ['hours', { from, to }],
    queryFn: () => getPeakHours(from, to),
  });

  const onExport = (which: 'sales' | 'top' | 'hours') => {
    const map = { sales, top, hours } as const;
    const q = map[which];
    if (!q.data?.length) return alert('ยังไม่มีข้อมูลให้ส่งออก');
    const csv = toCSV(q.data as unknown as Record<string, unknown>[]);
    downloadCSV(csv, `${which}_${from}_${to}.csv`);
  };

  return (
    <div className="space-y-8">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border bg-white p-4">
        <div>
          <label className="block text-sm text-gray-600">จากวันที่</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-lg border px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600">ถึงวันที่</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-lg border px-3 py-2"
          />
        </div>
        <div className="ml-auto text-sm text-gray-500">
          ช่วงวันที่: {from} → {to}
        </div>
      </div>

      {/* Sales per day */}
      <section className="rounded-2xl border bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">ยอดขายรายวัน</h2>
          <button onClick={() => onExport('sales')} className="rounded-lg border px-3 py-1 text-sm">
            Export CSV
          </button>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer>
            <LineChart data={sales.data ?? []} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Top menu */}
      <section className="rounded-2xl border bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">เมนูขายดี (Top 10)</h2>
          <button onClick={() => onExport('top')} className="rounded-lg border px-3 py-1 text-sm">
            Export CSV
          </button>
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer>
            <BarChart data={top.data ?? []} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-20} height={60} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="qty" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Peak hours */}
      <section className="rounded-2xl border bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">ชั่วโมงพีค</h2>
          <button onClick={() => onExport('hours')} className="rounded-lg border px-3 py-1 text-sm">
            Export CSV
          </button>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer>
            <BarChart data={hours.data ?? []} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="orders" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
