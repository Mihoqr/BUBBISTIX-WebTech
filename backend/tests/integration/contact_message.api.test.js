import { describe, it, expect } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import app from "../../backend/src/app.js";
import { ContactMessage } from "../../backend/src/models/contact_message.model.js";
import { createAdminUser, createTestUser, authHeader } from "../setup/testHelpers.js";

//  Integration Tests — Contact Message API
//
//  Routes tested:
//    POST   /api/v1/contactMessages/create          (public)
//    GET    /api/v1/contactMessages/getAll          (admin only)
//    PATCH  /api/v1/contactMessages/update/:id      (admin only)
//    DELETE /api/v1/contactMessages/delete/:id      (admin only)

const BASE = "/api/v1/contactMessages";

// Helper — valid contact message payload
const validMessage = (overrides = {}) => ({
  name: "Maria Clara",
  email: "maria@example.com",
  message: "Hello, I have a question about my order.",
  ...overrides
});

//  CREATE CONTACT MESSAGE (public)
describe("POST /create", () => {

  it("submits a contact message and returns 201", async () => {
    const res = await request(app)
      .post(`${BASE}/create`)
      .send(validMessage());

    expect(res.status).toBe(201);
    expect(res.body.message).toMatch(/sent successfully/i);
    expect(res.body.contactMessage.name).toBe("Maria Clara");
    expect(res.body.contactMessage.status).toBe("NEW");
  });

  it("does not require authentication — anyone can submit", async () => {
    const res = await request(app)
      .post(`${BASE}/create`)
      .send(validMessage({ email: "public@example.com" }));

    expect(res.status).toBe(201);
  });

  it("returns 400 when name is missing", async () => {
    const res = await request(app)
      .post(`${BASE}/create`)
      .send(validMessage({ name: undefined }));

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/required/i);
  });

  it("returns 400 when email is missing", async () => {
    const res = await request(app)
      .post(`${BASE}/create`)
      .send(validMessage({ email: undefined }));

    expect(res.status).toBe(400);
  });

  it("returns 400 when message body is missing", async () => {
    const res = await request(app)
      .post(`${BASE}/create`)
      .send(validMessage({ message: undefined }));

    expect(res.status).toBe(400);
  });

  it("returns 400 for an invalid email format", async () => {
    const res = await request(app)
      .post(`${BASE}/create`)
      .send(validMessage({ email: "not-an-email" }));

    expect(res.status).toBe(400);
  });

  it("returns 400 when message is too short (under 5 chars)", async () => {
    const res = await request(app)
      .post(`${BASE}/create`)
      .send(validMessage({ message: "Hi" }));

    expect(res.status).toBe(400);
  });

  it("stores the message with default status of NEW", async () => {
    await request(app).post(`${BASE}/create`).send(validMessage());

    const stored = await ContactMessage.findOne({ email: "maria@example.com" });
    expect(stored.status).toBe("NEW");
  });
});

//  GET ALL MESSAGES (admin only)
describe("GET /getAll", () => {

  it("returns all messages for an ADMIN, sorted newest first", async () => {
    await ContactMessage.create(validMessage());
    await ContactMessage.create(validMessage({ email: "second@example.com" }));

    const { token } = await createAdminUser();
    const res = await request(app)
      .get(`${BASE}/getAll`)
      .set(authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body.messages).toHaveLength(2);
  });

  it("returns 403 when a regular USER tries to access messages", async () => {
    const { token } = await createTestUser();
    const res = await request(app)
      .get(`${BASE}/getAll`)
      .set(authHeader(token));

    expect(res.status).toBe(403);
  });

  it("returns 401 when no token is provided", async () => {
    const res = await request(app).get(`${BASE}/getAll`);
    expect(res.status).toBe(401);
  });

  it("returns an empty array when no messages exist", async () => {
    const { token } = await createAdminUser();
    const res = await request(app)
      .get(`${BASE}/getAll`)
      .set(authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body.messages).toEqual([]);
  });
});

//  UPDATE MESSAGE STATUS (admin only)
describe("PATCH /update/:id", () => {

  it("updates status to READ and returns 200", async () => {
    const msg = await ContactMessage.create(validMessage());
    const { token } = await createAdminUser();

    const res = await request(app)
      .patch(`${BASE}/update/${msg._id}`)
      .set(authHeader(token))
      .send({ status: "READ" });

    expect(res.status).toBe(200);
    expect(res.body.contactMessage.status).toBe("READ");
  });

  it("updates status to RESOLVED and returns 200", async () => {
    const msg = await ContactMessage.create(validMessage());
    const { token } = await createAdminUser();

    const res = await request(app)
      .patch(`${BASE}/update/${msg._id}`)
      .set(authHeader(token))
      .send({ status: "RESOLVED" });

    expect(res.status).toBe(200);
    expect(res.body.contactMessage.status).toBe("RESOLVED");
  });

  it("accepts lowercase status and normalizes it to uppercase", async () => {
    const msg = await ContactMessage.create(validMessage());
    const { token } = await createAdminUser();

    const res = await request(app)
      .patch(`${BASE}/update/${msg._id}`)
      .set(authHeader(token))
      .send({ status: "read" }); // lowercase input

    expect(res.status).toBe(200);
    expect(res.body.contactMessage.status).toBe("READ");
  });

  it("returns 400 for an invalid status value", async () => {
    const msg = await ContactMessage.create(validMessage());
    const { token } = await createAdminUser();

    const res = await request(app)
      .patch(`${BASE}/update/${msg._id}`)
      .set(authHeader(token))
      .send({ status: "DELETED" }); // not a valid enum value

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid status/i);
  });

  it("returns 400 when status field is missing", async () => {
    const msg = await ContactMessage.create(validMessage());
    const { token } = await createAdminUser();

    const res = await request(app)
      .patch(`${BASE}/update/${msg._id}`)
      .set(authHeader(token))
      .send({});

    expect(res.status).toBe(400);
  });

  it("returns 404 when the message ID does not exist", async () => {
    const { token } = await createAdminUser();
    const fakeId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .patch(`${BASE}/update/${fakeId}`)
      .set(authHeader(token))
      .send({ status: "READ" });

    expect(res.status).toBe(404);
  });

  it("returns 403 when a USER tries to update a message status", async () => {
    const msg = await ContactMessage.create(validMessage());
    const { token } = await createTestUser();

    const res = await request(app)
      .patch(`${BASE}/update/${msg._id}`)
      .set(authHeader(token))
      .send({ status: "READ" });

    expect(res.status).toBe(403);
  });
});

//  DELETE MESSAGE (admin only)
describe("DELETE /delete/:id", () => {

  it("deletes a message and returns 200 for an ADMIN", async () => {
    const msg = await ContactMessage.create(validMessage());
    const { token } = await createAdminUser();

    const res = await request(app)
      .delete(`${BASE}/delete/${msg._id}`)
      .set(authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);
  });

  it("confirms the message is removed from the database after deletion", async () => {
    const msg = await ContactMessage.create(validMessage());
    const { token } = await createAdminUser();

    await request(app).delete(`${BASE}/delete/${msg._id}`).set(authHeader(token));

    const found = await ContactMessage.findById(msg._id);
    expect(found).toBeNull();
  });

  it("returns 404 when the message ID does not exist", async () => {
    const { token } = await createAdminUser();
    const fakeId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .delete(`${BASE}/delete/${fakeId}`)
      .set(authHeader(token));

    expect(res.status).toBe(404);
  });

  it("returns 403 when a USER tries to delete a message", async () => {
    const msg = await ContactMessage.create(validMessage());
    const { token } = await createTestUser();

    const res = await request(app)
      .delete(`${BASE}/delete/${msg._id}`)
      .set(authHeader(token));

    expect(res.status).toBe(403);
  });

  it("returns 401 with no auth token", async () => {
    const msg = await ContactMessage.create(validMessage());

    const res = await request(app).delete(`${BASE}/delete/${msg._id}`);
    expect(res.status).toBe(401);
  });
});
