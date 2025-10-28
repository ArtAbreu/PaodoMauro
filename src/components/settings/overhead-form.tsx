"use client";

import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from "@/components/ui";
import { useToast } from "@/components/ui/toast";
import { getCsrfToken } from "@/lib/client-utils";
import { useState } from "react";

export type OverheadFormProps = {
  defaults: { gas: number; energy: number; water: number; packaging: number };
};

export function OverheadForm({ defaults }: OverheadFormProps) {
  const { push } = useToast();
  const [values, setValues] = useState(defaults);

  const update = async () => {
    try {
      const res = await fetch("/api/settings/overhead", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-pm-csrf": getCsrfToken(),
        },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error("Erro ao atualizar overhead");
      push({ title: "Configurações salvas", description: "Custo fixo atualizado." });
    } catch (error) {
      push({ title: "Erro", description: (error as Error).message, variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Overhead por período</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(values).map(([key, value]) => (
          <div key={key} className="space-y-1">
            <Label className="capitalize">{key}</Label>
            <Input
              type="number"
              step="0.01"
              value={value}
              onChange={(event) => setValues((current) => ({ ...current, [key]: Number(event.target.value) }))}
            />
          </div>
        ))}
        <Button className="sm:col-span-2 lg:col-span-4" onClick={update}>
          Salvar overhead
        </Button>
      </CardContent>
    </Card>
  );
}
