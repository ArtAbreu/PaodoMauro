import { PrismaClient, Role, SalesOrderStatus, PaymentMethod, InventoryMovementType, CashbookType } from "@prisma/client";
import bcrypt from "bcryptjs";
import { addDays, subDays } from "date-fns";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

async function main() {
  console.info("🌾 Iniciando seed do banco pao-do-mauro");
  const password = `Admin-${Math.random().toString(36).slice(-8)}`;
  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@paodomauro.com" },
    update: {},
    create: {
      name: "Administrador",
      email: "admin@paodomauro.com",
      passwordHash,
      role: Role.admin,
      mustResetPwd: true,
    },
  });

  console.info(`Usuário admin seed: admin@paodomauro.com / ${password}`);

  const customers = await prisma.$transaction(
    [
      prisma.customer.create({
        data: { name: "Padaria Bom Trigo", phone: "551199999999", address: "Rua das Flores, 123" },
      }),
      prisma.customer.create({
        data: { name: "Café do Centro", phone: "551188888888", address: "Av. Paulista, 500" },
      }),
    ]
  );

  const products = await prisma.$transaction(
    [
      prisma.product.create({
        data: { name: "Pão Tradicional", category: "Pães", unitPrice: 8.5 },
      }),
      prisma.product.create({
        data: { name: "Pão Integral", category: "Pães", unitPrice: 9.5 },
      }),
      prisma.product.create({
        data: { name: "Pão de Queijo", category: "Salgados", unitPrice: 12.0 },
      }),
    ]
  );

  const ingredients = await prisma.$transaction(
    [
      prisma.ingredient.create({
        data: { name: "Farinha de Trigo", unit: "kg", unitCost: 6.2, minStock: 20 },
      }),
      prisma.ingredient.create({
        data: { name: "Fermento", unit: "kg", unitCost: 18.4, minStock: 5 },
      }),
      prisma.ingredient.create({
        data: { name: "Queijo Minas", unit: "kg", unitCost: 35.0, minStock: 8 },
      }),
      prisma.ingredient.create({
        data: { name: "Ovos", unit: "dz", unitCost: 12.5, minStock: 10 },
      }),
    ]
  );

  const [trigo, fermento, queijo, ovos] = ingredients;

  await prisma.recipe.create({
    data: {
      productId: products[0].id,
      yieldUnits: 200,
      notes: "Receita padrão diária",
      items: {
        create: [
          { ingredientId: trigo.id, qtyPerBatch: 25, unit: "kg" },
          { ingredientId: fermento.id, qtyPerBatch: 2, unit: "kg" },
        ],
      },
    },
  });

  await prisma.recipe.create({
    data: {
      productId: products[1].id,
      yieldUnits: 200,
      notes: "Pão integral",
      items: {
        create: [
          { ingredientId: trigo.id, qtyPerBatch: 22, unit: "kg" },
          { ingredientId: fermento.id, qtyPerBatch: 2.2, unit: "kg" },
        ],
      },
    },
  });

  await prisma.recipe.create({
    data: {
      productId: products[2].id,
      yieldUnits: 150,
      notes: "Receita pão de queijo",
      items: {
        create: [
          { ingredientId: queijo.id, qtyPerBatch: 12, unit: "kg" },
          { ingredientId: ovos.id, qtyPerBatch: 8, unit: "dz" },
        ],
      },
    },
  });

  
  await prisma.setting.upsert({
    where: { key: 'gas' },
    update: { value: 150 },
    create: { key: 'gas', value: 150 },
  });
  await prisma.setting.upsert({
    where: { key: 'energy' },
    update: { value: 200 },
    create: { key: 'energy', value: 200 },
  });
  await prisma.setting.upsert({
    where: { key: 'water' },
    update: { value: 80 },
    create: { key: 'water', value: 80 },
  });
  await prisma.setting.upsert({
    where: { key: 'packaging' },
    update: { value: 120 },
    create: { key: 'packaging', value: 120 },
  });

  // Movimentos iniciais de estoque
  await prisma.$transaction(
    ingredients.map((ingredient) =>
      prisma.inventoryMovement.create({
        data: {
          ingredientId: ingredient.id,
          type: InventoryMovementType.IN,
          qty: ingredient.minStock * 2,
          unitCost: ingredient.unitCost,
          reason: "Estoque inicial",
        },
      })
    )
  );

  // Produção nos últimos 5 dias
  const today = new Date();
  for (let days = 5; days >= 1; days--) {
    const date = subDays(today, days);
    for (const product of products) {
      await prisma.productionBatch.create({
        data: {
          productId: product.id,
          plannedUnits: 200,
          actualUnits: 190 + Math.floor(Math.random() * 20),
          startedAt: date,
          finishedAt: addDays(date, 0.1),
          notes: "Lote histórico seed",
        },
      });
    }
  }

  // Pedidos de exemplo
  for (const customer of customers) {
    const orderDate = subDays(today, Math.floor(Math.random() * 7));
    const order = await prisma.salesOrder.create({
      data: {
        customerId: customer.id,
        orderDate,
        dueDate: addDays(orderDate, 2),
        status: SalesOrderStatus.PAID,
        paymentMethod: PaymentMethod.PIX,
        totalGross: 500,
        totalDiscount: 25,
        totalNet: 475,
        items: {
          create: products.map((product) => ({
            productId: product.id,
            qty: 10,
            unitPrice: product.unitPrice,
            total: product.unitPrice * 10,
          })),
        },
      },
      include: { items: true },
    });

    await prisma.cashbook.create({
      data: {
        date: orderDate,
        type: CashbookType.IN,
        description: `Recebimento pedido ${order.id}`,
        amount: order.totalNet,
        paymentMethod: PaymentMethod.PIX,
        refTable: "SalesOrder",
        refId: order.id,
      },
    });
  }

  await prisma.expense.createMany({
    data: [
      {
        date: subDays(today, 3),
        category: "Insumos",
        description: "Compra de farinha",
        amount: 320.5,
        paymentMethod: PaymentMethod.BOLETO,
      },
      {
        date: subDays(today, 1),
        category: "Energia",
        description: "Conta de luz",
        amount: 540.9,
        paymentMethod: PaymentMethod.CASH,
      },
    ],
  });

  await prisma.cashbook.create({
    data: {
      date: today,
      type: CashbookType.OUT,
      description: "Pagamento despesa energia",
      amount: 540.9,
      paymentMethod: PaymentMethod.CASH,
      refTable: "Expense",
      refId: randomUUID(),
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
