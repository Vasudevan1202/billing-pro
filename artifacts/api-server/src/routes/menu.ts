import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, menuItemsTable } from "@workspace/db";
import {
  CreateMenuItemBody,
  UpdateMenuItemBody,
  GetMenuItemParams,
  UpdateMenuItemParams,
  DeleteMenuItemParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/menu", async (_req, res): Promise<void> => {
  const items = await db.select().from(menuItemsTable).orderBy(menuItemsTable.id);
  const mapped = items.map((item) => ({
    id: item.id,
    name: item.name,
    price: parseFloat(item.price),
    category: item.category,
    imageUrl: item.imageUrl,
    available: item.available,
    createdAt: item.createdAt.toISOString(),
  }));
  res.json(mapped);
});

router.post("/menu", async (req, res): Promise<void> => {
  const parsed = CreateMenuItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { name, price, category, imageUrl, available } = parsed.data;
  const [item] = await db
    .insert(menuItemsTable)
    .values({ name, price: String(price), category, imageUrl, available: available ?? true })
    .returning();
  res.status(201).json({
    id: item.id,
    name: item.name,
    price: parseFloat(item.price),
    category: item.category,
    imageUrl: item.imageUrl,
    available: item.available,
    createdAt: item.createdAt.toISOString(),
  });
});

router.get("/menu/:id", async (req, res): Promise<void> => {
  const params = GetMenuItemParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [item] = await db.select().from(menuItemsTable).where(eq(menuItemsTable.id, params.data.id));
  if (!item) {
    res.status(404).json({ error: "Menu item not found" });
    return;
  }
  res.json({
    id: item.id,
    name: item.name,
    price: parseFloat(item.price),
    category: item.category,
    imageUrl: item.imageUrl,
    available: item.available,
    createdAt: item.createdAt.toISOString(),
  });
});

router.put("/menu/:id", async (req, res): Promise<void> => {
  const params = UpdateMenuItemParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateMenuItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { name, price, category, imageUrl, available } = parsed.data;
  const [item] = await db
    .update(menuItemsTable)
    .set({ name, price: price !== undefined ? String(price) : undefined, category, imageUrl, available })
    .where(eq(menuItemsTable.id, params.data.id))
    .returning();
  if (!item) {
    res.status(404).json({ error: "Menu item not found" });
    return;
  }
  res.json({
    id: item.id,
    name: item.name,
    price: parseFloat(item.price),
    category: item.category,
    imageUrl: item.imageUrl,
    available: item.available,
    createdAt: item.createdAt.toISOString(),
  });
});

router.delete("/menu/:id", async (req, res): Promise<void> => {
  const params = DeleteMenuItemParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [item] = await db.delete(menuItemsTable).where(eq(menuItemsTable.id, params.data.id)).returning();
  if (!item) {
    res.status(404).json({ error: "Menu item not found" });
    return;
  }
  res.json({ success: true });
});

export default router;
