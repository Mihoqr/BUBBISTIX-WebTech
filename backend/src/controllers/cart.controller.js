import { Cart } from "../models/cart.model.js";
import { Sticker } from "../models/sticker.model.js";
import { Order } from "../models/order.model.js";

/**
 * Add a sticker to cart
 */
const addToCart = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { sticker_id } = req.body;

    // Validate request payload
    if (!sticker_id) {
      return res.status(400).json({
        message: "Sticker ID is required"
      });
    }

    // Ensure sticker exists
    const sticker = await Sticker.findById(sticker_id);

    if (!sticker) {
      return res.status(404).json({
        message: "Sticker not found"
      });
    }

    // Check if user already owns this sticker
    const alreadyOwned = await Order.findOne({
      user_id,
      payment_status: "PAID",
      "items.sticker_id": sticker_id
    });

    if (alreadyOwned) {
      return res.status(400).json({
        message: "You already own this sticker. Cannot add to cart."
      });
    }

    // Get or create cart for user
    let cart = await Cart.findOne({ user_id });

    if (!cart) {
      cart = await Cart.create({ user_id, items: [] });
    }

    // Prevent duplicate sticker in cart
    const alreadyInCart = cart.items.some(
      item => item.sticker_id.toString() === sticker_id
    );

    if (alreadyInCart) {
      return res.status(400).json({
        message: "Sticker already in cart"
      });
    }

    // Add sticker with snapshot price
    cart.items.push({
      sticker_id,
      price_at_add: sticker.price
    });

    await cart.save();

    return res.status(200).json({
      message: "Sticker added to cart",
      cart
    });

  } catch (error) {
    console.error("Add to cart error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * Get current user's cart
 */
const getCart = async (req, res) => {
  try {
    const user_id = req.user.id;

    // Retrieve cart with sticker details
    let cart = await Cart.findOne({ user_id })
      .populate("items.sticker_id", "name price preview_images");

    // Create cart if none exists
    if (!cart) {
      cart = await Cart.create({ user_id, items: [] });
    }

    return res.status(200).json({ cart });

  } catch (error) {
    console.error("Get cart error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * Remove a sticker from cart
 */
const removeFromCart = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { sticker_id } = req.params;

    // Ensure cart exists
    const cart = await Cart.findOne({ user_id });

    if (!cart) {
      return res.status(404).json({
        message: "Cart not found"
      });
    }

    // Remove matching sticker
    const initialLength = cart.items.length;

    cart.items = cart.items.filter(
      item => item.sticker_id.toString() !== sticker_id
    );

    // Sticker was not in cart
    if (cart.items.length === initialLength) {
      return res.status(404).json({
        message: "Sticker not found in cart"
      });
    }

    await cart.save();

    return res.status(200).json({
      message: "Sticker removed from cart",
      cart
    });

  } catch (error) {
    console.error("Remove from cart error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * Clear cart (used after checkout)
 */
const clearCart = async (req, res) => {
  try {
    const user_id = req.user.id;

    // Ensure cart exists
    const cart = await Cart.findOne({ user_id });

    if (!cart) {
      return res.status(404).json({
        message: "Cart not found"
      });
    }

    // Remove all cart items
    cart.items = [];
    await cart.save();

    return res.status(200).json({
      message: "Cart cleared"
    });

  } catch (error) {
    console.error("Clear cart error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export {
  getCart,
  addToCart,
  removeFromCart,
  clearCart
};