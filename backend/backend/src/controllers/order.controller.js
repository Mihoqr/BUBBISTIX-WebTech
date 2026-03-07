import { Order } from "../models/order.model.js";
import { Cart } from "../models/cart.model.js";
import { Sticker } from "../models/sticker.model.js";
import { OwnershipToken } from "../models/ownership_token.model.js";
import { v4 as uuidv4 } from "uuid";
import { formatStickerImages, formatOrderStickerImages } from "../utils/formatStickerImages.js";

/**
 * Create an order from the user's cart (Checkout)
 */
const createOrder = async (req, res) => {
  try {
    const user_id = req.user.id;

    // Get user's cart
    const cart = await Cart.findOne({ user_id });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        message: "Cart is empty"
      });
    }

    const orderItems = [];
    let total_amount = 0;

    // Build order items from cart
    for (const item of cart.items) {
      const sticker = await Sticker.findById(item.sticker_id);

      if (!sticker) {
        return res.status(404).json({
          message: "Sticker not found during checkout"
        });
      }

      // If sticker is already purchased by the user, block the checkout
      const alreadyPurchased = await Order.findOne({
        user_id,
        payment_status: "PAID", 
            "items.sticker_id": sticker._id
        });

      if (alreadyPurchased) {
      return res.status(400).json({
          message: "You already own this sticker"
      });
      }

      // If sticker is limited, ensure it is not already owned
      if (sticker.is_limited) {
        const alreadyOwned = await OwnershipToken.findOne({
          sticker_id: sticker._id
        });

        if (alreadyOwned) {
          return res.status(400).json({
            message: `Limited sticker '${sticker.name}' is already sold.`
          });
        }
      }

      orderItems.push({
        sticker_id: sticker._id,
        price_at_purchase: item.price_at_add,
        is_limited: sticker.is_limited
      });

      total_amount += item.price_at_add;
    }

    // Create order (payment mocked)
    const order = await Order.create({
      user_id,
      items: orderItems,
      total_amount,
      payment_status: "PAID",
      payment_method: "MOCK"
    });

    // Create ownership tokens for limited stickers
    for (const item of orderItems) {
      if (item.is_limited) {
        await OwnershipToken.create({
          token: uuidv4(),
          user_id,
          sticker_id: item.sticker_id
        });
      }
    }

    // Clear cart after successful checkout
    cart.items = [];
    await cart.save();

    return res.status(201).json({
      message: "Order placed successfully",
      order
    });

  } catch (error) {
    console.error("Create order error:", error);
    return res.status(500).json({
      message: "Server error"
    });
  }
};

/**
 * Get all orders of the logged-in user
 */
const getMyOrders = async (req, res) => {
  try {
    const user_id = req.user.id;

    // Retrieve all orders of the user
    const orders = await Order.find({ user_id })
      .populate("items.sticker_id", "name preview_images")
      .sort({ created_at: -1 });

    // Format preview images for stickers in each order
    const formattedOrders = orders.map(formatOrderStickerImages);

    return res.status(200).json({ orders: formattedOrders });

  } catch (error) {
    console.error("Get orders error:", error);
    return res.status(500).json({
      message: "Server error"
    });
  }
};

/**
 * Get single order by ID (must belong to user)
 */
const getOrderById = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { id } = req.params;

    const order = await Order.findOne({ _id: id, user_id })
      .populate("items.sticker_id", "name preview_images");

    if (!order) {
      return res.status(404).json({
        message: "Order not found"
      });
    }

    return res.status(200).json({ order });

  } catch (error) {
    console.error("Get order error:", error);
    return res.status(500).json({
      message: "Server error"
    });
  }
};

/**
 * Get all stickers purchased by the logged-in user
 */
const getMyPurchasedStickers = async (req, res) => {
  try {
    const user_id = req.user.id;

    // Get all paid orders for the user
    const orders = await Order.find({
      user_id,
      payment_status: "PAID"
    }).populate("items.sticker_id", "name preview_images is_limited");

    // Flatten and deduplicate stickers
    const stickerMap = new Map();

    for (const order of orders) {
      for (const item of order.items) {
        const sticker = item.sticker_id;

        if (sticker && !stickerMap.has(sticker._id.toString())) {

          // Format preview image URLs
          const formattedSticker = formatStickerImages(sticker);

          stickerMap.set(sticker._id.toString(), {
            _id: formattedSticker._id,
            name: formattedSticker.name,
            preview_images: formattedSticker.preview_images,
            is_limited: item.is_limited,
            purchased_at: order.created_at
          });
        }
      }
    }

    // Convert map to array
    const stickers = Array.from(stickerMap.values());

    return res.status(200).json({ stickers });

  } catch (error) {
    console.error("Get purchased stickers error:", error);
    return res.status(500).json({
      message: "Server error"
    });
  }
};

export {
  createOrder,
  getMyOrders,
  getOrderById,
  getMyPurchasedStickers
};