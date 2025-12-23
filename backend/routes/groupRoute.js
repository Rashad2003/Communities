import express from "express";
import { addMember, createGroups, deleteGroup, getGroups, approvedMember, rejectRequest } from "../controllers/groupController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import roleMiddleware from "../middlewares/roleMiddleware.js";

const router = express.Router();

// Create group
router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin", "instructor"),
  createGroups
  );

// Get all groups
router.get("/", authMiddleware, getGroups);

router.post("/:groupId/request", authMiddleware, addMember)

router.post("/:groupId/approve", authMiddleware, approvedMember)

router.post(
  "/:groupId/reject",
  authMiddleware,
  rejectRequest
);


router.put("/:groupId/remove-member", authMiddleware, deleteGroup)

router.delete(
  "/:groupId",
  authMiddleware,
  deleteGroup
);


export default router;
