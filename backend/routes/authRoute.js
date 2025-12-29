import express from "express";
import { loginUser, registerUser, getAllUsers } from "../controllers/userController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

// Register
router.post("/register", registerUser);

// Login
router.post("/login", loginUser);

router.get("/", authMiddleware, getAllUsers);

export default router;
