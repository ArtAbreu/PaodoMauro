import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-guard";
import { subMonths } from "date-fns";

export async function GET(request: NextRequest) {
  const authError = await requireAuth(request);
  if (authError) return authError;
  const months = Number(request.nextUrl.searchParams.get("months") ?? 6);
  const start = subMonths(new Date(), months - 1);

  const [sales, expenses, cogs] = await Promise.all([
    prisma.salesOrder.groupBy({
      by: ["orderDate"],
      where: { orderDate: { gte: start } },
      _sum: { totalNet: true },
    }),
    prisma.expense.groupBy({
      by: ["date"],
      where: { date: { gte: start } },
      _sum: { amount: true },
    }),
    prisma.inventoryMovement.findMany({
      where: { createdAt: { gte: start }, type: "OUT" },
      select: { createdAt: true, qty: true, unitCost: true },
    }),
  ]);

  const map = new Map<string, { revenue: number; expenses: number; cogs: number }>();

  const toKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

  for (const sale of sales) {
    const key = toKey(sale.orderDate);
    const entry = map.get(key) ?? { revenue: 0, expenses: 0, cogs: 0 };
    entry.revenue += Number(sale._sum.totalNet ?? 0);
    map.set(key, entry);
  }

  for (const expense of expenses) {
    const key = toKey(expense.date);
    const entry = map.get(key) ?? { revenue: 0, expenses: 0, cogs: 0 };
    entry.expenses += Number(expense._sum.amount ?? 0);
    map.set(key, entry);
  }

  for (const movement of cogs) {
    const key = toKey(movement.createdAt);
    const entry = map.get(key) ?? { revenue: 0, expenses: 0, cogs: 0 };
    entry.cogs += Number(movement.unitCost ?? 0) * Number(movement.qty);
    map.set(key, entry);
  }

  const result = Array.from(map.entries())
    .sort(([a], [b]) => (a > b ? 1 : -1))
    .map(([month, values]) => ({
      month,
      revenue: values.revenue,
      expenses: values.expenses,
      cogs: values.cogs,
      profit: values.revenue - values.expenses - values.cogs,
    }));

  return NextResponse.json(result);
}
