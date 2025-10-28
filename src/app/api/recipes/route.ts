import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-guard";
import { recipeSchema } from "@/lib/zod-schemas";

export async function GET(request: NextRequest) {
  const authError = await requireAuth(request);
  if (authError) return authError;
  const recipes = await prisma.recipe.findMany({ include: { product: true, items: { include: { ingredient: true } } } });
  return NextResponse.json(recipes);
}

export async function POST(request: NextRequest) {
  const authError = await requireAuth(request, { role: "admin" });
  if (authError) return authError;
  const body = await request.json();
  const parsed = recipeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }
  const data = parsed.data;
  const recipe = await prisma.recipe.upsert({
    where: { productId: data.productId },
    update: {
      yieldUnits: data.yieldUnits,
      notes: data.notes,
      items: {
        deleteMany: {},
        create: data.items,
      },
    },
    create: {
      productId: data.productId,
      yieldUnits: data.yieldUnits,
      notes: data.notes,
      items: {
        create: data.items,
      },
    },
    include: { items: true },
  });
  await prisma.auditLog.create({
    data: {
      action: "UPSERT",
      entity: "Recipe",
      entityId: recipe.id,
      payloadJson: { productId: recipe.productId, yieldUnits: recipe.yieldUnits },
    },
  });
  return NextResponse.json(recipe, { status: 201 });
}
