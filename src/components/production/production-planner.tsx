"use client";

import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from "@/components/ui";
import { useToast } from "@/components/ui/toast";
import { getCsrfToken } from "@/lib/client-utils";
import { useRouter } from "next/navigation";
import { useState } from "react";

export type ProductionPlannerProps = {
  products: { id: string; name: string }[];
  batches: {
    id: string;
    productName: string;
    plannedUnits: number;
    actualUnits: number | null;
    startedAt: string;
    finishedAt: string | null;
  }[];
};

export function ProductionPlanner({ products, batches }: ProductionPlannerProps) {
  const { push } = useToast();
  const router = useRouter();
  const [plannedUnits, setPlannedUnits] = useState(200);
  const [productId, setProductId] = useState(products[0]?.id ?? "");

  const createBatch = async () => {
    try {
      const res = await fetch("/api/production/batches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-pm-csrf": getCsrfToken(),
        },
        body: JSON.stringify({ productId, plannedUnits, notes: "Planejamento automático" }),
      });
      if (!res.ok) throw new Error("Erro ao criar lote");
      push({ title: "Lote criado", description: "Produção planejada com sucesso." });
      router.refresh();
    } catch (error) {
      push({ title: "Erro", description: (error as Error).message, variant: "destructive" });
    }
  };

  const finalizeBatch = async (id: string) => {
    const actualUnits = Number(prompt("Unidades produzidas"));
    if (Number.isNaN(actualUnits)) return;
    try {
      const res = await fetch(`/api/production/batches/${id}/finish`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-pm-csrf": getCsrfToken(),
        },
        body: JSON.stringify({ actualUnits, finishedAt: new Date().toISOString() }),
      });
      if (!res.ok) throw new Error("Erro ao finalizar lote");
      push({ title: "Lote concluído", description: "Baixa de insumos realizada." });
      router.refresh();
    } catch (error) {
      push({ title: "Erro", description: (error as Error).message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Planejar produção</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Produto</Label>
            <select
              className="h-11 w-full rounded-lg border border-slate-300 px-3"
              value={productId}
              onChange={(event) => setProductId(event.target.value)}
            >
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Unidades planejadas</Label>
            <Input type="number" value={plannedUnits} onChange={(event) => setPlannedUnits(Number(event.target.value))} />
          </div>
          <div className="flex items-end">
            <Button onClick={createBatch}>Agendar</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lotes recentes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {batches.map((batch) => (
            <div key={batch.id} className="flex flex-col gap-2 rounded-lg border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">{batch.productName}</p>
                <p className="text-xs text-slate-500">Planejado: {batch.plannedUnits} • Produzido: {batch.actualUnits ?? "—"}</p>
              </div>
              {batch.finishedAt ? (
                <span className="text-xs uppercase text-emerald-600">Concluído</span>
              ) : (
                <Button variant="outline" onClick={() => finalizeBatch(batch.id)}>
                  Finalizar lote
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
