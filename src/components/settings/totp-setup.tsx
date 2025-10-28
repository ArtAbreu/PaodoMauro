"use client";

import { useState } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { useToast } from "@/components/ui/toast";
import { getCsrfToken } from "@/lib/client-utils";

export function TotpSetup() {
  const { push } = useToast();
  const [data, setData] = useState<{ secret: string; backupCodes: string[]; otpauthUrl: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings/totp", {
        method: "POST",
        headers: { "x-pm-csrf": getCsrfToken() },
      });
      if (!res.ok) throw new Error("Falha ao gerar 2FA");
      const json = await res.json();
      setData(json);
      push({ title: "2FA gerado", description: "Escaneie o QR code e guarde os códigos de backup." });
    } catch (error) {
      push({ title: "Erro", description: (error as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ativar 2FA TOTP</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <p>Gere um segredo exclusivo, escaneie no app autenticador e guarde os códigos de backup em local seguro.</p>
        <Button onClick={generate} disabled={loading}>
          {loading ? "Gerando..." : "Gerar 2FA"}
        </Button>
        {data ? (
          <div className="space-y-3 rounded-lg border border-slate-200 p-4">
            <p className="font-semibold">Segredo: {data.secret}</p>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data.otpauthUrl)}`}
              alt="QR code 2FA"
              className="h-40 w-40"
            />
            <div>
              <p className="font-semibold">Códigos de backup</p>
              <ul className="grid gap-2 text-xs font-mono">
                {data.backupCodes.map((code) => (
                  <li key={code}>{code}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
