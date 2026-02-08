import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import { createContactMessage,
         getAllContactMessages,
         updateContactMessageStatus,
         deleteContactMessage
 } from "../controllers/contact_message.controller.js";

const router = Router();

// ContactMessage management routes
router.route("/create").post(createContactMessage);
router.get("/getAll", authMiddleware, getAllContactMessages);
router.patch("/update/:id", authMiddleware, updateContactMessageStatus);
router.delete("/delete/:id", authMiddleware, deleteContactMessage);

export default router;