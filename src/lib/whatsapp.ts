import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { SalesOrder, SalesOrderItem, Customer } from "@prisma/client";

export function buildWhatsappMessage(order: SalesOrder & { items: SalesOrderItem[]; customer?: Customer | null }) {
  const lines = [
    `Olá ${order.customer?.name ?? "cliente"}! Aqui é da padaria pao do mauro.`,
    `Seu pedido ${order.id} está com status ${order.status}.`,
    `Itens:`,
  ];
  for (const item of order.items) {
    lines.push(`- ${item.qty}x produto ${item.productId} por R$ ${item.unitPrice}`);
  }
  lines.push(`Total com desconto: R$ ${order.totalNet}`);
  if (order.dueDate) {
    lines.push(`Previsão de entrega: ${format(order.dueDate, "PPP", { locale: ptBR })}`);
  }
  return encodeURIComponent(lines.join("\n"));
}

export function whatsappLink(order: SalesOrder & { items: SalesOrderItem[]; customer?: Customer | null }) {
  const phone = order.customer?.phone ?? "55";
  const message = buildWhatsappMessage(order);
  return `https://wa.me/${phone}?text=${message}`;
}
