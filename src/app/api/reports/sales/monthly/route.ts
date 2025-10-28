import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-guard";
import { subMonths } from "date-fns";

export async function GET(request: NextRequest) {
  const authError = await requireAuth(request);
  if (authError) return authError;
  const months = Number(request.nextUrl.searchParams.get("months") ?? 6);
  const start = subMonths(new Date(), months - 1);
  const orders = await prisma.salesOrder.groupBy({
    by: ["orderDate"],
    where: { orderDate: { gte: start } },
    _sum: { totalNet: true, totalGross: true, totalDiscount: true },
  });
  const format = request.nextUrl.searchParams.get("format");
  if (format === "csv") {
    const header = "data,total_liquido,total_bruto,desconto";
    const rows = orders
      .map((order) => `${order.orderDate.toISOString().slice(0,10)},${Number(order._sum.totalNet ?? 0)},${Number(order._sum.totalGross ?? 0)},${Number(order._sum.totalDiscount ?? 0)}`)
      .join("\n");
    return new NextResponse([header, rows].join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
      },
    });
  }
  return NextResponse.json(orders);
}
