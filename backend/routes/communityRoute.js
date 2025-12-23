import express from "express";
import { createCommunity, getCommunity } from "../controllers/communityController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

// Create SINGLE community (Admin only)
router.post("/", authMiddleware, createCommunity);

// Get community (member only)
router.get("/", authMiddleware, getCommunity);

export default router;
