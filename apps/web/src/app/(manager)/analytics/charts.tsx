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

  const hasNestedData = <T,>(val: unknown): val is { data: T[] } => {
    return (
      typeof val === 'object' &&
      val !== null &&
      'data' in (val as Record<string, unknown>) &&
      Array.isArray((val as { data: unknown }).data)
    );
  };

  const normalize = <T,>(q: { data?: unknown }): T[] => {
    const d = q.data;
    if (Array.isArray(d)) return d as T[];
    if (hasNestedData<T>(d)) return d.data;
    return [];
  };

  const salesData = normalize<SalesRow>(sales);
  const topData = normalize<TopMenuRow>(top);
  const hoursData = normalize<PeakHourRow>(hours);

  const onExport = (which: 'sales' | 'top' | 'hours') => {
    const map = { sales: salesData, top: topData, hours: hoursData } as const;
    const rows = map[which];
    if (!rows.length) return alert('ยังไม่มีข้อมูลให้ส่งออก');
    const csv = toCSV(rows as unknown as Record<string, unknown>[]);
    downloadCSV(csv, `${which}_${from}_${to}.csv`);
  };

  return (
    <div className="space-y-8">
      {/* Filters */}
      <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4 sm:items-end">
          <div>
            <label className="block text-xs font-medium text-stone-600">จากวันที่</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-stone-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-600">ถึงวันที่</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-stone-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <div className="sm:col-span-2 text-sm text-stone-600 sm:text-right">
            ช่วงวันที่: <span className="font-medium text-stone-800">{from}</span> →{' '}
            <span className="font-medium text-stone-800">{to}</span>
          </div>
        </div>
      </div>

      {/* Sales per day */}
      <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-stone-900">ยอดขายรายวัน</h2>
          <button
            onClick={() => onExport('sales')}
            className="inline-flex items-center rounded-xl border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            ส่งออก CSV
          </button>
        </div>
        <div className="h-64 w-full">
          {sales.isLoading ? (
            <div className="flex h-full items-center justify-center text-sm text-stone-500">
              กำลังโหลด…
            </div>
          ) : salesData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-stone-500">
              ไม่มีข้อมูลในช่วงวันที่
            </div>
          ) : (
            <ResponsiveContainer>
              <LineChart data={salesData} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      {/* Top menu */}
      <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-stone-900">เมนูขายดี (Top 10)</h2>
          <button
            onClick={() => onExport('top')}
            className="inline-flex items-center rounded-xl border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            ส่งออก CSV
          </button>
        </div>
        <div className="h-72 w-full">
          {top.isLoading ? (
            <div className="flex h-full items-center justify-center text-sm text-stone-500">
              กำลังโหลด…
            </div>
          ) : topData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-stone-500">
              ไม่มีข้อมูลในช่วงวันที่
            </div>
          ) : (
            <ResponsiveContainer>
              <BarChart data={topData} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12 }}
                  interval={0}
                  angle={-20}
                  height={60}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="qty" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      {/* Peak hours */}
      <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-stone-900">ชั่วโมงพีค</h2>
          <button
            onClick={() => onExport('hours')}
            className="inline-flex items-center rounded-xl border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            ส่งออก CSV
          </button>
        </div>
        <div className="h-64 w-full">
          {hours.isLoading ? (
            <div className="flex h-full items-center justify-center text-sm text-stone-500">
              กำลังโหลด…
            </div>
          ) : hoursData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-stone-500">
              ไม่มีข้อมูลในช่วงวันที่
            </div>
          ) : (
            <ResponsiveContainer>
              <BarChart data={hoursData} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="orders" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>
    </div>
  );
}
