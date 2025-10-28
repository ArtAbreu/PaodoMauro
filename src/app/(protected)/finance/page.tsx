import { prisma } from "@/lib/db";
import { FinancePanel } from "@/components/finance/finance-panel";

async function getCashbook() {
  const entries = await prisma.cashbook.findMany({ orderBy: { date: "desc" }, take: 30 });
  return entries.map((entry) => ({
    id: entry.id,
    date: entry.date.toISOString().slice(0, 10),
    type: entry.type,
    amount: Number(entry.amount),
    paymentMethod: entry.paymentMethod,
    description: entry.description,
  }));
}

export default async function FinancePage() {
  const cashbook = await getCashbook();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Financeiro</h1>
        <p className="text-sm text-slate-500">Controle de caixa diário e lançamento de despesas.</p>
      </div>
      <FinancePanel cashbook={cashbook} />
    </div>
  );
}
