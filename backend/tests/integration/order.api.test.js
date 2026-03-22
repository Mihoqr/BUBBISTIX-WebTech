import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import app from "../../backend/src/app.js";
import { Sticker } from "../../backend/src/models/sticker.model.js";
import { Category } from "../../backend/src/models/category.model.js";
import { Cart } from "../../backend/src/models/cart.model.js";
import { Order } from "../../backend/src/models/order.model.js";
import { createTestUser, authHeader } from "../setup/testHelpers.js";

//  Integration Tests — Order / Checkout API
//
//  Routes tested:
//    POST /api/v1/orders/create                  (auth)
//    GET  /api/v1/orders/getMyOrders             (auth)
//    GET  /api/v1/orders/getbyID/:id             (auth)
//    GET  /api/v1/orders/getMyPurchasedStickers  (auth)

const BASE = "/api/v1/orders";
const CART_BASE = "/api/v1/carts";

let category;

// Create a shared category once before each test
beforeEach(async () => {
  category = await Category.create({ name: "Order Test Category" });
});

// Helper: create a sticker directly in DB (bypasses S3 file upload)
async function makeSticker(name = "Order Test Sticker", price = 100, is_limited = false) {
  return Sticker.create({
    name,
    description: "A sticker used for order integration testing purposes.",
    price,
    category_id: category._id,
    preview_images: ["test-preview.jpg"],
    sticker_zip: "test-pack.zip",
    is_limited
  });
}

// Helper: add a sticker to a user's cart via the API
async function addToCart(token, sticker_id) {
  return request(app)
    .post(`${CART_BASE}/addToCart`)
    .set(authHeader(token))
    .send({ sticker_id: sticker_id.toString() });
}

//  CREATE ORDER (checkout)
describe("POST /create", () => {

  it("creates an order from the user's cart and returns 201", async () => {
    const { token } = await createTestUser();
    const sticker = await makeSticker();
    await addToCart(token, sticker._id);

    const res = await request(app)
      .post(`${BASE}/create`)
      .set(authHeader(token));

    expect(res.status).toBe(201);
    expect(res.body.message).toMatch(/placed successfully/i);
    expect(res.body.order.payment_status).toBe("PAID");
    expect(res.body.order.items).toHaveLength(1);
  });

  it("calculates the correct total_amount from cart item prices", async () => {
    const { token } = await createTestUser();
    const sticker1 = await makeSticker("Sticker A", 99);
    const sticker2 = await makeSticker("Sticker B", 149);
    await addToCart(token, sticker1._id);
    await addToCart(token, sticker2._id);

    const res = await request(app)
      .post(`${BASE}/create`)
      .set(authHeader(token));

    expect(res.status).toBe(201);
    expect(res.body.order.total_amount).toBe(248); // 99 + 149
  });

  it("clears the cart after a successful checkout", async () => {
    const { token } = await createTestUser();
    const sticker = await makeSticker("Cart Clear Sticker");
    await addToCart(token, sticker._id);

    await request(app).post(`${BASE}/create`).set(authHeader(token));

    const cartRes = await request(app)
      .get(`${CART_BASE}/getCart`)
      .set(authHeader(token));

    expect(cartRes.body.cart.items).toHaveLength(0);
  });

  it("returns 400 when cart is empty", async () => {
    const { token } = await createTestUser();

    const res = await request(app)
      .post(`${BASE}/create`)
      .set(authHeader(token));

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/cart is empty/i);
  });

  it("returns 400 when user tries to purchase a sticker they already own", async () => {
    const { token, user } = await createTestUser();
    const sticker = await makeSticker("Already Owned Sticker");

    // First purchase
    await addToCart(token, sticker._id);
    await request(app).post(`${BASE}/create`).set(authHeader(token));

    // Simulate re-adding to cart directly in DB (since API prevents it)
    await Cart.findOneAndUpdate(
      { user_id: user._id },
      { $push: { items: { sticker_id: sticker._id, price_at_add: sticker.price } } }
    );

    // Second purchase attempt
    const res = await request(app)
      .post(`${BASE}/create`)
      .set(authHeader(token));

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already own/i);
  });

  it("returns 401 when no auth token is provided", async () => {
    const res = await request(app).post(`${BASE}/create`);
    expect(res.status).toBe(401);
  });

  it("sets payment_status to PAID and payment_method to MOCK", async () => {
    const { token } = await createTestUser();
    const sticker = await makeSticker("Payment Status Sticker");
    await addToCart(token, sticker._id);

    const res = await request(app)
      .post(`${BASE}/create`)
      .set(authHeader(token));

    expect(res.body.order.payment_status).toBe("PAID");
    expect(res.body.order.payment_method).toBe("MOCK");
  });
});

//  GET MY ORDERS
describe("GET /getMyOrders", () => {

  it("returns all orders for the authenticated user", async () => {
    const { token } = await createTestUser();
    const sticker = await makeSticker("My Orders Sticker");
    await addToCart(token, sticker._id);
    await request(app).post(`${BASE}/create`).set(authHeader(token));

    const res = await request(app)
      .get(`${BASE}/getMyOrders`)
      .set(authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body.orders).toHaveLength(1);
    expect(res.body.orders[0].payment_status).toBe("PAID");
  });

  it("returns an empty array when the user has no orders", async () => {
    const { token } = await createTestUser();

    const res = await request(app)
      .get(`${BASE}/getMyOrders`)
      .set(authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body.orders).toEqual([]);
  });

  it("does not return orders belonging to a different user", async () => {
    const { token: tokenA } = await createTestUser({ username: "orderusera", email: "orderusera@test.com" });
    const { token: tokenB } = await createTestUser({ username: "orderuserb", email: "orderuserb@test.com" });
    const sticker = await makeSticker("User A Sticker");

    // User A places an order
    await addToCart(tokenA, sticker._id);
    await request(app).post(`${BASE}/create`).set(authHeader(tokenA));

    // User B should have no orders
    const res = await request(app).get(`${BASE}/getMyOrders`).set(authHeader(tokenB));
    expect(res.body.orders).toHaveLength(0);
  });

  it("returns 401 without auth token", async () => {
    const res = await request(app).get(`${BASE}/getMyOrders`);
    expect(res.status).toBe(401);
  });
});

//  GET ORDER BY ID
describe("GET /getbyID/:id", () => {

  it("returns a specific order by ID for the owner", async () => {
    const { token } = await createTestUser();
    const sticker = await makeSticker("Get By ID Sticker");
    await addToCart(token, sticker._id);
    const orderRes = await request(app).post(`${BASE}/create`).set(authHeader(token));
    const orderId = orderRes.body.order._id;

    const res = await request(app)
      .get(`${BASE}/getbyID/${orderId}`)
      .set(authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body.order._id).toBe(orderId);
  });

  it("returns 404 when the order belongs to a different user (BOLA protection)", async () => {
    const { token: tokenA } = await createTestUser({ username: "orderuserx", email: "orderuserx@test.com" });
    const { token: tokenB } = await createTestUser({ username: "orderusery", email: "orderusery@test.com" });
    const sticker = await makeSticker("BOLA Order Sticker");

    await addToCart(tokenA, sticker._id);
    const orderRes = await request(app).post(`${BASE}/create`).set(authHeader(tokenA));
    const orderId = orderRes.body.order._id;

    // User B tries to fetch User A's order
    const res = await request(app)
      .get(`${BASE}/getbyID/${orderId}`)
      .set(authHeader(tokenB));

    expect(res.status).toBe(404);
  });

  it("returns 404 for a non-existent order ID", async () => {
    const { token } = await createTestUser();
    const fakeId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .get(`${BASE}/getbyID/${fakeId}`)
      .set(authHeader(token));

    expect(res.status).toBe(404);
  });

  it("returns 401 without auth token", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).get(`${BASE}/getbyID/${fakeId}`);
    expect(res.status).toBe(401);
  });
});

//  GET MY PURCHASED STICKERS
describe("GET /getMyPurchasedStickers", () => {

  it("returns the stickers the user has purchased", async () => {
    const { token } = await createTestUser();
    const sticker = await makeSticker("Purchased Sticker");
    await addToCart(token, sticker._id);
    await request(app).post(`${BASE}/create`).set(authHeader(token));

    const res = await request(app)
      .get(`${BASE}/getMyPurchasedStickers`)
      .set(authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body.stickers).toHaveLength(1);
    expect(res.body.stickers[0].name).toBe("Purchased Sticker");
  });

  it("returns an empty array when the user has not purchased anything", async () => {
    const { token } = await createTestUser();

    const res = await request(app)
      .get(`${BASE}/getMyPurchasedStickers`)
      .set(authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body.stickers).toEqual([]);
  });

  it("deduplicates stickers that appear in multiple orders", async () => {
    const { token, user } = await createTestUser();
    const sticker = await makeSticker("Dedup Sticker");

    // Manually create two paid orders containing the same sticker
    await Order.create({
      user_id: user._id,
      items: [{ sticker_id: sticker._id, price_at_purchase: sticker.price, is_limited: false }],
      total_amount: sticker.price,
      payment_status: "PAID",
      payment_method: "MOCK"
    });
    await Order.create({
      user_id: user._id,
      items: [{ sticker_id: sticker._id, price_at_purchase: sticker.price, is_limited: false }],
      total_amount: sticker.price,
      payment_status: "PAID",
      payment_method: "MOCK"
    });

    const res = await request(app)
      .get(`${BASE}/getMyPurchasedStickers`)
      .set(authHeader(token));

    // Same sticker in two orders should only appear once
    expect(res.body.stickers).toHaveLength(1);
  });

  it("returns 401 without auth token", async () => {
    const res = await request(app).get(`${BASE}/getMyPurchasedStickers`);
    expect(res.status).toBe(401);
  });
});
