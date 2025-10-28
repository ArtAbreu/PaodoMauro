import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, Table, TBody, TD, TH, THead, TR, Button } from "@/components/ui";
import Link from "next/link";
import { formatCurrencyBRL } from "@/lib/utils";
import { subMonths } from "date-fns";

async function getMonthlyData() {
  const start = subMonths(new Date(), 5);
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

  return Array.from(map.entries())
    .sort(([a], [b]) => (a > b ? 1 : -1))
    .map(([month, values]) => ({
      month,
      revenue: values.revenue,
      expenses: values.expenses,
      cogs: values.cogs,
      profit: values.revenue - values.expenses - values.cogs,
    }));
}

export default async function ReportsPage() {
  const data = await getMonthlyData();
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">Relatórios</h1>
          <p className="text-sm text-slate-500">Resultados mensais, margem e exportação para Power BI.</p>
        </div>
        <Link href="/api/reports/sales/monthly?format=csv" target="_blank">
          <Button variant="outline">Exportar CSV vendas</Button>
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Resumo mensal</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <TR>
                <TH>Mês</TH>
                <TH>Receita</TH>
                <TH>COGS</TH>
                <TH>Despesas</TH>
                <TH>Lucro</TH>
              </TR>
            </THead>
            <TBody>
              {data.map((row) => (
                <TR key={row.month}>
                  <TD>{row.month}</TD>
                  <TD>{formatCurrencyBRL(row.revenue)}</TD>
                  <TD>{formatCurrencyBRL(row.cogs)}</TD>
                  <TD>{formatCurrencyBRL(row.expenses)}</TD>
                  <TD className={row.profit >= 0 ? "text-emerald-600" : "text-red-500"}>
                    {formatCurrencyBRL(row.profit)}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
