import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { productionFinishSchema } from "@/lib/zod-schemas";
import { requireAuth } from "@/lib/api-guard";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const authError = await requireAuth(request);
  if (authError) return authError;
  const body = await request.json();
  const parsed = productionFinishSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }
  const data = parsed.data;

  const result = await prisma.$transaction(async (tx) => {
    const batch = await tx.productionBatch.update({
      where: { id: params.id },
      data: {
        actualUnits: data.actualUnits,
        finishedAt: new Date(data.finishedAt),
      },
      include: {
        product: { include: { recipe: { include: { items: { include: { ingredient: true } } } } } },
      },
    });

    if (!batch.product?.recipe) {
      return batch;
    }

    const ratio = batch.actualUnits && batch.product.recipe.yieldUnits
      ? batch.actualUnits / batch.product.recipe.yieldUnits
      : 0;

    for (const item of batch.product.recipe.items) {
      const qtyUsed = Number(item.qtyPerBatch) * ratio;
      if (qtyUsed <= 0) continue;
      const lastIn = await tx.inventoryMovement.findFirst({
        where: { ingredientId: item.ingredientId, type: "IN" },
        orderBy: { createdAt: "desc" },
      });
      await tx.inventoryMovement.create({
        data: {
          ingredientId: item.ingredientId,
          type: "OUT",
          qty: qtyUsed,
          unitCost: lastIn?.unitCost ?? item.ingredient.unitCost,
          reason: `Baixa produção ${batch.id}`,
        },
      });
    }

    await tx.auditLog.create({
      data: {
        action: "FINISH",
        entity: "ProductionBatch",
        entityId: batch.id,
        payloadJson: { actualUnits: batch.actualUnits, finishedAt: batch.finishedAt },
      },
    });

    return batch;
  });

  return NextResponse.json(result);
}
