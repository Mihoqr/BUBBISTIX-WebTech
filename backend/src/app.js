import express from "express";
import userRouter from "./routes/user.route.js";

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/v1/users", userRouter);

// Test
app.get("/", (req, res) => {
  res.json({ message: "Bubbistix API is running" });
});

export default app;