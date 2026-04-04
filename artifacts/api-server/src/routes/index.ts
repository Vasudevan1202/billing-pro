import { Router, type IRouter } from "express";
import healthRouter from "./health";
import menuRouter from "./menu";
import ordersRouter from "./orders";
import analyticsRouter from "./analytics";
import upiRouter from "./upi";

const router: IRouter = Router();

router.use(healthRouter);
router.use(menuRouter);
router.use(ordersRouter);
router.use(analyticsRouter);
router.use(upiRouter);

export default router;
