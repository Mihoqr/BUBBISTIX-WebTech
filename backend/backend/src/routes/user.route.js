import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import { registerUser,
         loginUser,
         googleAuth,
         logoutUser,
         getMe,
         resetPassword
 } from "../controllers/user.controller.js";

const router = Router();

// User authentication routes
router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.post("/googleAuth", googleAuth);
router.post("/logout", authMiddleware, logoutUser);
router.get("/getMe", authMiddleware, getMe);
router.route("/resetPassword").post(resetPassword);

export default router;