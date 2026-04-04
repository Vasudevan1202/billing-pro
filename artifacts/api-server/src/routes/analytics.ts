import { Router, type IRouter } from "express";
import { db, ordersTable, orderItemsTable } from "@workspace/db";
import { gte, sql, desc } from "drizzle-orm";
import {
  GetAnalyticsSummaryQueryParams,
  GetTopItemsQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function getPeriodStart(period: string): Date | null {
  const now = new Date();
  switch (period) {
    case "today": {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      return start;
    }
    case "week": {
      const start = new Date(now);
      start.setDate(now.getDate() - 7);
      return start;
    }
    case "month": {
      const start = new Date(now);
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      return start;
    }
    case "all":
    default:
      return null;
  }
}

router.get("/analytics/summary", async (req, res): Promise<void> => {
  const queryParsed = GetAnalyticsSummaryQueryParams.safeParse({
    period: req.query.period || "month",
  });
  const period = queryParsed.success ? (queryParsed.data.period ?? "month") : "month";
  const periodStart = getPeriodStart(period);

  let query = db.select({
    totalRevenue: sql<string>`COALESCE(SUM(${ordersTable.totalAmount}), 0)`,
    totalOrders: sql<number>`COUNT(*)`,
  }).from(ordersTable);

  let orders;
  if (periodStart) {
    orders = await db.select({
      totalRevenue: sql<string>`COALESCE(SUM(${ordersTable.totalAmount}), 0)`,
      totalOrders: sql<number>`COUNT(*)`,
    }).from(ordersTable).where(gte(ordersTable.createdAt, periodStart));
  } else {
    orders = await query;
  }

  const row = orders[0];
  const totalRevenue = parseFloat(String(row?.totalRevenue ?? "0"));
  const totalOrders = Number(row?.totalOrders ?? 0);
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  res.json({
    totalRevenue,
    totalOrders,
    averageOrderValue,
    period,
  });
});

router.get("/analytics/top-items", async (req, res): Promise<void> => {
  const queryParsed = GetTopItemsQueryParams.safeParse({
    limit: req.query.limit ? Number(req.query.limit) : 5,
    period: req.query.period || "month",
  });
  const limit = queryParsed.success ? (queryParsed.data.limit ?? 5) : 5;
  const period = queryParsed.success ? (queryParsed.data.period ?? "month") : "month";
  const periodStart = getPeriodStart(period);

  let baseQuery;
  if (periodStart) {
    baseQuery = db
      .select({
        menuItemId: orderItemsTable.menuItemId,
        menuItemName: orderItemsTable.menuItemName,
        totalQuantity: sql<number>`SUM(${orderItemsTable.quantity})`,
        totalRevenue: sql<string>`SUM(${orderItemsTable.subtotal})`,
      })
      .from(orderItemsTable)
      .innerJoin(ordersTable, sql`${orderItemsTable.orderId} = ${ordersTable.id}`)
      .where(gte(ordersTable.createdAt, periodStart))
      .groupBy(orderItemsTable.menuItemId, orderItemsTable.menuItemName)
      .orderBy(desc(sql`SUM(${orderItemsTable.quantity})`))
      .limit(limit);
  } else {
    baseQuery = db
      .select({
        menuItemId: orderItemsTable.menuItemId,
        menuItemName: orderItemsTable.menuItemName,
        totalQuantity: sql<number>`SUM(${orderItemsTable.quantity})`,
        totalRevenue: sql<string>`SUM(${orderItemsTable.subtotal})`,
      })
      .from(orderItemsTable)
      .groupBy(orderItemsTable.menuItemId, orderItemsTable.menuItemName)
      .orderBy(desc(sql`SUM(${orderItemsTable.quantity})`))
      .limit(limit);
  }

  const rows = await baseQuery;
  res.json(
    rows.map((r) => ({
      menuItemId: r.menuItemId,
      menuItemName: r.menuItemName,
      totalQuantity: Number(r.totalQuantity),
      totalRevenue: parseFloat(String(r.totalRevenue)),
    }))
  );
});

export default router;
