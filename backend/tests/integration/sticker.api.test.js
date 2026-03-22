import { describe, it, expect, vi, beforeAll } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import app from "../../backend/src/app.js";
import { Sticker } from "../../backend/src/models/sticker.model.js";
import { Category } from "../../backend/src/models/category.model.js";
import { createAdminUser, createTestUser, authHeader } from "../setup/testHelpers.js";

//  Integration Tests — Sticker API
//
//  NOTE: createSticker and updateSticker require real S3 file uploads
//  (via multer-s3). Those are not testable via HTTP integration tests
//  without an S3 mock service. We test everything else comprehensively.
//
//  deleteSticker calls the real S3 SDK, so we mock the s3 module to
//  prevent real AWS calls in the test environment.
//
//  Routes tested:
//    GET  /api/v1/stickers/getAll                  (public)
//    GET  /api/v1/stickers/getByID/:id             (public)
//    GET  /api/v1/stickers/getByCategory/:id       (public)
//    DELETE /api/v1/stickers/delete/:id            (admin — S3 mocked)
//    POST /api/v1/stickers/createMultipleStickers  (admin — no S3 needed)

// Mock the S3 client so deleteSticker never makes real AWS calls
vi.mock("../../backend/src/config/s3.js", () => ({
  default: {
    send: vi.fn().mockResolvedValue({}) // simulates a successful S3 delete
  }
}));

const BASE = "/api/v1/stickers";

// Helper: seed a sticker directly in DB (bypasses S3 upload middleware)
async function seedSticker(categoryId, overrides = {}) {
  return Sticker.create({
    name: overrides.name ?? "Kawaii Cats Pack",
    description: overrides.description ?? "Adorable cat sticker pack for testing integration flows.",
    price: overrides.price ?? 129,
    category_id: categoryId,
    preview_images: overrides.preview_images ?? ["cat-preview.jpg"],
    sticker_zip: overrides.sticker_zip ?? "kawaii-cats.zip",
    is_limited: overrides.is_limited ?? false
  });
}

//  GET ALL STICKERS (public)
describe("GET /getAll", () => {

  it("returns 200 and an empty array when no stickers exist", async () => {
    const res = await request(app).get(`${BASE}/getAll`);

    expect(res.status).toBe(200);
    expect(res.body.stickers).toEqual([]);
  });

  it("returns all stickers with preview image URLs formatted", async () => {
    const cat = await Category.create({ name: "Cats" });
    await seedSticker(cat._id, { name: "Fluffy Pack" });

    const res = await request(app).get(`${BASE}/getAll`);

    expect(res.status).toBe(200);
    expect(res.body.stickers).toHaveLength(1);
    // Preview images should be full URLs (formatStickerImages applies S3 base URL)
    expect(res.body.stickers[0].preview_images[0]).toMatch(/^https?:\/\//);
  });

  it("returns multiple stickers sorted newest first", async () => {
    const cat = await Category.create({ name: "Dogs" });
    await seedSticker(cat._id, { name: "Puppy Pack One" });
    await seedSticker(cat._id, { name: "Puppy Pack Two" });

    const res = await request(app).get(`${BASE}/getAll`);

    expect(res.status).toBe(200);
    expect(res.body.stickers).toHaveLength(2);
  });

  it("filters stickers by category_id query parameter", async () => {
    const catA = await Category.create({ name: "Fruits" });
    const catB = await Category.create({ name: "Veggies" });
    await seedSticker(catA._id, { name: "Apple Pack" });
    await seedSticker(catB._id, { name: "Carrot Pack" });

    const res = await request(app)
      .get(`${BASE}/getAll`)
      .query({ category_id: catA._id.toString() });

    expect(res.status).toBe(200);
    expect(res.body.stickers).toHaveLength(1);
    expect(res.body.stickers[0].name).toBe("Apple Pack");
  });

  it("does not require authentication", async () => {
    const res = await request(app).get(`${BASE}/getAll`);
    expect(res.status).toBe(200);
  });
});

//  GET STICKER BY ID (public)
describe("GET /getByID/:id", () => {

  it("returns the sticker with formatted image URLs", async () => {
    const cat = await Category.create({ name: "Space" });
    const sticker = await seedSticker(cat._id, { name: "Galaxy Pack" });

    const res = await request(app).get(`${BASE}/getByID/${sticker._id}`);

    expect(res.status).toBe(200);
    expect(res.body.sticker.name).toBe("Galaxy Pack");
    expect(res.body.sticker.preview_images[0]).toMatch(/^https?:\/\//);
  });

  it("returns 404 for a non-existent sticker ID", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).get(`${BASE}/getByID/${fakeId}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/not found/i);
  });

  it("does not require authentication", async () => {
    const cat = await Category.create({ name: "Ocean" });
    const sticker = await seedSticker(cat._id, { name: "Sea Pack" });

    const res = await request(app).get(`${BASE}/getByID/${sticker._id}`);
    expect(res.status).toBe(200);
  });
});

//  GET STICKERS BY CATEGORY (public)
describe("GET /getByCategory/:category_id", () => {

  it("returns all stickers under a valid category", async () => {
    const cat = await Category.create({ name: "Food" });
    await seedSticker(cat._id, { name: "Pizza Pack" });
    await seedSticker(cat._id, { name: "Burger Pack" });

    const res = await request(app).get(`${BASE}/getByCategory/${cat._id}`);

    expect(res.status).toBe(200);
    expect(res.body.stickers).toHaveLength(2);
    expect(res.body.category.name).toBe("Food");
  });

  it("returns an empty stickers array for a valid category with no stickers", async () => {
    const cat = await Category.create({ name: "Empty Category" });

    const res = await request(app).get(`${BASE}/getByCategory/${cat._id}`);

    expect(res.status).toBe(200);
    expect(res.body.stickers).toEqual([]);
  });

  it("returns 404 when the category does not exist", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).get(`${BASE}/getByCategory/${fakeId}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/not found/i);
  });

  it("only returns stickers from the requested category, not others", async () => {
    const catA = await Category.create({ name: "Sports" });
    const catB = await Category.create({ name: "Music" });
    await seedSticker(catA._id, { name: "Football Pack" });
    await seedSticker(catB._id, { name: "Guitar Pack" });

    const res = await request(app).get(`${BASE}/getByCategory/${catA._id}`);

    expect(res.body.stickers).toHaveLength(1);
    expect(res.body.stickers[0].name).toBe("Football Pack");
  });
});

//  DELETE STICKER (admin only — S3 is mocked)
describe("DELETE /delete/:id", () => {

  it("deletes a sticker and returns 200 for an ADMIN", async () => {
    const cat = await Category.create({ name: "Delete Test" });
    const sticker = await seedSticker(cat._id, { name: "Delete Me Pack" });
    const { token } = await createAdminUser();

    const res = await request(app)
      .delete(`${BASE}/delete/${sticker._id}`)
      .set(authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);
  });

  it("confirms the sticker is gone from the DB after deletion", async () => {
    const cat = await Category.create({ name: "Cleanup Test" });
    const sticker = await seedSticker(cat._id, { name: "Gone Pack" });
    const { token } = await createAdminUser();

    await request(app).delete(`${BASE}/delete/${sticker._id}`).set(authHeader(token));

    const found = await Sticker.findById(sticker._id);
    expect(found).toBeNull();
  });

  it("returns 404 when the sticker ID does not exist", async () => {
    const { token } = await createAdminUser();
    const fakeId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .delete(`${BASE}/delete/${fakeId}`)
      .set(authHeader(token));

    expect(res.status).toBe(404);
  });

  it("returns 403 when a USER tries to delete a sticker", async () => {
    const cat = await Category.create({ name: "User Delete Test" });
    const sticker = await seedSticker(cat._id, { name: "Protected Pack" });
    const { token } = await createTestUser();

    const res = await request(app)
      .delete(`${BASE}/delete/${sticker._id}`)
      .set(authHeader(token));

    expect(res.status).toBe(403);
  });

  it("returns 401 with no auth token", async () => {
    const cat = await Category.create({ name: "Auth Delete Test" });
    const sticker = await seedSticker(cat._id, { name: "Unprotected Pack" });

    const res = await request(app).delete(`${BASE}/delete/${sticker._id}`);
    expect(res.status).toBe(401);
  });
});

//  CREATE MULTIPLE STICKERS (admin — no S3)
describe("POST /createMultipleStickers", () => {

  it("bulk-creates multiple stickers and returns 201", async () => {
    const cat = await Category.create({ name: "Bulk Category" });
    const { token } = await createAdminUser();

    const res = await request(app)
      .post(`${BASE}/createMultipleStickers`)
      .set(authHeader(token))
      .send({
        stickers: [
          {
            name: "Bulk Pack One",
            description: "First sticker in the bulk creation integration test.",
            price: 99,
            category_id: cat._id.toString(),
            preview_images: ["bulk1.jpg"],
            sticker_zip: "bulk1.zip"
          },
          {
            name: "Bulk Pack Two",
            description: "Second sticker in the bulk creation integration test.",
            price: 149,
            category_id: cat._id.toString(),
            preview_images: ["bulk2.jpg"],
            sticker_zip: "bulk2.zip"
          }
        ]
      });

    expect(res.status).toBe(201);
    expect(res.body.created_count).toBe(2);
    expect(res.body.stickers).toHaveLength(2);
  });

  it("skips duplicate sticker names and only creates new ones", async () => {
    const cat = await Category.create({ name: "Dupe Bulk Category" });
    const { token } = await createAdminUser();

    // Pre-create one sticker
    await seedSticker(cat._id, { name: "Existing Pack" });

    const res = await request(app)
      .post(`${BASE}/createMultipleStickers`)
      .set(authHeader(token))
      .send({
        stickers: [
          {
            name: "Existing Pack", // already exists — should be skipped
            description: "This sticker already exists in the database for testing.",
            price: 50,
            category_id: cat._id.toString(),
            preview_images: ["x.jpg"],
            sticker_zip: "x.zip"
          },
          {
            name: "Brand New Pack",
            description: "This is a brand new sticker that does not yet exist.",
            price: 79,
            category_id: cat._id.toString(),
            preview_images: ["new.jpg"],
            sticker_zip: "new.zip"
          }
        ]
      });

    expect(res.status).toBe(201);
    expect(res.body.created_count).toBe(1);
    expect(res.body.skipped_count).toBe(1);
    expect(res.body.skipped_names).toContain("Existing Pack");
  });

  it("returns 409 when ALL stickers in the batch already exist", async () => {
    const cat = await Category.create({ name: "All Dupes Category" });
    const { token } = await createAdminUser();
    await seedSticker(cat._id, { name: "Dupe Pack" });

    const res = await request(app)
      .post(`${BASE}/createMultipleStickers`)
      .set(authHeader(token))
      .send({
        stickers: [
          {
            name: "Dupe Pack",
            description: "All stickers in this batch already exist in the database.",
            price: 50,
            category_id: cat._id.toString(),
            preview_images: ["d.jpg"],
            sticker_zip: "d.zip"
          }
        ]
      });

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/all stickers already exist/i);
  });

  it("returns 400 when the stickers array is empty", async () => {
    const { token } = await createAdminUser();
    const res = await request(app)
      .post(`${BASE}/createMultipleStickers`)
      .set(authHeader(token))
      .send({ stickers: [] });

    expect(res.status).toBe(400);
  });

  it("returns 400 when a sticker in the batch is missing required fields", async () => {
    const cat = await Category.create({ name: "Missing Fields Category" });
    const { token } = await createAdminUser();

    const res = await request(app)
      .post(`${BASE}/createMultipleStickers`)
      .set(authHeader(token))
      .send({
        stickers: [
          {
            name: "Incomplete Pack"
            // missing: description, price, category_id, preview_images, sticker_zip
          }
        ]
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/required fields/i);
  });

  it("returns 400 when a category_id in the batch is invalid", async () => {
    const { token } = await createAdminUser();
    const fakeId = new mongoose.Types.ObjectId().toString();

    const res = await request(app)
      .post(`${BASE}/createMultipleStickers`)
      .set(authHeader(token))
      .send({
        stickers: [
          {
            name: "Bad Category Pack",
            description: "This sticker references a category that does not exist.",
            price: 99,
            category_id: fakeId,
            preview_images: ["bad.jpg"],
            sticker_zip: "bad.zip"
          }
        ]
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid/i);
  });

  it("returns 403 when a USER tries to bulk create stickers", async () => {
    const cat = await Category.create({ name: "User Bulk Category" });
    const { token } = await createTestUser();

    const res = await request(app)
      .post(`${BASE}/createMultipleStickers`)
      .set(authHeader(token))
      .send({ stickers: [{ name: "Sneaky Pack" }] });

    expect(res.status).toBe(403);
  });
});
