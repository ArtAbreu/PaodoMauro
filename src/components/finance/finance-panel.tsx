"use client";

import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Table, TBody, TD, TH, THead, TR } from "@/components/ui";
import { useToast } from "@/components/ui/toast";
import { getCsrfToken } from "@/lib/client-utils";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatCurrencyBRL } from "@/lib/utils";

export type FinancePanelProps = {
  cashbook: { id: string; date: string; type: string; amount: number; paymentMethod: string; description: string }[];
};

export function FinancePanel({ cashbook }: FinancePanelProps) {
  const { push } = useToast();
  const router = useRouter();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState("Operacional");
  const [description, setDescription] = useState("Despesa geral");
  const [amount, setAmount] = useState(100);
  const [paymentMethod, setPaymentMethod] = useState("PIX");

  const submitExpense = async () => {
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-pm-csrf": getCsrfToken(),
        },
        body: JSON.stringify({ date, category, description, amount, paymentMethod }),
      });
      if (!res.ok) throw new Error("Erro ao lançar despesa");
      push({ title: "Despesa lançada", description: "O caixa foi atualizado." });
      router.refresh();
    } catch (error) {
      push({ title: "Erro", description: (error as Error).message, variant: "destructive" });
    }
  };

  const totals = cashbook.reduce(
    (acc, entry) => {
      if (entry.type === "IN") acc.in += entry.amount;
      if (entry.type === "OUT") acc.out += entry.amount;
      return acc;
    },
    { in: 0, out: 0 }
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Fluxo de caixa diário</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <TR>
                <TH>Data</TH>
                <TH>Descrição</TH>
                <TH>Tipo</TH>
                <TH>Método</TH>
                <TH>Valor</TH>
              </TR>
            </THead>
            <TBody>
              {cashbook.map((entry) => (
                <TR key={entry.id}>
                  <TD>{entry.date}</TD>
                  <TD>{entry.description}</TD>
                  <TD>{entry.type}</TD>
                  <TD>{entry.paymentMethod}</TD>
                  <TD>{formatCurrencyBRL(entry.amount)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
          <div className="mt-4 flex justify-between text-sm font-semibold">
            <span>Entradas: {formatCurrencyBRL(totals.in)}</span>
            <span>Saídas: {formatCurrencyBRL(totals.out)}</span>
            <span>Saldo: {formatCurrencyBRL(totals.in - totals.out)}</span>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Lançar despesa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label>Data</Label>
            <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Categoria</Label>
            <Input value={category} onChange={(event) => setCategory(event.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Descrição</Label>
            <Input value={description} onChange={(event) => setDescription(event.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Valor</Label>
            <Input type="number" step="0.01" value={amount} onChange={(event) => setAmount(Number(event.target.value))} />
          </div>
          <div className="space-y-1">
            <Label>Método</Label>
            <select className="h-11 w-full rounded-lg border border-slate-300 px-3" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
              <option value="PIX">PIX</option>
              <option value="CASH">Dinheiro</option>
              <option value="CARD">Cartão</option>
              <option value="BOLETO">Boleto</option>
            </select>
          </div>
          <Button className="w-full" onClick={submitExpense}>
            Registrar despesa
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
