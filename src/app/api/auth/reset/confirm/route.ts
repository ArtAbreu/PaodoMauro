import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hash } from "bcryptjs";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const limit = rateLimit(`${request.ip}-reset-confirm`, "login");
  if (!limit.success) {
    return NextResponse.json({ error: "Limite excedido" }, { status: 429 });
  }
  const { token, password } = await request.json().catch(() => ({ token: null, password: null }));
  if (!token || !password || password.length < 8) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }
  const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!resetToken || resetToken.expiresAt < new Date()) {
    return NextResponse.json({ error: "Token inválido ou expirado" }, { status: 400 });
  }
  const passwordHash = await hash(password, 12);
  await prisma.$transaction([
    prisma.user.update({ where: { id: resetToken.userId }, data: { passwordHash, mustResetPwd: false } }),
    prisma.passwordResetToken.delete({ where: { id: resetToken.id } }),
  ]);
  return NextResponse.json({ message: "Senha atualizada com sucesso" });
}
