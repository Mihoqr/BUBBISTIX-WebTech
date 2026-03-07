import { Sticker } from "../models/sticker.model.js";
import { Order } from "../models/order.model.js";
import { OwnershipToken } from "../models/ownership_token.model.js";
import { DownloadLog } from "../models/download_log.model.js";
import s3 from "../config/s3.js";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

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
    let orderId = null;

    // Limited sticker ownership
    if (sticker.is_limited) {
      const token = await OwnershipToken.findOne({
        user_id,
        sticker_id
      });

      ownsSticker = Boolean(token);
    }

    // Regular sticker purchase
    else {
      const order = await Order.findOne({
        user_id,
        payment_status: "PAID",
        "items.sticker_id": sticker_id
      });

      if (order) {
        ownsSticker = true;
        orderId = order._id;
      }
    }

    if (!ownsSticker) {
      return res.status(403).json({
        message: "You do not own this sticker"
      });
    }

    // Generate signed S3 download URL
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: sticker.sticker_zip
    });

    const signedUrl = await getSignedUrl(s3, command, {
      expiresIn: 60
    });

    // Log download (non-blocking)
    DownloadLog.create({
      user_id,
      sticker_id,
      order_id: orderId,
      ip_address: req.ip
    }).catch(() => {});

    return res.json({
      download_url: signedUrl
    });

  } catch (error) {
    console.error("Download sticker error:", error);

    return res.status(500).json({
      message: "Server error"
    });
  }
};

export { downloadSticker };