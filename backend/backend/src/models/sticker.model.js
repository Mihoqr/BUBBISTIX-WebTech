import mongoose from "mongoose";
import { toTitleCase } from "../utils/textFormatter.js";

// Sticker model
const stickerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 100,
      unique: true,
      set: toTitleCase
    },

    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 500
    },

    price: {
      type: Number,
      required: true,
      min: 0
    },

    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true
    },

    preview_images: {
      type: [String],
      required: true,
      validate: {
        validator: function (value) {
          return Array.isArray(value) && value.length > 0;
        },
        message: "At least one preview image is required"
      }
    },

    sticker_zip: {
      type: String,
      required: true
    },

    is_limited: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at"
    }
  }
);

export const Sticker = mongoose.model("Sticker", stickerSchema);