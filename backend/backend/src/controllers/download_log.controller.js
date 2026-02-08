import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

import { Sticker } from "../models/sticker.model.js";
import { Order } from "../models/order.model.js";
import { OwnershipToken } from "../models/ownership_token.model.js";
import { DownloadLog } from "../models/download_log.model.js";

// Needed for ES modules (__dirname equivalent)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Download a purchased sticker
 const downloadSticker = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { sticker_id } = req.params;

    // Find sticker
    const sticker = await Sticker.findById(sticker_id);

    if (!sticker) {
      return res.status(404).json({
        message: "Sticker not found"
      });
    }

    // Ownership validation
    let ownsSticker = false;

    // Limited sticker (OwnershipToken)
    if (sticker.is_limited) {
      const token = await OwnershipToken.findOne({
        user_id,
        sticker_id
      });

      ownsSticker = Boolean(token);
    } 
    // Regular sticker (PAID order)
    else {
      const order = await Order.findOne({
        user_id,
        payment_status: "PAID",
        "items.sticker_id": sticker_id
      });

      ownsSticker = Boolean(order);
    }

    if (!ownsSticker) {
      return res.status(403).json({
        message: "You do not own this sticker"
      });
    }

    // Resolve file path (never exposes raw path)
    const filePath = path.join(
      __dirname,
      "../../",
      sticker.file_path
    );

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        message: "File not found"
      });
    }

    // Extract order ID
    const order = await Order.findOne({
      user_id,
      payment_status: "PAID",
      "items.sticker_id": sticker_id
    });

    // Log download
    DownloadLog.create({
      user_id,
      sticker_id,
      order_id: order._id,
      ip_address: req.ip
    }).catch(() => {});

    // Send file
    return res.download(filePath);

  } catch (error) {
    console.error("Download sticker error:", error);
    return res.status(500).json({
      message: "Server error"
    });
  }
};

export {
  downloadSticker
};