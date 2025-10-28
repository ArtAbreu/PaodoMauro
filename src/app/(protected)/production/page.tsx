import { prisma } from "@/lib/db";
import { ProductionPlanner } from "@/components/production/production-planner";

async function getData() {
  const [products, batches] = await Promise.all([
    prisma.product.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.productionBatch.findMany({
      include: { product: true },
      orderBy: { startedAt: "desc" },
      take: 10,
    }),
  ]);
  return {
    products: products.map((product) => ({ id: product.id, name: product.name })),
    batches: batches.map((batch) => ({
      id: batch.id,
      productName: batch.product.name,
      plannedUnits: batch.plannedUnits,
      actualUnits: batch.actualUnits,
      startedAt: batch.startedAt.toISOString(),
      finishedAt: batch.finishedAt?.toISOString() ?? null,
    })),
  };
}

export default async function ProductionPage() {
  const data = await getData();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Produção</h1>
        <p className="text-sm text-slate-500">Planeje e controle os lotes diários, mantendo baixa automática de insumos.</p>
      </div>
      <ProductionPlanner {...data} />
    </div>
  );
}
