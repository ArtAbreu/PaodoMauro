import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { securityHeaders } from "@/lib/security-headers";
import { rateLimit } from "@/lib/rate-limit";

const LOGIN_PATH = "/login";

const PUBLIC_PATHS = [
  LOGIN_PATH,
  "/api/auth/",
  "/api/health",
  "/manifest.webmanifest",
  "/app-icon.svg",
  "/service-worker.js",
  "/service-worker.ts",
  "/favicon.ico",
  "/api/auth/reset",
  "/api/auth/reset/confirm",
];

export async function middleware(request: NextRequest) {
  const nonce = crypto.randomUUID();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-csp-nonce", nonce);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  const headers = securityHeaders(nonce);
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }

  const path = request.nextUrl.pathname;

  if (path.startsWith("/api/")) {
    const type = path.includes("/auth") ? "login" : "api";
    const limit = rateLimit(`${request.ip}-${path}`, type === "login" ? "login" : "api");
    if (!limit.success) {
      return NextResponse.json({ error: "Limite de requisições excedido" }, { status: 429 });
    }
  }

  const isPublic = PUBLIC_PATHS.some((publicPath) => path.startsWith(publicPath));

  if (!isPublic && !path.startsWith("/api")) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      const url = request.nextUrl.clone();
      url.pathname = LOGIN_PATH;
      url.searchParams.set("callbackUrl", request.nextUrl.href);
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!.+\\.[\‌\u200b\w]+$|_next).*)"],
};
