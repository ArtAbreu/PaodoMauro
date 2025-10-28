import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/db";
import { Role } from "@prisma/client";
import { authenticator } from "otplib";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";

const loginAttempts = new Map<string, { attempts: number; lockedUntil: number }>();

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 60 * 60, // 1h access token rotation
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.role = user.role;
        token.mustResetPwd = user.mustResetPwd;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.userId as string;
        session.user.role = token.role as Role;
        session.user.mustResetPwd = Boolean(token.mustResetPwd);
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      if (!user) return;
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "LOGIN",
          entity: "User",
          entityId: user.id,
          payloadJson: { timestamp: new Date().toISOString() },
        },
      });
    },
  },
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "E-mail e senha",
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
        totp: { label: "Código 2FA", type: "text" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Credenciais inválidas");
        }
        const key = credentials.email.toLowerCase();
        const attempt = loginAttempts.get(key);
        const now = Date.now();
        if (attempt && attempt.lockedUntil > now) {
          throw new Error(`Conta bloqueada por tentativas inválidas. Tente novamente em ${Math.ceil((attempt.lockedUntil - now) / 1000)}s`);
        }
        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });
        if (!user) {
          throw new Error("Usuário não encontrado");
        }

        const valid = await compare(credentials.password, user.passwordHash);
        if (!valid) {
          const attempts = loginAttempts.get(key) ?? { attempts: 0, lockedUntil: 0 };
          const newAttempts = attempts.attempts + 1;
          const lockSeconds = Math.min(newAttempts * 10, 300);
          loginAttempts.set(key, { attempts: newAttempts, lockedUntil: Date.now() + lockSeconds * 1000 });
          throw new Error("Senha incorreta");
        }

        loginAttempts.delete(key);

        if (user.totpSecret) {
          if (!credentials.totp) {
            throw new Error("Informe o código 2FA");
          }
          const isValidTotp = authenticator.check(credentials.totp, user.totpSecret);
          let backupUsed = false;
          if (!isValidTotp) {
            for (const code of user.backupCodes ?? []) {
              const validBackup = await compare(credentials.totp, code);
              if (validBackup) {
                backupUsed = true;
                break;
              }
            }
            if (!backupUsed) {
              const attempts = loginAttempts.get(key) ?? { attempts: 0, lockedUntil: 0 };
              const newAttempts = attempts.attempts + 1;
              const lockSeconds = Math.min(newAttempts * 10, 300);
              loginAttempts.set(key, { attempts: newAttempts, lockedUntil: Date.now() + lockSeconds * 1000 });
              throw new Error("Código 2FA inválido");
            }
          }
          if (backupUsed) {
            const remaining: string[] = [];
            for (const code of user.backupCodes ?? []) {
              const match = await compare(credentials.totp!, code);
              if (!match) {
                remaining.push(code);
              }
            }
            await prisma.user.update({
              where: { id: user.id },
              data: { backupCodes: remaining },
            });
          }
        }

        // rotate anti-CSRF token for sensitive actions
        const nonce = randomBytes(32).toString("hex");
        cookies().set("pm_csrf", nonce, {
          httpOnly: true,
          secure: true,
          sameSite: "strict",
          path: "/",
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          mustResetPwd: user.mustResetPwd,
        } as any;
      },
    }),
  ],
  cookies: {
    sessionToken: {
      name: `pm_session-token`,
      options: {
        httpOnly: true,
        sameSite: "strict",
        path: "/",
        secure: true,
      },
    },
  },
};

export const { handlers: { GET, POST }, auth } = NextAuth(authOptions);
