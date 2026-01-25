import express from "express";
import userRouter from "./routes/user.route.js";
import categoryRouter from "./routes/category.route.js";
import stickerRouter from "./routes/sticker.route.js";
import cartsRouter from "./routes/cart.route.js";
import ordersRouter from "./routes/order.route.js";
import contactMessagesRouter from "./routes/contact_message.route.js";

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/v1/users", userRouter);
app.use("/api/v1/categories", categoryRouter);
app.use("/api/v1/stickers", stickerRouter);
app.use("/api/v1/carts", cartsRouter);
app.use("/api/v1/orders", ordersRouter);
app.use("/api/v1/contactMessages", contactMessagesRouter);

// Test
app.get("/", (req, res) => {
  res.json({ message: "Bubbistix API is running" });
});

export default app;