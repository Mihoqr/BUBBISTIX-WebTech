import mongoose from "mongoose";

// Cart item sub-schema
const cartItemSchema = new mongoose.Schema(
  {
    sticker_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sticker",
      required: true
    },

    price_at_add: {
      type: Number,
      required: true,
      min: 0
    },

    added_at: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

// Cart model
const cartSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true // one cart per user
    },

    items: {
      type: [cartItemSchema],
      default: []
    }
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at"
    }
  }
);

export const Cart = mongoose.model("Cart", cartSchema);