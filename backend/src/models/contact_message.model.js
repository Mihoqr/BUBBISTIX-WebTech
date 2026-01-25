import mongoose from "mongoose";

// Helper
const toTitleCase = (value) => {
  if (!value) return value;

  return value
    .toLowerCase()
    .split(" ")
    .filter(word => word.length > 0)
    .map(word => word[0].toUpperCase() + word.slice(1))
    .join(" ");
};

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