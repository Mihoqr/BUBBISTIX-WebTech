import { Router } from "express";
 import authMiddleware from "../middleware/auth.middleware.js";
import { createSticker,
         getAllStickers,
         getStickerById,
         updateSticker,
         deleteSticker,
         getStickersByCategory
 } from "../controllers/sticker.controller.js";

const router = Router();

// Sticker management routes
router.route("/getAll").get(getAllStickers);
router.route("/getByID/:id").get(getStickerById);
router.route("/getByCategory/:category_id").get(getStickersByCategory);
router.post("/create", authMiddleware, createSticker);
router.put("/update/:id", authMiddleware, updateSticker);
router.delete("/delete/:id", authMiddleware, deleteSticker);

export default router;