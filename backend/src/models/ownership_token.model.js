import mongoose from "mongoose";

// Ownership Token model (for limited edition stickers)
const ownershipTokenSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true
    },

    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    sticker_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sticker",
      required: true,
      unique: true // Ensures only one owner per limited sticker
    }
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: false
    }
  }
);

export const OwnershipToken = mongoose.model("OwnershipToken", ownershipTokenSchema);