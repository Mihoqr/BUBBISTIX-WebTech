import { Router } from "express";
import mockAuth from "../middleware/mockAuth.js";

import { addToCart,
         getCart,
         removeFromCart,
         clearCart
} from "../controllers/cart.controller.js";

const router = Router();

// Temporary: create mock user for now
router.use(mockAuth);

// Cart management routes
router.route("/addToCart").post(addToCart);
router.route("/getCart").get(getCart);
router.route("/removeFromCart/:sticker_id").delete(removeFromCart);
router.route("/clearCart").delete(clearCart);

export default router;