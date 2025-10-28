import { prisma } from "@/lib/db";
import { OrderForm } from "@/components/orders/order-form";

async function getFormData() {
  const [customers, products] = await Promise.all([
    prisma.customer.findMany({ orderBy: { name: "asc" } }),
    prisma.product.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);
  return { customers, products };
}

export default async function NewOrderPage() {
  const { customers, products } = await getFormData();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Novo pedido</h1>
        <p className="text-sm text-slate-500">Crie um pedido e acompanhe o status até a entrega.</p>
      </div>
      <OrderForm
        customers={customers.map((customer) => ({ id: customer.id, name: customer.name }))}
        products={products.map((product) => ({ id: product.id, name: product.name, unitPrice: Number(product.unitPrice) }))}
      />
    </div>
  );
}
