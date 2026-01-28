import { Router } from "express";
import { createSticker,
         getAllStickers,
         getStickerById,
         updateSticker,
         deleteSticker,
         getStickersByCategory
 } from "../controllers/sticker.controller.js";

const router = Router();

// Sticker management routes
router.route("/create").post(createSticker);
router.route("/getAll").get(getAllStickers);
router.route("/getByID/:id").get(getStickerById);
router.route("/update/:id").put(updateSticker);
router.route("/delete/:id").delete(deleteSticker);
router.route("/getByCategory/:category_id").get(getStickersByCategory);

export default router;