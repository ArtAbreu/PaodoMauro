import { prisma } from "@/lib/db";
import { ProductForm } from "@/components/products/product-form";
import { Card, CardContent, CardHeader, CardTitle, Table, TBody, TD, TH, THead, TR } from "@/components/ui";
import { calculateCOGSPerUnit } from "@/lib/cost";
import { formatCurrencyBRL } from "@/lib/utils";

async function getProducts() {
  const products = await prisma.product.findMany({ orderBy: { name: "asc" } });
  const costs = await Promise.all(products.map((product) => calculateCOGSPerUnit(product.id)));
  return products.map((product, index) => ({
    ...product,
    cost: costs[index],
  }));
}

export default async function ProductsPage() {
  const products = await getProducts();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Produtos</h1>
        <p className="text-sm text-slate-500">Catálogo com sugestão de precificação pela margem desejada.</p>
      </div>
      <ProductForm />
      <Card>
        <CardHeader>
          <CardTitle>Lista de produtos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <TR>
                <TH>Produto</TH>
                <TH>Categoria</TH>
                <TH>Preço atual</TH>
                <TH>COGS estimado</TH>
                <TH>Sugerido (40%)</TH>
                <TH>Status</TH>
              </TR>
            </THead>
            <TBody>
              {products.map((product) => (
                <TR key={product.id}>
                  <TD>{product.name}</TD>
                  <TD>{product.category}</TD>
                  <TD>{formatCurrencyBRL(Number(product.unitPrice))}</TD>
                  <TD>{formatCurrencyBRL(product.cost.total)}</TD>
                  <TD>{formatCurrencyBRL(product.cost.total * 1.4)}</TD>
                  <TD>{product.active ? "Ativo" : "Inativo"}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
