import cors from "cors";
import path from "path";
import express from "express";
import userRouter from "./routes/user.route.js";
import categoryRouter from "./routes/category.route.js";
import stickerRouter from "./routes/sticker.route.js";
import cartsRouter from "./routes/cart.route.js";
import ordersRouter from "./routes/order.route.js";
import contactMessagesRouter from "./routes/contact_message.route.js";
import downloadLogsRouter from "./routes/download_log.route.js";

const app = express();

// CORS
app.use(cors({
  origin: "*"
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  "/previews",
  express.static(path.join(process.cwd(), "backend/private/previews"))
);

// Routes
app.use("/api/v1/users", userRouter);
app.use("/api/v1/categories", categoryRouter);
app.use("/api/v1/stickers", stickerRouter);
app.use("/api/v1/carts", cartsRouter);
app.use("/api/v1/orders", ordersRouter);
app.use("/api/v1/contactMessages", contactMessagesRouter);
app.use("/api/v1/downloads", downloadLogsRouter);

// Test
app.get("/", (req, res) => {
  res.json({ message: "Bubbistix API is running" });
});

export default app;