import express from "express";
import { createReport, deleteReportedMessage, getReports, removeReportedUser, warnReportedUser } from "../controllers/reportController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, createReport);
router.get("/", authMiddleware, getReports);
router.delete(
  "/:reportId/message",
  authMiddleware,
  deleteReportedMessage
);

router.delete(
  "/:reportId/user",
  authMiddleware,
  removeReportedUser
);
router.post("/:reportId/warn", authMiddleware, warnReportedUser);

export default router;
