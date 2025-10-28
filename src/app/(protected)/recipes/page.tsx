import { prisma } from "@/lib/db";
import { RecipeForm } from "@/components/recipes/recipe-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";

async function getRecipes() {
  const recipes = await prisma.recipe.findMany({ include: { product: true, items: { include: { ingredient: true } } } });
  return recipes;
}

async function getOptions() {
  const [products, ingredients] = await Promise.all([
    prisma.product.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.ingredient.findMany({ orderBy: { name: "asc" } }),
  ]);
  return {
    products: products.map((product) => ({ id: product.id, name: product.name })),
    ingredients: ingredients.map((ingredient) => ({ id: ingredient.id, name: ingredient.name, unit: ingredient.unit })),
  };
}

export default async function RecipesPage() {
  const [recipes, options] = await Promise.all([getRecipes(), getOptions()]);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Receitas</h1>
        <p className="text-sm text-slate-500">Cadastre a lista de ingredientes para cada produto.</p>
      </div>
      <RecipeForm {...options} />
      <div className="grid gap-4">
        {recipes.map((recipe) => (
          <Card key={recipe.id}>
            <CardHeader>
              <CardTitle>{recipe.product.name} — rendimento {recipe.yieldUnits} un</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {recipe.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <span>{item.ingredient.name}</span>
                  <span>
                    {Number(item.qtyPerBatch)} {item.unit}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
