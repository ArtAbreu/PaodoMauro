"use client";

import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar } from "recharts";
import { formatCurrencyBRL } from "@/lib/utils";

type DataPoint = { date: string; total: number };

export function WeeklySalesChart({ data }: { data: DataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
        <XAxis dataKey="date" className="text-xs" />
        <YAxis tickFormatter={(value) => formatCurrencyBRL(value)} className="text-xs" width={90} />
        <Tooltip formatter={(value: number) => formatCurrencyBRL(value)} labelFormatter={(label) => label} />
        <Bar dataKey="total" fill="#f97316" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
