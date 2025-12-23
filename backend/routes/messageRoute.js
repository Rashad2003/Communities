import express from "express";
import { clearGroupMessages, deleteMessage, getMessage, getPinnedMessage, pinMessage, sendMessage, togglePinMessage } from "../controllers/messageController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import upload from "../middlewares/upload.js";

const router = express.Router();

// Get messages (member only)
router.get("/:groupId", authMiddleware, getMessage);

// Send message
router.post("/", authMiddleware, upload.single("file"), sendMessage);

router.post(
  "/pin/:messageId",
  authMiddleware,
  pinMessage
);

router.get(
  "/pinned/:groupId",
  authMiddleware,
  getPinnedMessage
);

router.post(
  "/pin/:messageId",
  authMiddleware,
  togglePinMessage
);

router.delete(
  "/:messageId",
  authMiddleware,
  deleteMessage
);

router.delete(
  "/clear/:groupId",
  authMiddleware,
  clearGroupMessages
);



export default router;
