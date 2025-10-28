"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productSchema } from "@/lib/zod-schemas";
import { z } from "zod";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from "@/components/ui";
import { useToast } from "@/components/ui/toast";
import { getCsrfToken } from "@/lib/client-utils";
import { useRouter } from "next/navigation";

export function ProductForm() {
  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      category: "Pães",
      unitPrice: 8,
      active: true,
      marginTarget: 0.4,
    },
  });
  const { push } = useToast();
  const router = useRouter();

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-pm-csrf": getCsrfToken(),
        },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error("Erro ao cadastrar produto");
      push({ title: "Produto criado", description: "Produto disponível no catálogo." });
      form.reset();
      router.refresh();
    } catch (error) {
      push({ title: "Erro", description: (error as Error).message, variant: "destructive" });
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Novo produto</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={onSubmit}>
          <div className="space-y-1 sm:col-span-2">
            <Label>Nome</Label>
            <Input {...form.register("name")} />
          </div>
          <div className="space-y-1">
            <Label>Categoria</Label>
            <Input {...form.register("category")} />
          </div>
          <div className="space-y-1">
            <Label>Preço unitário (R$)</Label>
            <Input type="number" step="0.01" {...form.register("unitPrice", { valueAsNumber: true })} />
          </div>
          <div className="space-y-1">
            <Label>Margem desejada</Label>
            <Input type="number" step="0.05" {...form.register("marginTarget", { valueAsNumber: true })} />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="active" {...form.register("active")} />
            <Label htmlFor="active">Ativo no cardápio</Label>
          </div>
          <Button type="submit" className="sm:col-span-2">
            Cadastrar produto
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
