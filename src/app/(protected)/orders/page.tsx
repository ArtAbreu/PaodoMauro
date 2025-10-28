import Link from "next/link";
import { prisma } from "@/lib/db";
import { Button, Card, CardContent, CardHeader, CardTitle, Table, TBody, TD, TH, THead, TR } from "@/components/ui";
import { format } from "date-fns";
import { formatCurrencyBRL } from "@/lib/utils";

async function getOrders() {
  const orders = await prisma.salesOrder.findMany({
    include: { customer: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return orders;
}

export default async function OrdersPage() {
  const orders = await getOrders();
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">Pedidos</h1>
          <p className="text-sm text-slate-500">Pipeline completo do pedido até a entrega.</p>
        </div>
        <Link href="/orders/new">
          <Button>Nova venda</Button>
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Últimos pedidos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <TR>
                <TH>Data</TH>
                <TH>Cliente</TH>
                <TH>Status</TH>
                <TH>Pagamento</TH>
                <TH>Total</TH>
                <TH>Ações</TH>
              </TR>
            </THead>
            <TBody>
              {orders.map((order) => (
                <TR key={order.id}>
                  <TD>{format(order.orderDate, "dd/MM/yyyy")}</TD>
                  <TD>{order.customer?.name ?? "Consumidor final"}</TD>
                  <TD>{order.status}</TD>
                  <TD>{order.paymentMethod ?? "—"}</TD>
                  <TD>{formatCurrencyBRL(Number(order.totalNet))}</TD>
                  <TD>
                    <Link href={`/orders/${order.id}`} className="text-brand underline">
                      Abrir
                    </Link>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
