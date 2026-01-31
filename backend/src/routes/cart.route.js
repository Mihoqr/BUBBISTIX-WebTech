import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import { addToCart,
         getCart,
         removeFromCart,
         clearCart
} from "../controllers/cart.controller.js";

const router = Router();

router.use(authMiddleware);

// Cart management routes
router.route("/addToCart").post(addToCart);
router.route("/getCart").get(getCart);
router.route("/removeFromCart/:sticker_id").delete(removeFromCart);
router.route("/clearCart").delete(clearCart);

export default router;