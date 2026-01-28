import { Router } from "express";
import mockAuth from "../middleware/mockAuth.js";
import { registerUser,
         loginUser,
         logoutUser,
         getMe
 } from "../controllers/user.controller.js";

const router = Router();

// User authentication routes
router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/logout").post(logoutUser);
router.get("/getMe", mockAuth, getMe);

export default router;