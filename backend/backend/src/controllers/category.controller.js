import { Category } from "../models/category.model.js";
import { Sticker } from "../models/sticker.model.js";

/**
 * Create a new category (Admin / Backend only)
 */
const createCategory = async (req, res) => {
  try {
    const { name } = req.body;

    // Basic validation
    if (!name) {
      return res.status(400).json({
        message: "Category name is required"
      });
    }

    // Check if category already exists (by name)
    const existingCategory = await Category.findOne({ name });

    if (existingCategory) {
      return res.status(409).json({
        message: "Category already exists"
      });
    }

    // Create category
    const category = await Category.create({ name });

    return res.status(201).json({
      message: "Category created successfully",
      category
    });

  } catch (error) {
    console.error("Create category error:", error);

    // Mongoose validation errors
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message
      });
    }

    // Duplicate key error (slug or name)
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Category already exists"
      });
    }

    return res.status(500).json({
      message: "Server error"
    });
  }
};

/**
 * Get all categories (Public)
 */
const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });

    return res.status(200).json({
      categories
    });

  } catch (error) {
    console.error("Get categories error:", error);

    return res.status(500).json({
      message: "Server error"
    });
  }
};

/**
 * Update category name (Admin / Backend only)
 */
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        message: "Category name is required"
      });
    }

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        message: "Category not found"
      });
    }

    category.name = name;
    await category.save(); // slug auto-updates

    return res.status(200).json({
      message: "Category updated successfully",
      category
    });

  } catch (error) {
    console.error("Update category error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        message: "Category already exists"
      });
    }

    return res.status(500).json({
      message: "Server error"
    });
  }
};

/**
 * Delete category (Admin / Backend only)
 */
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        message: "Category not found"
      });
    }

    // Check if any stickers are using this category
    const stickerCount = await Sticker.countDocuments({
      category_id: id
    });

    if (stickerCount > 0) {
      return res.status(400).json({
        message: "Cannot delete category with existing stickers"
      });
    }

    await Category.findByIdAndDelete(id);

    return res.status(200).json({
      message: "Category deleted successfully"
    });

  } catch (error) {
    console.error("Delete category error:", error);

    return res.status(500).json({
      message: "Server error"
    });
  }
};

export {
  createCategory,
  getAllCategories,
  updateCategory,
  deleteCategory
};