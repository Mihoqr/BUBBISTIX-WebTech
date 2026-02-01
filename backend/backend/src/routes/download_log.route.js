import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import { downloadSticker 
} from "../controllers/download_log.controller.js";

const router = Router();

// Protected download route
router.get("/:sticker_id", authMiddleware, downloadSticker);

export default router;