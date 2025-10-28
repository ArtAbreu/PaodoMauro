import NextAuth, { type DefaultSession } from "next-auth";
import { Role } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      mustResetPwd: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: Role;
    mustResetPwd: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    role?: Role;
    mustResetPwd?: boolean;
  }
}
