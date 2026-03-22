import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import app from "../../backend/src/app.js";
import { Sticker } from "../../backend/src/models/sticker.model.js";
import { Category } from "../../backend/src/models/category.model.js";
import { createTestUser, authHeader } from "../setup/testHelpers.js";

//  Integration Tests — Cart API
//  All cart routes require authentication.
//
//  Routes tested:
//    GET    /api/v1/carts/getCart
//    POST   /api/v1/carts/addToCart
//    DELETE /api/v1/carts/removeFromCart/:sticker_id
//    DELETE /api/v1/carts/clearCart

const BASE = "/api/v1/carts";

// Counter to guarantee unique category names across all createTestSticker calls
let stickerCounter = 0;

// Helper: create a real sticker in the test DB
async function createTestSticker(overrides = {}) {
  stickerCounter++;
  const category = await Category.create({ name: `Test Category ${stickerCounter}` });

  return Sticker.create({
    name: overrides.name ?? `Test Sticker Pack ${stickerCounter}`,
    description: "A sticker pack used in tests. Minimum length.",
    price: overrides.price ?? 99,
    category_id: category._id,
    preview_images: ["test-image-key.jpg"],
    sticker_zip: "test-sticker.zip",
    is_limited: overrides.is_limited ?? false
  });
}

//  GET CART
describe("GET /getCart", () => {

  it("returns 200 and an empty cart for a new user", async () => {
    const { token } = await createTestUser();
    const res = await request(app)
      .get(`${BASE}/getCart`)
      .set(authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body.cart).toBeDefined();
    expect(res.body.cart.items).toEqual([]);
  });

  it("returns 401 when request has no auth token", async () => {
    const res = await request(app).get(`${BASE}/getCart`);

    expect(res.status).toBe(401);
  });
});

//  ADD TO CART
describe("POST /addToCart", () => {

  it("adds a sticker to the cart and returns 200", async () => {
    const { token } = await createTestUser();
    const sticker = await createTestSticker();

    const res = await request(app)
      .post(`${BASE}/addToCart`)
      .set(authHeader(token))
      .send({ sticker_id: sticker._id.toString() });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/added/i);
    expect(res.body.cart.items).toHaveLength(1);
    expect(res.body.cart.items[0].sticker_id.toString()).toBe(sticker._id.toString());
  });

  it("returns 400 when adding the same sticker twice (duplicate in cart)", async () => {
    const { token } = await createTestUser();
    const sticker = await createTestSticker();

    await request(app)
      .post(`${BASE}/addToCart`)
      .set(authHeader(token))
      .send({ sticker_id: sticker._id.toString() });

    const res = await request(app)
      .post(`${BASE}/addToCart`)
      .set(authHeader(token))
      .send({ sticker_id: sticker._id.toString() });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already in cart/i);
  });

  it("returns 404 when sticker_id does not exist", async () => {
    const { token } = await createTestUser();
    const fakeId = new mongoose.Types.ObjectId().toString();

    const res = await request(app)
      .post(`${BASE}/addToCart`)
      .set(authHeader(token))
      .send({ sticker_id: fakeId });

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/sticker not found/i);
  });

  it("returns 400 when sticker_id is missing from the request body", async () => {
    const { token } = await createTestUser();
    const res = await request(app)
      .post(`${BASE}/addToCart`)
      .set(authHeader(token))
      .send({});

    expect(res.status).toBe(400);
  });

  it("returns 401 when no auth token is provided", async () => {
    const sticker = await createTestSticker();
    const res = await request(app)
      .post(`${BASE}/addToCart`)
      .send({ sticker_id: sticker._id.toString() });

    expect(res.status).toBe(401);
  });

  it("snapshots the price at the time of adding to cart", async () => {
    const { token } = await createTestUser();
    const sticker = await createTestSticker({ price: 149 });

    const res = await request(app)
      .post(`${BASE}/addToCart`)
      .set(authHeader(token))
      .send({ sticker_id: sticker._id.toString() });

    expect(res.status).toBe(200);
    expect(res.body.cart.items[0].price_at_add).toBe(149);
  });
});

//  REMOVE FROM CART
describe("DELETE /removeFromCart/:sticker_id", () => {

  it("removes a sticker from the cart and returns 200", async () => {
    const { token } = await createTestUser();
    const sticker = await createTestSticker();

    // First add it
    await request(app)
      .post(`${BASE}/addToCart`)
      .set(authHeader(token))
      .send({ sticker_id: sticker._id.toString() });

    // Then remove it
    const res = await request(app)
      .delete(`${BASE}/removeFromCart/${sticker._id}`)
      .set(authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body.cart.items).toHaveLength(0);
  });

  it("returns 404 when trying to remove a sticker that was never added", async () => {
    const { token } = await createTestUser();
    const sticker = await createTestSticker();

    const res = await request(app)
      .delete(`${BASE}/removeFromCart/${sticker._id}`)
      .set(authHeader(token));

    // Cart doesn't exist yet OR sticker not found in cart → 404
    expect([404]).toContain(res.status);
  });

  it("returns 401 without auth token", async () => {
    const sticker = await createTestSticker();
    const res = await request(app)
      .delete(`${BASE}/removeFromCart/${sticker._id}`);

    expect(res.status).toBe(401);
  });
});

//  CLEAR CART
describe("DELETE /clearCart", () => {

  it("clears all items from the cart and returns 200", async () => {
    const { token } = await createTestUser();
    const sticker1 = await createTestSticker({ name: "Sticker Pack One" });
    const sticker2 = await createTestSticker({ name: "Sticker Pack Two" });

    // Add two stickers
    await request(app).post(`${BASE}/addToCart`).set(authHeader(token)).send({ sticker_id: sticker1._id.toString() });
    await request(app).post(`${BASE}/addToCart`).set(authHeader(token)).send({ sticker_id: sticker2._id.toString() });

    // Clear the cart
    const res = await request(app)
      .delete(`${BASE}/clearCart`)
      .set(authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/cleared/i);
  });

  it("two users' carts are completely isolated from each other", async () => {
    const { token: token1 } = await createTestUser({ username: "user1", email: "user1@test.com" });
    const { token: token2 } = await createTestUser({ username: "user2", email: "user2@test.com" });
    const sticker = await createTestSticker();

    // user1 adds to cart
    await request(app).post(`${BASE}/addToCart`).set(authHeader(token1)).send({ sticker_id: sticker._id.toString() });

    // user2 clears THEIR cart
    await request(app).delete(`${BASE}/clearCart`).set(authHeader(token2));

    // user1's cart should still have the item
    const res = await request(app).get(`${BASE}/getCart`).set(authHeader(token1));
    expect(res.body.cart.items).toHaveLength(1);
  });

  it("returns 401 without auth token", async () => {
    const res = await request(app).delete(`${BASE}/clearCart`);
    expect(res.status).toBe(401);
  });
});
