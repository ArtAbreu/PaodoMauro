import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { randomBytes } from "crypto";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const limit = rateLimit(`${request.ip}-reset`, "login");
  if (!limit.success) {
    return NextResponse.json({ error: "Limite de tentativas excedido" }, { status: 429 });
  }
  const { email } = await request.json().catch(() => ({ email: null }));
  if (!email) {
    return NextResponse.json({ error: "E-mail é obrigatório" }, { status: 400 });
  }
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) {
    return NextResponse.json({ message: "Se o e-mail existir, enviaremos instruções." });
  }
  const token = randomBytes(32).toString("hex");
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 1000 * 60 * 30),
    },
  });
  console.info(`Token reset ${email}: ${token}. Use POST /api/auth/reset/confirm para definir nova senha.`);
  return NextResponse.json({ message: "Token de reset gerado. Verifique o console para instruções no ambiente de desenvolvimento." });
}
