import { prisma } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrencyBRL } from "@/lib/utils";
import { subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { WeeklySalesChart } from "@/components/dashboard/weekly-sales-chart";

async function getDashboardData() {
  const today = new Date();
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

  const [ordersToday, productionToday, movements, cashbook] = await Promise.all([
    prisma.salesOrder.count({
      where: {
        orderDate: { gte: startToday, lt: endToday },
      },
    }),
    prisma.productionBatch.count({
      where: {
        startedAt: { gte: startToday, lt: endToday },
      },
    }),
    prisma.inventoryMovement.findMany({
      select: { ingredientId: true, qty: true, type: true },
    }),
    prisma.cashbook.groupBy({
      by: ["date", "type"],
      where: {
        date: { in: [subDays(startToday, 1), startToday] },
      },
      _sum: { amount: true },
    }),
  ]);

  const ingredients = await prisma.ingredient.findMany({ select: { id: true, name: true, minStock: true } });
  const balanceMap = new Map<string, number>();
  for (const movement of movements) {
    const current = balanceMap.get(movement.ingredientId) ?? 0;
    const signedQty = movement.type === 'IN' ? Number(movement.qty) : movement.type === 'OUT' ? -Number(movement.qty) : Number(movement.qty);
    balanceMap.set(movement.ingredientId, current + signedQty);
  }
  const inventoryAlerts = ingredients
    .map((ingredient) => ({
      ingredient: ingredient.name,
      minStock: Number(ingredient.minStock),
      balance: balanceMap.get(ingredient.id) ?? 0,
    }))
    .filter((item) => item.balance <= item.minStock * 1.2)
    .slice(0, 5);

  const cashByDay = cashbook.reduce<Record<string, { in: number; out: number }>>((acc, row) => {
    const key = row.date.toISOString().slice(0, 10);
    acc[key] = acc[key] ?? { in: 0, out: 0 };
    if (row.type === "IN") acc[key].in += Number(row._sum.amount ?? 0);
    if (row.type === "OUT") acc[key].out += Number(row._sum.amount ?? 0);
    return acc;
  }, {});

  const ordersLast7Days = await prisma.salesOrder.groupBy({
    by: ["orderDate"],
    where: {
      orderDate: {
        gte: subDays(startToday, 6),
        lt: endToday,
      },
    },
    _sum: { totalNet: true },
  });

  const chartData = Array.from({ length: 7 }).map((_, index) => {
    const date = subDays(startToday, 6 - index);
    const key = date.toISOString().slice(0, 10);
    const value = ordersLast7Days.find((order) => order.orderDate.toISOString().startsWith(key));
    return {
      date: new Intl.DateTimeFormat("pt-BR", { weekday: "short" }).format(date),
      total: Number(value?._sum.totalNet ?? 0),
    };
  });

  return {
    ordersToday,
    productionToday,
    inventoryAlerts,
    cashToday: formatCurrencyBRL(cashByDay[startToday.toISOString().slice(0, 10)]?.in ?? 0),
    cashYesterday: formatCurrencyBRL(cashByDay[subDays(startToday, 1).toISOString().slice(0, 10)]?.in ?? 0),
    chartData,
  };
}

export default async function DashboardPage() {
  const data = await getDashboardData();
  return (
    <div className="grid gap-6">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Pedidos do dia</CardDescription>
            <CardTitle className="text-3xl">{data.ordersToday}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Produção de hoje</CardDescription>
            <CardTitle className="text-3xl">{data.productionToday}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Caixa de ontem</CardDescription>
            <CardTitle className="text-3xl">{data.cashYesterday}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Caixa de hoje</CardDescription>
            <CardTitle className="text-3xl">{data.cashToday}</CardTitle>
          </CardHeader>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Vendas últimos 7 dias</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <WeeklySalesChart data={data.chartData} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Estoque crítico</CardTitle>
            <CardDescription>Itens próximos do mínimo</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {data.inventoryAlerts.length === 0 && <li className="text-sm text-slate-500">Tudo em níveis seguros.</li>}
              {data.inventoryAlerts.map((item) => (
                <li key={item.ingredient} className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  {item.ingredient}: {item.balance.toFixed(2)} (mínimo {item.minStock.toFixed(2)})
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
