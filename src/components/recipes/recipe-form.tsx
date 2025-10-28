"use client";

import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from "@/components/ui";
import { useToast } from "@/components/ui/toast";
import { getCsrfToken } from "@/lib/client-utils";
import { useRouter } from "next/navigation";
import { useState } from "react";

export type RecipeFormProps = {
  products: { id: string; name: string }[];
  ingredients: { id: string; name: string; unit: string }[];
};

export function RecipeForm({ products, ingredients }: RecipeFormProps) {
  const { push } = useToast();
  const router = useRouter();
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [yieldUnits, setYieldUnits] = useState(200);
  const [lines, setLines] = useState([{ ingredientId: ingredients[0]?.id ?? "", qtyPerBatch: 1, unit: ingredients[0]?.unit ?? "kg" }]);
  const [notes, setNotes] = useState("Receita padrão");

  const submit = async () => {
    try {
      const res = await fetch("/api/recipes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-pm-csrf": getCsrfToken(),
        },
        body: JSON.stringify({ productId, yieldUnits, notes, items: lines }),
      });
      if (!res.ok) throw new Error("Erro ao salvar receita");
      push({ title: "Receita atualizada", description: "Ingredientes vinculados ao produto." });
      router.refresh();
    } catch (error) {
      push({ title: "Erro", description: (error as Error).message, variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cadastro de receita</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1">
            <Label>Produto</Label>
            <select className="h-11 w-full rounded-lg border border-slate-300 px-3" value={productId} onChange={(event) => setProductId(event.target.value)}>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label>Rendimento (unidades)</Label>
            <Input type="number" value={yieldUnits} onChange={(event) => setYieldUnits(Number(event.target.value))} />
          </div>
          <div className="space-y-1 sm:col-span-1">
            <Label>Observações</Label>
            <Input value={notes} onChange={(event) => setNotes(event.target.value)} />
          </div>
        </div>
        <div className="space-y-3">
          {lines.map((line, index) => (
            <div key={index} className="grid gap-3 rounded-lg border border-slate-200 p-4 sm:grid-cols-3">
              <div>
                <Label>Ingrediente</Label>
                <select
                  className="mt-1 h-11 w-full rounded-lg border border-slate-300 px-3"
                  value={line.ingredientId}
                  onChange={(event) => {
                    const ingredient = ingredients.find((item) => item.id === event.target.value);
                    setLines((current) => {
                      const copy = [...current];
                      copy[index] = {
                        ...copy[index],
                        ingredientId: event.target.value,
                        unit: ingredient?.unit ?? copy[index].unit,
                      };
                      return copy;
                    });
                  }}
                >
                  {ingredients.map((ingredient) => (
                    <option key={ingredient.id} value={ingredient.id}>
                      {ingredient.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Quantidade por batelada</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={line.qtyPerBatch}
                  onChange={(event) =>
                    setLines((current) => {
                      const copy = [...current];
                      copy[index] = { ...copy[index], qtyPerBatch: Number(event.target.value) };
                      return copy;
                    })
                  }
                />
              </div>
              <div>
                <Label>Unidade</Label>
                <Input
                  value={line.unit}
                  onChange={(event) =>
                    setLines((current) => {
                      const copy = [...current];
                      copy[index] = { ...copy[index], unit: event.target.value };
                      return copy;
                    })
                  }
                />
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() => setLines((current) => [...current, { ingredientId: ingredients[0]?.id ?? "", qtyPerBatch: 1, unit: ingredients[0]?.unit ?? "kg" }])}
          >
            Adicionar ingrediente
          </Button>
        </div>
        <Button type="button" onClick={submit}>
          Salvar receita
        </Button>
      </CardContent>
    </Card>
  );
}
