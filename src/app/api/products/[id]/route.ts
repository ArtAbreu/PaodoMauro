import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-guard";
import { productSchema } from "@/lib/zod-schemas";

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const authError = await requireAuth(request);
  if (authError) return authError;
  const body = await request.json();
  const parsed = productSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }
  const data = parsed.data;
  const product = await prisma.product.update({
    where: { id: params.id },
    data,
  });
  await prisma.auditLog.create({
    data: {
      action: "UPDATE",
      entity: "Product",
      entityId: product.id,
      payloadJson: { name: product.name, active: product.active },
    },
  });
  return NextResponse.json(product);
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const authError = await requireAuth(request, { role: "admin" });
  if (authError) return authError;
  await prisma.product.delete({ where: { id: params.id } });
  await prisma.auditLog.create({
    data: {
      action: "DELETE",
      entity: "Product",
      entityId: params.id,
      payloadJson: { id: params.id },
    },
  });
  return NextResponse.json({ success: true });
}
