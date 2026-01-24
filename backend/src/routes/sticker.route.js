import { Router } from "express";
import { createSticker,
         getAllStickers,
         getStickerById,
         updateSticker,
         deleteSticker,
 } from "../controllers/sticker.controller.js";

const router = Router();

// Sticker management routes
router.route("/create").post(createSticker);
router.route("/getAll").get(getAllStickers);
router.route("/getByID/:id").get(getStickerById);
router.route("/update/:id").put(updateSticker);
router.route("/delete/:id").delete(deleteSticker);

export default router;