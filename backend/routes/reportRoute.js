import express from "express";
import { createReport, deleteReportedMessage, getReports, removeReportedUser } from "../controllers/reportController.js";
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
export default router;
