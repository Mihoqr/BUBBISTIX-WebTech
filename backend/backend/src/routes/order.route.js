import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import { createOrder,
         getMyOrders,
         getOrderById,
         getMyPurchasedStickers
 } from "../controllers/order.controller.js";

const router = Router();

router.use(authMiddleware);

// Order management routes
router.route("/create").post(createOrder);
router.route("/getMyOrders").get(getMyOrders);
router.route("/getbyID/:id").get(getOrderById);
router.route("/getMyPurchasedStickers").get(getMyPurchasedStickers);

export default router;