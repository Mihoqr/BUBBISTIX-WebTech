import { Sticker } from "../models/sticker.model.js";
import { Category } from "../models/category.model.js";

/**
 * Create a new sticker (Admin / Backend only)
 */
const createSticker = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category_id,
      preview_images,
      file_path,
      is_limited
    } = req.body;

    // Basic validation
    if (
      !name ||
      !description ||
      price === undefined ||
      !category_id ||
      !preview_images ||
      !file_path
    ) {
      return res.status(400).json({
        message: "All required sticker fields must be provided"
      });
    }

    // Check for existing sticker (business rule)
    const existingSticker = await Sticker.findOne({ name });

    if (existingSticker) {
        return res.status(409).json({
        message: "Sticker already exists."
        });
    }

    // Ensure category exists
    const categoryExists = await Category.findById(category_id);
    if (!categoryExists) {
      return res.status(400).json({
        message: "Invalid category"
      });
    }

    const sticker = await Sticker.create({
      name,
      description,
      price,
      category_id,
      preview_images,
      file_path,
      is_limited: is_limited ?? false
    });

    return res.status(201).json({
      message: "Sticker created successfully",
      sticker
    });

  } catch (error) {
    console.error("Create sticker error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message
      });
    }

    return res.status(500).json({
      message: "Server error"
    });
  }
};

/**
 * Get all stickers (Public)
 * Supports optional category filtering
 */
const getAllStickers = async (req, res) => {
  try {
    const { category_id } = req.query;

    const filter = {};
    if (category_id) {
      filter.category_id = category_id;
    }

    const stickers = await Sticker.find(filter)
      .populate("category_id", "name slug")
      .sort({ created_at: -1 });

    return res.status(200).json({
      stickers
    });

  } catch (error) {
    console.error("Get stickers error:", error);

    return res.status(500).json({
      message: "Server error"
    });
  }
};

/**
 * Get a single sticker by ID (Public – for preview page)
 */
const getStickerById = async (req, res) => {
  try {
    const { id } = req.params;

    const sticker = await Sticker.findById(id)
      .populate("category_id", "name slug");

    if (!sticker) {
      return res.status(404).json({
        message: "Sticker not found"
      });
    }

    return res.status(200).json({
      sticker
    });

  } catch (error) {
    console.error("Get sticker error:", error);

    return res.status(500).json({
      message: "Server error"
    });
  }
};

/**
 * Update a sticker (Admin / Backend only)
 */
const updateSticker = async (req, res) => {
  try {
    const { id } = req.params;

    const sticker = await Sticker.findById(id);

    if (!sticker) {
      return res.status(404).json({
        message: "Sticker not found"
      });
    }

    // Update allowed fields only
    const updatableFields = [
      "name",
      "description",
      "price",
      "category_id",
      "preview_images",
      "file_path"
    ];

    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        sticker[field] = req.body[field];
      }
    });

    // If category changed, validate it
    if (req.body.category_id) {
      const categoryExists = await Category.findById(req.body.category_id);
      if (!categoryExists) {
        return res.status(400).json({
          message: "Invalid category"
        });
      }
    }

    await sticker.save();

    return res.status(200).json({
      message: "Sticker updated successfully",
      sticker
    });

  } catch (error) {
    console.error("Update sticker error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message
      });
    }

    return res.status(500).json({
      message: "Server error"
    });
  }
};

/**
 * Delete a sticker (Admin / Backend only)
 */
const deleteSticker = async (req, res) => {
  try {
    const { id } = req.params;

    const sticker = await Sticker.findById(id);

    if (!sticker) {
      return res.status(404).json({
        message: "Sticker not found"
      });
    }

    await Sticker.findByIdAndDelete(id);

    return res.status(200).json({
      message: "Sticker deleted successfully"
    });

  } catch (error) {
    console.error("Delete sticker error:", error);

    return res.status(500).json({
      message: "Server error"
    });
  }
};

/**
 * Get stickers by category ID (Public)
 */
const getStickersByCategory = async (req, res) => {
  try {
    const { category_id } = req.params;

    if (!category_id) {
      return res.status(400).json({
        message: "Category ID is required"
      });
    }

    // Validate category exists
    const category = await Category.findById(category_id);

    if (!category) {
      return res.status(404).json({
        message: "Category not found"
      });
    }

    // Fetch stickers under this category
    const stickers = await Sticker.find({
      category_id
    })
      .populate("category_id", "name slug")
      .sort({ created_at: -1 });

    return res.status(200).json({
      category: {
        id: category._id,
        name: category.name,
        slug: category.slug
      },
      stickers
    });

  } catch (error) {
    console.error("Get stickers by category ID error:", error);

    return res.status(500).json({
      message: "Server error"
    });
  }
};

export {
  createSticker,
  getAllStickers,
  getStickerById,
  updateSticker,
  deleteSticker,
  getStickersByCategory
};