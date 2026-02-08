import mongoose from "mongoose";

// Order item sub-schema (snapshot at purchase time)
const orderItemSchema = new mongoose.Schema(
  {
    sticker_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sticker",
      required: true
    },

    price_at_purchase: {
      type: Number,
      required: true,
      min: 0
    },

    is_limited: {
      type: Boolean,
      required: true
    }
  },
  { _id: false }
);

// Order model
const orderSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (value) => value.length > 0,
        message: "Order must contain at least one item"
      }
    },

    total_amount: {
      type: Number,
      required: true,
      min: 0
    },

    payment_status: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED"],
      default: "PENDING"
    },

    payment_method: {
      type: String,
      default: "MOCK"
    }
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at"
    }
  }
);

export const Order = mongoose.model("Order", orderSchema);