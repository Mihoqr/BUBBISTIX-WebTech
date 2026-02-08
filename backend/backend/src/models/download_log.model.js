import mongoose from "mongoose";

// Download Log model
const downloadLogSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    sticker_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sticker",
      required: true
    },

    order_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true
    },

    ip_address: {
      type: String,
      required: false,
      trim: true
    }
  },
  {
    timestamps: {
      createdAt: "downloaded_at",
      updatedAt: false
    }
  }
);

export const DownloadLog = mongoose.model("DownloadLog", downloadLogSchema);