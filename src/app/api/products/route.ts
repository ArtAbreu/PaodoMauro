import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-guard";
import { productSchema } from "@/lib/zod-schemas";

export async function GET(request: NextRequest) {
  const authError = await requireAuth(request);
  if (authError) return authError;
  const products = await prisma.product.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(products);
}

export async function POST(request: NextRequest) {
  const authError = await requireAuth(request);
  if (authError) return authError;
  const body = await request.json();
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }
  const data = parsed.data;
  const product = await prisma.product.create({
    data: {
      name: data.name,
      category: data.category,
      unitPrice: data.unitPrice,
      active: data.active,
    },
  });
  await prisma.auditLog.create({
    data: {
      action: "CREATE",
      entity: "Product",
      entityId: product.id,
      payloadJson: { name: product.name, active: product.active },
    },
  });
  return NextResponse.json(product, { status: 201 });
}
