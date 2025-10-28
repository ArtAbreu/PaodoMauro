import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-guard";
import { settingsOverheadSchema } from "@/lib/zod-schemas";

export async function GET(request: NextRequest) {
  const authError = await requireAuth(request);
  if (authError) return authError;
  const entries = await prisma.setting.findMany();
  const map = Object.fromEntries(entries.map((entry) => [entry.key, Number(entry.value ?? 0)]));
  return NextResponse.json(map);
}

export async function POST(request: NextRequest) {
  const authError = await requireAuth(request, { role: "admin" });
  if (authError) return authError;
  const body = await request.json();
  const parsed = settingsOverheadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }
  const data = parsed.data;
  await prisma.$transaction(
    Object.entries(data).map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      })
    )
  );
  return NextResponse.json({ success: true });
}
