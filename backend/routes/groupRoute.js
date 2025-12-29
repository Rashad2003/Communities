import express from "express";
import { addMember, createGroups, deleteGroup, getGroups, approvedMember, rejectRequest, removeMember, addingMember } from "../controllers/groupController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

// Create group
router.post(
  "/",
  authMiddleware,
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

router.post(
  "/:groupId/remove/:userId",
  authMiddleware,
  removeMember
);

router.post(
  "/:groupId/add/:userId",
  authMiddleware,
  addingMember
);


export default router;
