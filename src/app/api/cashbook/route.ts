import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-guard";

export async function GET(request: NextRequest) {
  const authError = await requireAuth(request);
  if (authError) return authError;
  const date = request.nextUrl.searchParams.get("date");
  const where = date ? { date: new Date(date) } : undefined;
  const entries = await prisma.cashbook.findMany({ where, orderBy: { date: "desc" }, take: 100 });
  return NextResponse.json(entries);
}
