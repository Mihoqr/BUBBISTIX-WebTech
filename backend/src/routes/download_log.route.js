import { Router } from "express";
import { downloadSticker 
} from "../controllers/download_log.controller.js";
import mockAuth from "../middleware/mockAuth.js";

const router = Router();

// Protected download route
// (replace mockAuth with real JWT middleware later)
// router.route("/download").get("/:sticker_id", mockAuth, downloadSticker);
router.get("/:sticker_id", mockAuth, downloadSticker);
export default router;