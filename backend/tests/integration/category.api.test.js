import { describe, it, expect } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import app from "../../backend/src/app.js";
import { Category } from "../../backend/src/models/category.model.js";
import { Sticker } from "../../backend/src/models/sticker.model.js";
import { createAdminUser, createTestUser, authHeader } from "../setup/testHelpers.js";

//  Integration Tests — Category API
//
//  Routes tested:
//    GET    /api/v1/categories/getAll          (public)
//    POST   /api/v1/categories/create          (admin only)
//    PUT    /api/v1/categories/update/:id      (admin only)
//    DELETE /api/v1/categories/delete/:id      (admin only)

const BASE = "/api/v1/categories";

//  GET ALL CATEGORIES (public)
describe("GET /getAll", () => {

  it("returns 200 and an empty array when no categories exist", async () => {
    const res = await request(app).get(`${BASE}/getAll`);

    expect(res.status).toBe(200);
    expect(res.body.categories).toEqual([]);
  });

  it("returns all categories sorted by name", async () => {
    await Category.create({ name: "Zeta Pack" });
    await Category.create({ name: "Alpha Pack" });

    const res = await request(app).get(`${BASE}/getAll`);

    expect(res.status).toBe(200);
    expect(res.body.categories).toHaveLength(2);
    // Should be alphabetically sorted
    expect(res.body.categories[0].name).toBe("Alpha Pack");
    expect(res.body.categories[1].name).toBe("Zeta Pack");
  });

  it("does not require authentication", async () => {
    const res = await request(app).get(`${BASE}/getAll`);
    expect(res.status).toBe(200); // publicly accessible
  });
});

//  CREATE CATEGORY (admin only)
describe("POST /create", () => {

  it("creates a category and returns 201 for an ADMIN", async () => {
    const { token } = await createAdminUser();
    const res = await request(app)
      .post(`${BASE}/create`)
      .set(authHeader(token))
      .send({ name: "Cute Animals" });

    expect(res.status).toBe(201);
    expect(res.body.message).toMatch(/created/i);
    expect(res.body.category.name).toBe("Cute Animals");
  });

  it("returns 403 when a regular USER tries to create a category", async () => {
    const { token } = await createTestUser();
    const res = await request(app)
      .post(`${BASE}/create`)
      .set(authHeader(token))
      .send({ name: "Sneaky Category" });

    expect(res.status).toBe(403);
  });

  it("returns 401 when no token is provided", async () => {
    const res = await request(app)
      .post(`${BASE}/create`)
      .send({ name: "No Auth Category" });

    expect(res.status).toBe(401);
  });

  it("returns 400 when name field is missing", async () => {
    const { token } = await createAdminUser();
    const res = await request(app)
      .post(`${BASE}/create`)
      .set(authHeader(token))
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/name is required/i);
  });

  it("returns 409 when a duplicate category name is submitted", async () => {
    const { token } = await createAdminUser();
    await request(app).post(`${BASE}/create`).set(authHeader(token)).send({ name: "Kawaii" });

    const res = await request(app)
      .post(`${BASE}/create`)
      .set(authHeader(token))
      .send({ name: "Kawaii" });

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/already exists/i);
  });

  it("the created category appears in the getAll list", async () => {
    const { token } = await createAdminUser();
    await request(app).post(`${BASE}/create`).set(authHeader(token)).send({ name: "Food Stickers" });

    const res = await request(app).get(`${BASE}/getAll`);
    const names = res.body.categories.map(c => c.name);

    expect(names).toContain("Food Stickers");
  });
});

//  UPDATE CATEGORY (admin only)
describe("PUT /update/:id", () => {

  it("updates a category name and returns 200 for an ADMIN", async () => {
    const category = await Category.create({ name: "Old Name" });
    const { token } = await createAdminUser();

    const res = await request(app)
      .put(`${BASE}/update/${category._id}`)
      .set(authHeader(token))
      .send({ name: "New Name" });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/updated/i);
    expect(res.body.category.name).toBe("New Name");
  });

  it("returns 404 when the category ID does not exist", async () => {
    const { token } = await createAdminUser();
    const fakeId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .put(`${BASE}/update/${fakeId}`)
      .set(authHeader(token))
      .send({ name: "Ghost Category" });

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/not found/i);
  });

  it("returns 400 when name is missing from the update request", async () => {
    const category = await Category.create({ name: "Valid Name" });
    const { token } = await createAdminUser();

    const res = await request(app)
      .put(`${BASE}/update/${category._id}`)
      .set(authHeader(token))
      .send({});

    expect(res.status).toBe(400);
  });

  it("returns 403 when a USER tries to update a category", async () => {
    const category = await Category.create({ name: "Protected" });
    const { token } = await createTestUser();

    const res = await request(app)
      .put(`${BASE}/update/${category._id}`)
      .set(authHeader(token))
      .send({ name: "Hacked" });

    expect(res.status).toBe(403);
  });

  it("returns 409 when renaming to an already existing category name", async () => {
    await Category.create({ name: "Taken Name" });
    const category = await Category.create({ name: "Other Name" });
    const { token } = await createAdminUser();

    const res = await request(app)
      .put(`${BASE}/update/${category._id}`)
      .set(authHeader(token))
      .send({ name: "Taken Name" });

    expect(res.status).toBe(409);
  });
});

//  DELETE CATEGORY (admin only)
describe("DELETE /delete/:id", () => {

  it("deletes a category and returns 200 for an ADMIN", async () => {
    const category = await Category.create({ name: "Delete Me" });
    const { token } = await createAdminUser();

    const res = await request(app)
      .delete(`${BASE}/delete/${category._id}`)
      .set(authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);
  });

  it("confirms the category is removed from the database after deletion", async () => {
    const category = await Category.create({ name: "Gone Category" });
    const { token } = await createAdminUser();

    await request(app).delete(`${BASE}/delete/${category._id}`).set(authHeader(token));

    const found = await Category.findById(category._id);
    expect(found).toBeNull();
  });

  it("returns 404 when trying to delete a non-existent category", async () => {
    const { token } = await createAdminUser();
    const fakeId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .delete(`${BASE}/delete/${fakeId}`)
      .set(authHeader(token));

    expect(res.status).toBe(404);
  });

  it("returns 400 when trying to delete a category that has stickers", async () => {
    const category = await Category.create({ name: "Busy Category" });
    const { token } = await createAdminUser();

    // Create a sticker linked to this category
    await Sticker.create({
      name: "Linked Sticker",
      description: "A sticker tied to a category that we will try to delete.",
      price: 50,
      category_id: category._id,
      preview_images: ["img.jpg"],
      sticker_zip: "sticker.zip"
    });

    const res = await request(app)
      .delete(`${BASE}/delete/${category._id}`)
      .set(authHeader(token));

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/cannot delete/i);
  });

  it("returns 403 when a USER tries to delete a category", async () => {
    const category = await Category.create({ name: "Protected Category" });
    const { token } = await createTestUser();

    const res = await request(app)
      .delete(`${BASE}/delete/${category._id}`)
      .set(authHeader(token));

    expect(res.status).toBe(403);
  });

  it("returns 401 with no auth token", async () => {
    const category = await Category.create({ name: "Unauth Target" });

    const res = await request(app)
      .delete(`${BASE}/delete/${category._id}`);

    expect(res.status).toBe(401);
  });
});
