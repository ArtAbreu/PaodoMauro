-- Dimensão de datas com calendário brasileiro
CREATE OR REPLACE VIEW dim_date AS
SELECT
  d::date AS date,
  EXTRACT(YEAR FROM d)::int AS year,
  EXTRACT(MONTH FROM d)::int AS month,
  EXTRACT(DAY FROM d)::int AS day,
  TO_CHAR(d, 'TMMonth') AS month_name,
  EXTRACT(DOW FROM d)::int AS weekday,
  TO_CHAR(d, 'TMDay') AS weekday_name,
  CASE WHEN EXTRACT(ISODOW FROM d) IN (6, 7) THEN true ELSE false END AS is_weekend
FROM GENERATE_SERIES('2020-01-01'::date, '2035-12-31'::date, INTERVAL '1 day') AS d;

-- Fato de vendas
CREATE OR REPLACE VIEW v_fct_sales AS
SELECT
  o.id AS order_id,
  o.orderDate AS order_date,
  o.status,
  o.paymentMethod,
  c.name AS customer_name,
  i.id AS item_id,
  p.name AS product_name,
  i.qty,
  i.unitPrice,
  i.total,
  o.totalDiscount,
  (ri.qtyPerBatch::numeric / r.yieldUnits::numeric) * im.unitCost AS cogs_ingredientes,
  (COALESCE(settings.overhead_total, 0) / NULLIF(prod.total_units_period, 0)) AS overhead_unit
FROM "SalesOrder" o
JOIN "SalesOrderItem" i ON i."orderId" = o.id
LEFT JOIN "Customer" c ON c.id = o."customerId"
LEFT JOIN "Product" p ON p.id = i."productId"
LEFT JOIN "Recipe" r ON r."productId" = p.id
LEFT JOIN "RecipeItem" ri ON ri."recipeId" = r.id
LEFT JOIN LATERAL (
  SELECT AVG("InventoryMovement"."unitCost") AS unitCost
  FROM "InventoryMovement"
  WHERE "InventoryMovement"."ingredientId" = ri."ingredientId"
) im ON true
LEFT JOIN LATERAL (
  SELECT SUM("ProductionBatch"."actualUnits") AS total_units_period
  FROM "ProductionBatch"
  WHERE DATE_TRUNC('month', "ProductionBatch"."startedAt") = DATE_TRUNC('month', o."orderDate")
) prod ON true
LEFT JOIN LATERAL (
  SELECT (
    COALESCE(SUM(CASE WHEN key = 'gas' THEN value::numeric END), 0) +
    COALESCE(SUM(CASE WHEN key = 'energy' THEN value::numeric END), 0) +
    COALESCE(SUM(CASE WHEN key = 'water' THEN value::numeric END), 0) +
    COALESCE(SUM(CASE WHEN key = 'packaging' THEN value::numeric END), 0)
  ) AS overhead_total
  FROM jsonb_each_text('{"gas":"150","energy":"200","water":"80","packaging":"120"}'::jsonb)
) settings ON true;

-- Fato de produção
CREATE OR REPLACE VIEW v_fct_production AS
SELECT
  b.id,
  b."startedAt"::date AS production_date,
  p.name AS product_name,
  b."plannedUnits",
  b."actualUnits",
  (b."plannedUnits" - COALESCE(b."actualUnits", 0)) AS losses
FROM "ProductionBatch" b
JOIN "Product" p ON p.id = b."productId";

-- Fato de estoque
CREATE OR REPLACE VIEW v_fct_inventory AS
WITH movements AS (
  SELECT
    m."ingredientId",
    DATE_TRUNC('day', m."createdAt")::date AS movement_date,
    SUM(CASE WHEN m.type = 'IN' THEN m.qty ELSE 0 END) AS qty_in,
    SUM(CASE WHEN m.type = 'OUT' THEN m.qty ELSE 0 END) AS qty_out,
    AVG(m."unitCost") AS avg_cost
  FROM "InventoryMovement" m
  GROUP BY 1, 2
)
SELECT
  ing.name AS ingredient_name,
  movements.movement_date,
  movements.qty_in,
  movements.qty_out,
  movements.avg_cost,
  SUM(movements.qty_in - movements.qty_out)
    OVER (PARTITION BY ing.id ORDER BY movements.movement_date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)
    AS balance
FROM movements
JOIN "Ingredient" ing ON ing.id = movements."ingredientId";

-- Fato de despesas
CREATE OR REPLACE VIEW v_fct_expenses AS
SELECT
  e.id,
  e.date,
  e.category,
  e.amount
FROM "Expense" e;

-- Fato do caixa
CREATE OR REPLACE VIEW v_fct_cashbook AS
SELECT
  c.id,
  c.date,
  c.type,
  c.amount,
  c.paymentMethod
FROM "Cashbook" c;
