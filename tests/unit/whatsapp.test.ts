import { describe, it, expect } from "vitest";
import { buildWhatsappMessage } from "@/lib/whatsapp";
import { SalesOrderStatus } from "@prisma/client";

const order = {
  id: "order-1",
  status: SalesOrderStatus.CONFIRMED,
  items: [
    { id: "item-1", orderId: "order-1", productId: "prod-1", qty: 2, unitPrice: 10, total: 20 },
  ],
  totalNet: 20,
  dueDate: new Date("2024-05-01"),
  customer: { id: "c1", name: "Cliente Teste", phone: "551199999999", address: "Rua A", createdAt: new Date() },
} as any;

describe("buildWhatsappMessage", () => {
  it("inclui nome do cliente e total", () => {
    const message = decodeURIComponent(buildWhatsappMessage(order));
    expect(message).toContain("Cliente Teste");
    expect(message).toContain("R$ 20");
  });
});
