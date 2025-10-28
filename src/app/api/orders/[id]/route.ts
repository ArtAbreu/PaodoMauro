import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { orderSchema } from "@/lib/zod-schemas";
import { requireAuth } from "@/lib/api-guard";
import { PaymentMethod, SalesOrderStatus } from "@prisma/client";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const authError = await requireAuth(request);
  if (authError) return authError;
  const order = await prisma.salesOrder.findUnique({
    where: { id: params.id },
    include: { customer: true, items: { include: { product: true } } },
  });
  if (!order) {
    return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
  }
  return NextResponse.json(order);
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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

  const updated = await prisma.$transaction(async (tx) => {
    const order = await tx.salesOrder.update({
      where: { id: params.id },
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
          deleteMany: {},
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
        action: "UPDATE",
        entity: "SalesOrder",
        entityId: order.id,
        payloadJson: {
          status: order.status,
          totalNet: Number(order.totalNet),
        },
      },
    });

    if (order.status === SalesOrderStatus.PAID) {
      await tx.cashbook.upsert({
        where: { refId_refTable: { refId: order.id, refTable: "SalesOrder" } },
        update: {
          amount: order.totalNet,
          paymentMethod: order.paymentMethod ?? PaymentMethod.CASH,
        },
        create: {
          date: order.orderDate,
          type: "IN",
          description: `Recebimento pedido ${order.id}`,
          amount: order.totalNet,
          paymentMethod: order.paymentMethod ?? PaymentMethod.CASH,
          refTable: "SalesOrder",
          refId: order.id,
        },
      });
    }

    return order;
  });

  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const authError = await requireAuth(request, { role: "admin" });
  if (authError) return authError;
  await prisma.$transaction([
    prisma.salesOrder.delete({ where: { id: params.id } }),
    prisma.auditLog.create({
      data: {
        action: "DELETE",
        entity: "SalesOrder",
        entityId: params.id,
        payloadJson: { id: params.id },
      },
    }),
  ]);
  return NextResponse.json({ success: true });
}
