import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { inventoryMovementSchema } from "@/lib/zod-schemas";
import { requireAuth } from "@/lib/api-guard";

export async function GET(request: NextRequest) {
  const authError = await requireAuth(request);
  if (authError) return authError;
  const movements = await prisma.inventoryMovement.findMany({
    include: { ingredient: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json(movements);
}

export async function POST(request: NextRequest) {
  const authError = await requireAuth(request);
  if (authError) return authError;
  const body = await request.json();
  const parsed = inventoryMovementSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }
  const data = parsed.data;

  const movement = await prisma.$transaction(async (tx) => {
    const created = await tx.inventoryMovement.create({
      data: {
        ingredientId: data.ingredientId,
        type: data.type,
        qty: data.qty,
        unitCost: data.unitCost,
        reason: data.reason,
      },
    });

    if (data.type === "IN" && data.unitCost) {
      const totals = await tx.inventoryMovement.findMany({
        where: { ingredientId: data.ingredientId },
        select: { type: true, qty: true, unitCost: true },
      });
      let stock = 0;
      let weightedCost = 0;
      for (const move of totals) {
        const qty = Number(move.qty);
        if (move.type === "IN") {
          stock += qty;
          if (move.unitCost) weightedCost += qty * Number(move.unitCost);
        } else if (move.type === "OUT") {
          stock -= qty;
        }
      }
      const newAverage = stock > 0 ? weightedCost / stock : data.unitCost;
      await tx.ingredient.update({
        where: { id: data.ingredientId },
        data: { unitCost: newAverage },
      });
    }

    await tx.auditLog.create({
      data: {
        action: "INVENTORY",
        entity: "InventoryMovement",
        entityId: created.id,
        payloadJson: {
          ingredientId: created.ingredientId,
          type: created.type,
          qty: Number(created.qty),
        },
      },
    });

    return created;
  });

  return NextResponse.json(movement, { status: 201 });
}
