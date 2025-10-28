import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { auth } from "@/lib/auth";
import { Role } from "@prisma/client";

export async function requireAuth(request: NextRequest, opts?: { role?: Role; rateLimitKey?: string; type?: "api" | "login" }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  if (opts?.role && session.user.role !== opts.role) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }
  const key = opts?.rateLimitKey ?? `${request.ip}-${request.nextUrl.pathname}`;
  const limit = rateLimit(key, opts?.type ?? "api");
  if (!limit.success) {
    return NextResponse.json({ error: "Limite de requisições excedido" }, { status: 429 });
  }
  if (request.method !== "GET") {
    const csrfCookie = request.cookies.get("pm_csrf");
    const csrfHeader = request.headers.get("x-pm-csrf");
    if (!csrfCookie || !csrfHeader || csrfCookie.value !== csrfHeader) {
      return NextResponse.json({ error: "Falha na validação CSRF" }, { status: 419 });
    }
  }
  return null;
}
