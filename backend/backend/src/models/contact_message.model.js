import mongoose from "mongoose";
import { toTitleCase } from "../utils/textFormatter.js";

// Contact Message model
const contactMessageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
      set: toTitleCase
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please enter a valid email address"
      ]
    },

    message: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 1000
    },

    status: {
      type: String,
      enum: ["NEW", "READ", "RESOLVED"],
      default: "NEW"
    }
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at"
    }
  }
);

export const ContactMessage = mongoose.model("ContactMessage", contactMessageSchema);