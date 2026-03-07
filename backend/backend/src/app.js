import cors from "cors";
import path from "path";
import express from "express";
import helmet from "helmet";
import userRouter from "./routes/user.route.js";
import categoryRouter from "./routes/category.route.js";
import stickerRouter from "./routes/sticker.route.js";
import cartsRouter from "./routes/cart.route.js";
import ordersRouter from "./routes/order.route.js";
import contactMessagesRouter from "./routes/contact_message.route.js";
import downloadLogsRouter from "./routes/download_log.route.js";

const app = express();

// Helmet configuration
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "https://accounts.google.com",
          "https://cdn.jsdelivr.net",
          "https://cdnjs.cloudflare.com"
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://fonts.googleapis.com",
          "https://cdn.jsdelivr.net"
        ],
        fontSrc: [
          "'self'",
          "https://fonts.gstatic.com"
        ],
        imgSrc: [
          "'self'",
          "data:",
          "https://bubbistix-storage.s3.ap-southeast-1.amazonaws.com"
        ],
        connectSrc: [
          "'self'",
          "http://localhost:4000"
        ]
      }
    },
    crossOriginResourcePolicy: { policy: "cross-origin" }
  })
);

// CORS (temporary wildcard for development)
app.use(cors({
  origin: "*"
}));

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
app.use("/api/v1/downloads", downloadLogsRouter);

// Test
app.get("/", (req, res) => {
  res.json({ message: "Bubbistix API is running" });
});

export default app;