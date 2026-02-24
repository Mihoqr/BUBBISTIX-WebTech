import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import authorizeRoles from "../middleware/authorizeRoles.middleware.js";
import { createContactMessage,
         getAllContactMessages,
         updateContactMessageStatus,
         deleteContactMessage
 } from "../controllers/contact_message.controller.js";

const router = Router();

// ContactMessage management routes
router.route("/create").post(createContactMessage);
router.get("/getAll", authMiddleware, authorizeRoles("ADMIN"), getAllContactMessages);
router.patch("/update/:id", authMiddleware, authorizeRoles("ADMIN"), updateContactMessageStatus);
router.delete("/delete/:id", authMiddleware, authorizeRoles("ADMIN"), deleteContactMessage);

export default router;