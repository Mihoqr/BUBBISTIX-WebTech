import { MongoMemoryServer } from "mongodb-memory-server";

let mongod;

// Runs ONCE before all test files start
export async function setup() {
  mongod = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongod.getUri();
}

// Runs ONCE after all test files finish
export async function teardown() {
  if (mongod) {
    await mongod.stop();
  }
}
