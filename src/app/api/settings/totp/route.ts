import { NextRequest, NextResponse } from "next/server";
import { authenticator } from "otplib";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-guard";
import { hash } from "bcryptjs";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const authError = await requireAuth(request);
  if (authError) return authError;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sessão inválida" }, { status: 401 });
  }
  const secret = authenticator.generateSecret();
  const backupCodesPlain = Array.from({ length: 5 }).map(() => Math.random().toString(36).slice(-10).toUpperCase());
  const backupCodes = await Promise.all(backupCodesPlain.map((code) => hash(code, 10)));
  const otpauthUrl = authenticator.keyuri(session.user.email ?? session.user.id, "pao do mauro", secret);
  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      totpSecret: secret,
      backupCodes,
    },
  });
  await prisma.auditLog.create({
    data: {
      action: "TOTP_SETUP",
      entity: "User",
      entityId: session.user.id,
      payloadJson: { generatedAt: new Date().toISOString() },
    },
  });
  return NextResponse.json({ secret, backupCodes: backupCodesPlain, otpauthUrl });
}
