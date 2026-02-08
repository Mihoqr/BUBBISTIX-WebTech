import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import { createCategory,
         getAllCategories,
         updateCategory,
         deleteCategory,
 } from "../controllers/category.controller.js";

const router = Router();

// Category management routes
router.route("/getAll").get(getAllCategories);
router.post("/create", authMiddleware, createCategory);
router.put("/update/:id", authMiddleware, updateCategory);
router.delete("/delete/:id", authMiddleware, deleteCategory);

export default router;