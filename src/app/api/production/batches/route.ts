import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-guard";
import { z } from "zod";

const createBatchSchema = z.object({
  productId: z.string().uuid(),
  plannedUnits: z.number().int().positive(),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const authError = await requireAuth(request);
  if (authError) return authError;
  const batches = await prisma.productionBatch.findMany({
    include: { product: true },
    orderBy: { startedAt: "desc" },
    take: 50,
  });
  return NextResponse.json(batches);
}

export async function POST(request: NextRequest) {
  const authError = await requireAuth(request);
  if (authError) return authError;
  const body = await request.json();
  const parsed = createBatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }
  const data = parsed.data;
  const batch = await prisma.productionBatch.create({
    data: {
      productId: data.productId,
      plannedUnits: data.plannedUnits,
      notes: data.notes,
    },
  });
  await prisma.auditLog.create({
    data: {
      action: "CREATE",
      entity: "ProductionBatch",
      entityId: batch.id,
      payloadJson: { plannedUnits: batch.plannedUnits },
    },
  });
  return NextResponse.json(batch, { status: 201 });
}
