"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@/lib/zod-schemas";
import { z } from "zod";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from "@/components/ui";
import { useToast } from "@/components/ui/toast";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const { push } = useToast();
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = handleSubmit(async (values) => {
    setLoading(true);
    const result = await signIn("credentials", {
      redirect: false,
      email: values.email,
      password: values.password,
      totp: values.totp,
      callbackUrl,
    });
    setLoading(false);
    if (result?.error) {
      push({ title: "Falha no login", description: result.error, variant: "destructive" });
      return;
    }
    router.push(callbackUrl);
  });

  const requestReset = async () => {
    const email = window.prompt("Informe seu e-mail para resetar a senha");
    if (!email) return;
    const res = await fetch("/api/auth/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (res.ok) {
      const data = await res.json();
      push({
        title: "Reset de senha",
        description: data.message,
      });
    } else {
      push({
        title: "Erro",
        description: "Não foi possível iniciar o reset de senha",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-amber-50 via-white to-orange-100 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-black text-brand">pao do mauro</CardTitle>
          <CardDescription>Faça login para acessar a gestão integrada.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" autoComplete="email" {...register("email")} />
              {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" autoComplete="current-password" {...register("password")} />
              {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="totp">2FA (opcional)</Label>
              <Input id="totp" placeholder="000000" {...register("totp")} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
          <div className="mt-6 space-y-1 text-center text-sm text-slate-500">
            <button onClick={requestReset} className="font-semibold text-brand underline">
              Esqueci minha senha
            </button>
            <p className="text-xs text-slate-400">
              Segurança reforçada: senhas com 8+ caracteres, 2FA opcional e bloqueio progressivo após falhas.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
