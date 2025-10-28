import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "@/lib/db";

export async function calculateCOGSPerUnit(productId: string) {
  const recipe = await prisma.recipe.findUnique({
    where: { productId },
    include: { items: { include: { ingredient: true } } },
  });
  if (!recipe) return { ingredients: 0, overhead: 0, total: 0 };

  const ingredientsCost = recipe.items.reduce((acc, item) => {
    const qty = Number(item.qtyPerBatch);
    const cost = Number(item.ingredient.unitCost);
    return acc + (qty * cost) / recipe.yieldUnits;
  }, 0);

  const overheadConfig = await prisma.setting.findMany().catch(() => []);
  const overheadTotal = overheadConfig.length > 0 ? overheadConfig.reduce((acc, s) => acc + Number(s.value ?? 0), 0) : calculateOverheadFromEnv();

  const productionUnits = await prisma.productionBatch.aggregate({
    where: { productId },
    _sum: { actualUnits: true },
  });

  const totalUnits = productionUnits._sum.actualUnits ?? 1;
  const overheadUnit = overheadTotal / totalUnits;

  return {
    ingredients: ingredientsCost,
    overhead: overheadUnit,
    total: ingredientsCost + overheadUnit,
  };
}

export function calculateOverheadFromEnv() {
  const gas = Number(process.env.OVERHEAD_GAS ?? 0);
  const energy = Number(process.env.OVERHEAD_ENERGY ?? 0);
  const water = Number(process.env.OVERHEAD_WATER ?? 0);
  const packaging = Number(process.env.OVERHEAD_PACKAGING ?? 0);
  return gas + energy + water + packaging;
}
