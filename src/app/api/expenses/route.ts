import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { expenseSchema } from "@/lib/zod-schemas";
import { requireAuth } from "@/lib/api-guard";

export async function GET(request: NextRequest) {
  const authError = await requireAuth(request);
  if (authError) return authError;
  const expenses = await prisma.expense.findMany({ orderBy: { date: "desc" }, take: 50 });
  return NextResponse.json(expenses);
}

export async function POST(request: NextRequest) {
  const authError = await requireAuth(request);
  if (authError) return authError;
  const body = await request.json();
  const parsed = expenseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }
  const data = parsed.data;
  const expense = await prisma.$transaction(async (tx) => {
    const created = await tx.expense.create({
      data: {
        date: new Date(data.date),
        category: data.category,
        description: data.description,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
      },
    });
    await tx.cashbook.create({
      data: {
        date: new Date(data.date),
        type: "OUT",
        description: `Despesa ${data.description}`,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        refTable: "Expense",
        refId: created.id,
      },
    });
    await tx.auditLog.create({
      data: {
        action: "CREATE",
        entity: "Expense",
        entityId: created.id,
        payloadJson: { amount: Number(created.amount), category: created.category },
      },
    });
    return created;
  });

  return NextResponse.json(expense, { status: 201 });
}
