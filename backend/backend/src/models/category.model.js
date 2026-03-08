import mongoose from "mongoose";
import { toTitleCase } from "../utils/textFormatter.js";

const toSlug = (value) => {
  if (!value) return value;

  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
};

// Category model
const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
      set: toTitleCase
    },

    // No input required, this will be automatically generated based on the category name entered
    slug: {
      type: String,
      unique: true
    }
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at"
    }
  }
);

// Auto-generate slug from name
categorySchema.pre("save", async function () {
  if (this.isModified("name")) {
    this.slug = toSlug(this.name);
  }
});

export const Category = mongoose.model("Category", categorySchema);