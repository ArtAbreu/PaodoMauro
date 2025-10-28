import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Informe um e-mail válido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  totp: z.string().optional(),
});

export const orderSchema = z.object({
  customerId: z.string().uuid(),
  orderDate: z.string(),
  dueDate: z.string().optional(),
  status: z.string(),
  paymentMethod: z.string().nullable(),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        qty: z.number().min(0.1),
        unitPrice: z.number().min(0),
      })
    )
    .min(1),
  totalDiscount: z.number().min(0).default(0),
});

export const productionFinishSchema = z.object({
  actualUnits: z.number().int().min(0),
  finishedAt: z.string(),
});

export const inventoryMovementSchema = z.object({
  ingredientId: z.string().uuid(),
  type: z.enum(["IN", "OUT", "ADJ"]),
  qty: z.number().positive(),
  unitCost: z.number().nonnegative().optional(),
  reason: z.string().min(3),
});

export const expenseSchema = z.object({
  date: z.string(),
  category: z.string().min(2),
  description: z.string().min(2),
  amount: z.number().positive(),
  paymentMethod: z.enum(["PIX", "CASH", "CARD", "BOLETO"]),
});

export const cashbookCloseSchema = z.object({
  date: z.string(),
});

export const settingsOverheadSchema = z.object({
  gas: z.number().nonnegative(),
  energy: z.number().nonnegative(),
  water: z.number().nonnegative(),
  packaging: z.number().nonnegative(),
});

export const productSchema = z.object({
  name: z.string().min(2),
  category: z.string().min(2),
  unitPrice: z.number().positive(),
  active: z.boolean().default(true),
  marginTarget: z.number().min(0).max(1).optional(),
});

export const recipeSchema = z.object({
  productId: z.string().uuid(),
  yieldUnits: z.number().int().positive(),
  notes: z.string().optional(),
  items: z.array(
    z.object({
      ingredientId: z.string().uuid(),
      qtyPerBatch: z.number().positive(),
      unit: z.string().min(1),
    })
  ).min(1),
});
