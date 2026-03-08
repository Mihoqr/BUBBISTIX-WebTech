import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import authorizeRoles from "../middleware/authorizeRoles.middleware.js";
import upload from "../middleware/s3Upload.middleware.js";
import { createSticker,
         getAllStickers,
         getStickerById,
         updateSticker,
         deleteSticker,
         getStickersByCategory,
         createMultipleStickers
 } from "../controllers/sticker.controller.js";

const router = Router();

// Sticker management routes
router.route("/getAll").get(getAllStickers);
router.route("/getByID/:id").get(getStickerById);
router.route("/getByCategory/:category_id").get(getStickersByCategory);
router.post("/create", authMiddleware, authorizeRoles("ADMIN"), upload.fields([
    { name: "preview_images", maxCount: 5 },
    { name: "sticker_zip", maxCount: 1 }
  ]), createSticker
);
router.put("/update/:id", authMiddleware, authorizeRoles("ADMIN"), upload.fields([
    { name: "preview_images", maxCount: 5 },
    { name: "sticker_zip", maxCount: 1 }
  ]), updateSticker
);
router.delete("/delete/:id", authMiddleware, authorizeRoles("ADMIN"), deleteSticker);
router.post("/createMultipleStickers", authMiddleware, authorizeRoles("ADMIN"), createMultipleStickers);

export default router;