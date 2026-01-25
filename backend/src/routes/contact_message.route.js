import { Router } from "express";
import { createContactMessage,
         getAllContactMessages,
         updateContactMessageStatus,
         deleteContactMessage
 } from "../controllers/contact_message.controller.js";

const router = Router();

// ContactMessage management routes
router.route("/create").post(createContactMessage);
router.route("/getAll").get(getAllContactMessages);
router.route("/update/:id").patch(updateContactMessageStatus);
router.route("/delete/:id").delete(deleteContactMessage);

export default router;