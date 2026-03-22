import mongoose from "mongoose";
import { afterAll, afterEach, beforeAll } from "vitest";

// Connect to the in-memory MongoDB before tests in this file run
beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGO_URI);
  }
});

// Wipe all collections between tests so each test starts with a clean slate
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// Disconnect after all tests in this file finish
afterAll(async () => {
  await mongoose.disconnect();
});
