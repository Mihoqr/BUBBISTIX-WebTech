import { Router } from "express";
import { createCategory,
         getAllCategories,
         updateCategory,
         deleteCategory,
 } from "../controllers/category.controller.js";

const router = Router();

// Category management routes
router.route("/create").post(createCategory);
router.route("/getAll").get(getAllCategories);
router.route("/update/:id").put(updateCategory);
router.route("/delete/:id").delete(deleteCategory);

export default router;