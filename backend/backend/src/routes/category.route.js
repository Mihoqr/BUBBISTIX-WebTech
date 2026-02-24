import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import authorizeRoles from "../middleware/authorizeRoles.middleware.js";
import { createCategory,
         getAllCategories,
         updateCategory,
         deleteCategory,
 } from "../controllers/category.controller.js";

const router = Router();

// Category management routes
router.route("/getAll").get(getAllCategories);
router.post("/create", authMiddleware, authorizeRoles("ADMIN"), createCategory);
router.put("/update/:id", authMiddleware, authorizeRoles("ADMIN"), updateCategory);
router.delete("/delete/:id", authMiddleware, authorizeRoles("ADMIN"), deleteCategory);

export default router;