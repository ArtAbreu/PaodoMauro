"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LogOut, Menu, Moon, Sun } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import * as React from "react";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/orders", label: "Pedidos" },
  { href: "/production", label: "Produção" },
  { href: "/inventory", label: "Estoque" },
  { href: "/products", label: "Produtos" },
  { href: "/recipes", label: "Receitas" },
  { href: "/finance", label: "Financeiro" },
  { href: "/reports", label: "Relatórios" },
  { href: "/settings", label: "Configurações" },
];

export function NavigationShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { setTheme, resolvedTheme } = useTheme();
  const { data } = useSession();
  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="text-xl font-black uppercase tracking-tight text-brand">
            pao do mauro
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              className="rounded-full border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
              aria-label="Alternar tema"
            >
              {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              onClick={() => setMenuOpen((value) => !value)}
              className="rounded-full border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 sm:hidden"
              aria-label="Abrir menu"
            >
              <Menu className="h-4 w-4" />
            </button>
          </div>
        </div>
        <nav className={cn("mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 pb-4 sm:flex-row sm:items-center sm:justify-between", menuOpen ? "flex" : "hidden sm:flex")}
          aria-label="Navegação principal"
        >
          <div className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-semibold transition",
                  pathname === item.href
                    ? "bg-brand text-white shadow"
                    : "text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800"
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-300">
            <span>{data?.user?.email}</span>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:bg-slate-200 dark:border-slate-700 dark:text-slate-200"
            >
              <LogOut className="h-4 w-4" /> Sair
            </button>
          </div>
        </nav>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6">{children}</main>
    </div>
  );
}
