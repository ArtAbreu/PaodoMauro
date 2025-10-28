import { prisma } from "@/lib/db";
import { InventoryPanel } from "@/components/inventory/inventory-panel";

async function getInventory() {
  const ingredients = await prisma.ingredient.findMany({ orderBy: { name: "asc" } });
  const movements = await prisma.inventoryMovement.findMany({
    select: { ingredientId: true, type: true, qty: true },
  });
  const stockMap = new Map<string, number>();
  for (const movement of movements) {
    const current = stockMap.get(movement.ingredientId) ?? 0;
    const qty = Number(movement.qty);
    const signed = movement.type === "IN" ? qty : movement.type === "OUT" ? -qty : qty;
    stockMap.set(movement.ingredientId, current + signed);
  }
  return ingredients.map((ingredient) => ({
    id: ingredient.id,
    name: ingredient.name,
    unit: ingredient.unit,
    stock: stockMap.get(ingredient.id) ?? 0,
    minStock: Number(ingredient.minStock),
    unitCost: Number(ingredient.unitCost),
  }));
}

export default async function InventoryPage() {
  const ingredients = await getInventory();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Estoque</h1>
        <p className="text-sm text-slate-500">Monitore níveis mínimos e registre entradas de insumos.</p>
      </div>
      <InventoryPanel ingredients={ingredients} />
    </div>
  );
}
