import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { orderSchema } from "@/lib/zod-schemas";
import { requireAuth } from "@/lib/api-guard";
import { PaymentMethod, SalesOrderStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  const authError = await requireAuth(request);
  if (authError) return authError;
  const status = request.nextUrl.searchParams.get("status") as SalesOrderStatus | null;
  const orders = await prisma.salesOrder.findMany({
    where: { status: status ?? undefined },
    include: { customer: true, items: { include: { product: true } } },
    orderBy: { orderDate: "desc" },
    take: 50,
  });
  return NextResponse.json(orders);
}

export async function POST(request: NextRequest) {
  const authError = await requireAuth(request);
  if (authError) return authError;
  const body = await request.json();
  const parsed = orderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }
  const data = parsed.data;
  const productIds = data.items.map((item) => item.productId);
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
  const productMap = new Map(products.map((p) => [p.id, p]));

  const items = data.items.map((item) => {
    const product = productMap.get(item.productId);
    if (!product) throw new Error("Produto inválido");
    const unitPrice = Number(item.unitPrice || product.unitPrice);
    const total = unitPrice * item.qty;
    return { ...item, unitPrice, total };
  });
  const totalGross = items.reduce((sum, item) => sum + item.total, 0);
  const totalNet = totalGross - data.totalDiscount;

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.salesOrder.create({
      data: {
        customerId: data.customerId,
        orderDate: new Date(data.orderDate),
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        status: data.status as SalesOrderStatus,
        paymentMethod: data.paymentMethod ? (data.paymentMethod as PaymentMethod) : null,
        totalGross,
        totalDiscount: data.totalDiscount,
        totalNet,
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            qty: item.qty,
            unitPrice: item.unitPrice,
            total: item.total,
          })),
        },
      },
      include: { items: true },
    });

    await tx.auditLog.create({
      data: {
        action: "CREATE",
        entity: "SalesOrder",
        entityId: created.id,
        payloadJson: {
          totalNet: Number(created.totalNet),
          status: created.status,
        },
      },
    });

    if (created.status === SalesOrderStatus.PAID) {
      await tx.cashbook.create({
        data: {
          date: created.orderDate,
          type: "IN",
          description: `Recebimento pedido ${created.id}`,
          amount: created.totalNet,
          paymentMethod: created.paymentMethod ?? PaymentMethod.CASH,
          refTable: "SalesOrder",
          refId: created.id,
        },
      });
    }

    return created;
  });

  return NextResponse.json(order, { status: 201 });
}
