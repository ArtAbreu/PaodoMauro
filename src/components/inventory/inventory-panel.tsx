"use client";

import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from "@/components/ui";
import { useToast } from "@/components/ui/toast";
import { getCsrfToken } from "@/lib/client-utils";
import { useRouter } from "next/navigation";
import { useState } from "react";

export type InventoryPanelProps = {
  ingredients: {
    id: string;
    name: string;
    unit: string;
    stock: number;
    minStock: number;
    unitCost: number;
  }[];
};

export function InventoryPanel({ ingredients }: InventoryPanelProps) {
  const { push } = useToast();
  const router = useRouter();
  const [ingredientId, setIngredientId] = useState(ingredients[0]?.id ?? "");
  const [type, setType] = useState("IN");
  const [qty, setQty] = useState(1);
  const [unitCost, setUnitCost] = useState(0);
  const [reason, setReason] = useState("Ajuste manual");

  const submit = async () => {
    try {
      const res = await fetch("/api/inventory/movements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-pm-csrf": getCsrfToken(),
        },
        body: JSON.stringify({ ingredientId, type, qty, unitCost: type === "IN" ? unitCost : undefined, reason }),
      });
      if (!res.ok) throw new Error("Erro ao lançar movimento");
      push({ title: "Estoque atualizado", description: "Movimento registrado com sucesso." });
      router.refresh();
    } catch (error) {
      push({ title: "Erro", description: (error as Error).message, variant: "destructive" });
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Ingredientes críticos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {ingredients.map((ingredient) => (
            <div
              key={ingredient.id}
              className="flex flex-col gap-1 rounded-lg border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-semibold">{ingredient.name}</p>
                <p className="text-xs text-slate-500">
                  Estoque: {ingredient.stock.toFixed(2)} {ingredient.unit} • Mínimo: {ingredient.minStock.toFixed(2)}
                </p>
              </div>
              {ingredient.stock <= ingredient.minStock ? (
                <span className="text-xs font-bold uppercase text-red-500">Comprar imediatamente</span>
              ) : (
                <span className="text-xs text-emerald-600">OK</span>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Entrada / Ajuste</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label>Ingrediente</Label>
            <select
              className="h-11 w-full rounded-lg border border-slate-300 px-3"
              value={ingredientId}
              onChange={(event) => setIngredientId(event.target.value)}
            >
              {ingredients.map((ingredient) => (
                <option key={ingredient.id} value={ingredient.id}>
                  {ingredient.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label>Tipo</Label>
            <select className="h-11 w-full rounded-lg border border-slate-300 px-3" value={type} onChange={(event) => setType(event.target.value)}>
              <option value="IN">Entrada</option>
              <option value="OUT">Saída</option>
              <option value="ADJ">Ajuste</option>
            </select>
          </div>
          <div className="space-y-1">
            <Label>Quantidade</Label>
            <Input type="number" value={qty} onChange={(event) => setQty(Number(event.target.value))} />
          </div>
          {type === "IN" ? (
            <div className="space-y-1">
              <Label>Custo unitário</Label>
              <Input type="number" step="0.0001" value={unitCost} onChange={(event) => setUnitCost(Number(event.target.value))} />
            </div>
          ) : null}
          <div className="space-y-1">
            <Label>Motivo</Label>
            <Input value={reason} onChange={(event) => setReason(event.target.value)} />
          </div>
          <Button className="w-full" onClick={submit}>
            Registrar movimento
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
