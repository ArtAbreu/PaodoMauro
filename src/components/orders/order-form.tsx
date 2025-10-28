"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { orderSchema } from "@/lib/zod-schemas";
import { z } from "zod";
import { Button, Input, Label, DatePicker, Card, CardContent } from "@/components/ui";
import { useToast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";
import { getCsrfToken } from "@/lib/client-utils";
import { useState } from "react";

export type OrderFormProps = {
  customers: { id: string; name: string }[];
  products: { id: string; name: string; unitPrice: number }[];
  order?: z.infer<typeof orderSchema> & { id: string };
};

export function OrderForm({ customers, products, order }: OrderFormProps) {
  const { push } = useToast();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<z.infer<typeof orderSchema>>({
    resolver: zodResolver(orderSchema),
    defaultValues: order ?? {
      customerId: customers[0]?.id ?? "",
      orderDate: new Date().toISOString().slice(0, 10),
      dueDate: undefined,
      status: "OPEN",
      paymentMethod: null,
      items: [
        {
          productId: products[0]?.id ?? "",
          qty: 1,
          unitPrice: products[0]?.unitPrice ?? 0,
        },
      ],
      totalDiscount: 0,
    },
  });

  const { fields, append, remove } = useFieldArray({ name: "items", control: form.control });

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      const res = await fetch(order ? `/api/orders/${order.id}` : "/api/orders", {
        method: order ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          "x-pm-csrf": getCsrfToken(),
        },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ? JSON.stringify(data.error) : "Erro ao salvar");
      }
      push({ title: "Pedido salvo", description: "Os dados foram atualizados." });
      router.push("/orders");
    } catch (error) {
      push({ title: "Erro", description: (error as Error).message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <form className="space-y-6" onSubmit={onSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="customerId">Cliente</Label>
          <select id="customerId" className="h-11 w-full rounded-lg border border-slate-300 px-3" {...form.register("customerId")}>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="orderDate">Data do pedido</Label>
          <DatePicker value={form.watch("orderDate")} onChange={(value) => form.setValue("orderDate", value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dueDate">Previsão de entrega</Label>
          <DatePicker value={form.watch("dueDate") ?? ""} onChange={(value) => form.setValue("dueDate", value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <select id="status" className="h-11 w-full rounded-lg border border-slate-300 px-3" {...form.register("status")}>
            {[
              "OPEN",
              "CONFIRMED",
              "IN_PRODUCTION",
              "READY",
              "DELIVERED",
              "PAID",
              "CANCELLED",
            ].map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          {fields.map((field, index) => (
            <div key={field.id} className="grid gap-3 rounded-lg border border-slate-200 p-4 sm:grid-cols-5">
              <div className="sm:col-span-2">
                <Label>Produto</Label>
                <select
                  className="mt-1 h-11 w-full rounded-lg border border-slate-300 px-3"
                  {...form.register(`items.${index}.productId` as const)}
                  onChange={(event) => {
                    const product = products.find((p) => p.id === event.target.value);
                    form.setValue(`items.${index}.productId`, event.target.value);
                    if (product) {
                      form.setValue(`items.${index}.unitPrice`, product.unitPrice);
                    }
                  }}
                >
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Quantidade</Label>
                <Input type="number" step="0.1" {...form.register(`items.${index}.qty` as const, { valueAsNumber: true })} />
              </div>
              <div>
                <Label>Preço unitário</Label>
                <Input type="number" step="0.01" {...form.register(`items.${index}.unitPrice` as const, { valueAsNumber: true })} />
              </div>
              <div className="flex items-end justify-end">
                <Button type="button" variant="ghost" onClick={() => remove(index)}>
                  Remover
                </Button>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              append({ productId: products[0]?.id ?? "", qty: 1, unitPrice: products[0]?.unitPrice ?? 0 })
            }
          >
            Adicionar item
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label>Desconto total (R$)</Label>
          <Input type="number" step="0.01" {...form.register("totalDiscount", { valueAsNumber: true })} />
        </div>
        <div>
          <Label>Método de pagamento</Label>
          <select
            className="h-11 w-full rounded-lg border border-slate-300 px-3"
            {...form.register("paymentMethod")}
          >
            <option value="">Selecionar</option>
            <option value="PIX">PIX</option>
            <option value="CASH">Dinheiro</option>
            <option value="CARD">Cartão</option>
          </select>
        </div>
      </div>

      <Button type="submit" className="w-full sm:w-auto" disabled={submitting}>
        {submitting ? "Salvando..." : "Salvar pedido"}
      </Button>
    </form>
  );
}
