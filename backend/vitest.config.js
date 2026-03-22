import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Run test files sequentially — required because all files share the
    // same in-memory MongoDB. Parallel execution causes duplicate key errors
    // (two files creating "testuser" at the same time) and Mongoose
    // VersionErrors (two files modifying the same document simultaneously).
    fileParallelism: false,

    // Run each test file in its own forked process for clean module isolation
    pool: "forks",

    // Global setup that runs once before all test suites
    globalSetup: "./tests/setup/globalSetup.js",

    // Per-file setup that runs before every test file
    setupFiles: ["./tests/setup/setup.js"],

    // Environment variables for testing
    env: {
      JWT_SECRET: "test_super_secret_key_for_vitest_only",
      JWT_EXPIRES_IN: "1h",
      NODE_ENV: "test"
    },

    // Test file patterns
    include: [
      "tests/**/*.test.js"
    ],

    // Coverage configuration
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["backend/src/**/*.js"],
      exclude: ["backend/src/index.js", "backend/src/config/**"]
    },

    // Timeout per test (ms)
    testTimeout: 15000
  }
});
