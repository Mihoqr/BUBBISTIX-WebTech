import { Router } from "express";
import mockAuth from "../middleware/mockAuth.js";
import { createOrder,
         getMyOrders,
         getOrderById,
         getMyPurchasedStickers
 } from "../controllers/order.controller.js";

const router = Router();

// Temporary: create mock user for now
router.use(mockAuth);

// Order management routes
router.route("/create").post(createOrder);
router.route("/getMyOrders").get(getMyOrders);
router.route("/getbyID/:id").get(getOrderById);
router.route("/getMyPurchasedStickers").get(getMyPurchasedStickers);

export default router;