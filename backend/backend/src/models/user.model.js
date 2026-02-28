import mongoose from "mongoose";
import crypto from "crypto";

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

// User model
const userSchema = new mongoose.Schema(
  {
    username: {
    type: String,
    required: [true, "Username is required"],
    minlength: [3, "Username must be at least 3 characters"],
    maxlength: [20, "Username must not exceed 20 characters"],
    match: [
      /^[a-z0-9_]+$/,
      "Username can only contain lowercase letters, numbers, and underscores"
    ],
    unique: true,
    trim: true,
    lowercase: true
  },

    full_name: {
    type: String,
    required: [true, "Full name is required"],
    trim: true,
    minlength: [3, "Full name must be at least 3 characters"],
    maxlength: [50, "Full name must not exceed 50 characters"],
    validate: {
      validator: function (value) {
        // Must contain at least two words
        return value.trim().split(/\s+/).length >= 2;
      },
      message: "Please enter both your first and last name"
    },
    set: toTitleCase
  },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 100,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please enter a valid email address"
      ]
    },

    password_hash: {
      type: String,
      required: false
    },

    auth_provider: {
      type: String,
      enum: ["LOCAL", "GOOGLE"],
      default: "LOCAL"
    },

    role: {
      type: String,
      enum: ["USER", "ADMIN"],
      default: "USER"
    },

    password_reset_token: String,

    password_reset_expires: Date,
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at"
    }
  }
);

export const User = mongoose.model("User", userSchema);