import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { OrderForm } from "@/components/orders/order-form";
import { whatsappLink } from "@/lib/whatsapp";
import Link from "next/link";

async function getOrder(id: string) {
  const order = await prisma.salesOrder.findUnique({
    where: { id },
    include: { items: true, customer: true },
  });
  if (!order) return null;
  const orderData = {
    id: order.id,
    customerId: order.customerId ?? "",
    orderDate: order.orderDate.toISOString().slice(0, 10),
    dueDate: order.dueDate ? order.dueDate.toISOString().slice(0, 10) : undefined,
    status: order.status,
    paymentMethod: order.paymentMethod,
    items: order.items.map((item) => ({
      productId: item.productId,
      qty: Number(item.qty),
      unitPrice: Number(item.unitPrice),
    })),
    totalDiscount: Number(order.totalDiscount),
  };
  return { order, orderData };
}

async function getFormData() {
  const [customers, products] = await Promise.all([
    prisma.customer.findMany({ orderBy: { name: "asc" } }),
    prisma.product.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);
  return { customers, products };
}

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const [record, formData] = await Promise.all([getOrder(params.id), getFormData()]);
  if (!record) {
    notFound();
  }
  const link = record.order.customer
    ? whatsappLink({ ...record.order, items: record.order.items, customer: record.order.customer })
    : null;
  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">Pedido {record.order.id}</h1>
          <p className="text-sm text-slate-500">Atualize informações e acompanhe o pagamento.</p>
        </div>
        {link ? (
          <Link href={link} target="_blank" className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white">
            Enviar WhatsApp
          </Link>
        ) : null}
      </div>
      <OrderForm
        order={{ ...record.orderData, customerId: record.orderData.customerId || formData.customers[0]?.id || '' }}
        customers={formData.customers.map((customer) => ({ id: customer.id, name: customer.name }))}
        products={formData.products.map((product) => ({ id: product.id, name: product.name, unitPrice: Number(product.unitPrice) }))}
      />
    </div>
  );
}
