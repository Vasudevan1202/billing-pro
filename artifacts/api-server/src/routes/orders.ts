import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, menuItemsTable, ordersTable, orderItemsTable } from "@workspace/db";
import {
  CreateOrderBody,
  ListOrdersQueryParams,
  GetOrderParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function formatOrder(
  order: typeof ordersTable.$inferSelect,
  items: (typeof orderItemsTable.$inferSelect)[]
) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    totalAmount: parseFloat(order.totalAmount),
    paymentMethod: order.paymentMethod,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    items: items.map((it) => ({
      menuItemId: it.menuItemId,
      menuItemName: it.menuItemName,
      quantity: it.quantity,
      unitPrice: parseFloat(it.unitPrice),
      subtotal: parseFloat(it.subtotal),
    })),
  };
}

router.get("/orders", async (req, res): Promise<void> => {
  const queryParsed = ListOrdersQueryParams.safeParse({
    limit: req.query.limit ? Number(req.query.limit) : 50,
    offset: req.query.offset ? Number(req.query.offset) : 0,
  });
  const limit = queryParsed.success ? (queryParsed.data.limit ?? 50) : 50;
  const offset = queryParsed.success ? (queryParsed.data.offset ?? 0) : 0;

  const orders = await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt)).limit(limit).offset(offset);
  const result = await Promise.all(
    orders.map(async (order) => {
      const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, order.id));
      return formatOrder(order, items);
    })
  );
  res.json(result);
});

router.post("/orders", async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { items, paymentMethod } = parsed.data;

  // Fetch menu items to get prices
  const menuItemIds = items.map((i) => i.menuItemId);
  const menuItems = await db.select().from(menuItemsTable).where(
    menuItemIds.length === 1
      ? eq(menuItemsTable.id, menuItemIds[0])
      : eq(menuItemsTable.id, menuItemIds[0]) // fallback, will handle below
  );

  // Actually fetch all needed items
  const allMenuItems = await db.select().from(menuItemsTable);
  const menuItemMap = new Map(allMenuItems.map((m) => [m.id, m]));

  let totalAmount = 0;
  const orderItemsData: { menuItemId: number; menuItemName: string; quantity: number; unitPrice: number; subtotal: number }[] = [];

  for (const item of items) {
    const menuItem = menuItemMap.get(item.menuItemId);
    if (!menuItem) {
      res.status(400).json({ error: `Menu item ${item.menuItemId} not found` });
      return;
    }
    const unitPrice = parseFloat(menuItem.price);
    const subtotal = unitPrice * item.quantity;
    totalAmount += subtotal;
    orderItemsData.push({
      menuItemId: item.menuItemId,
      menuItemName: menuItem.name,
      quantity: item.quantity,
      unitPrice,
      subtotal,
    });
  }

  // Generate unique order number
  const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000).toString().padStart(3, "0")}`;

  const [order] = await db.insert(ordersTable).values({
    orderNumber,
    totalAmount: String(totalAmount.toFixed(2)),
    paymentMethod,
    status: "completed",
  }).returning();

  const insertedItems = await db.insert(orderItemsTable).values(
    orderItemsData.map((it) => ({
      orderId: order.id,
      menuItemId: it.menuItemId,
      menuItemName: it.menuItemName,
      quantity: it.quantity,
      unitPrice: String(it.unitPrice.toFixed(2)),
      subtotal: String(it.subtotal.toFixed(2)),
    }))
  ).returning();

  res.status(201).json(formatOrder(order, insertedItems));
});

router.get("/orders/:id", async (req, res): Promise<void> => {
  const params = GetOrderParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, params.data.id));
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, order.id));
  res.json(formatOrder(order, items));
});

export default router;
