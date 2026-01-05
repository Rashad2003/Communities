import groupModel from "../models/groupModel.js";
import communityModel from "../models/communityModel.js";
import messageModel from "../models/messageModel.js";
import userModel from "../models/userModel.js";
import { getIO } from "../socket.js";

/* ==============================
   CREATE SUB GROUP (ADMIN ONLY)
================================ */
export const createGroups = async (req, res) => {
  const { name, description } = req.body;

  const community = await communityModel.findOne();
  if (!community) {
    return res.status(400).json({ message: "Community not found" });
  }

  // ✅ ONLY COMMUNITY ADMIN
  if (!community.admins.includes(req.user.id)) {
    return res.status(403).json({ message: "Admin only" });
  }

  const group = await groupModel.create({
    name,
    description,
    isAnnouncement: false,
    admins: [req.user.id],
    members: [req.user.id],       // 🔥 ADMIN ALWAYS MEMBER
    pendingRequests: []            // 🔥 MUST EXIST
  });

  // 🔥 emit real-time event with POPULATED data (so frontend sees objects)
  const populatedGroup = await groupModel.findById(group._id)
    .populate("admins", "name email")
    .populate("members", "name email");

  const io = getIO();
  io.emit("groupCreateds", group);
  io.emit("groupCreated", populatedGroup);

  res.json(group);
};

/* ==============================
   GET GROUPS
================================ */
export const getGroups = async (req, res) => {
  const community = await communityModel.findOne();
  if (!community) {
    return res.status(400).json({
      message: "Community not created yet"
    });
  }

  const groups = await groupModel.find()
    .populate("admins", "_id name")
    .populate("members", "_id name")
    .populate("pendingRequests", "_id name");

  // Calculate unread counts
  const groupsWithCount = await Promise.all(groups.map(async (group) => {
    let unreadCount = 0;
    const userId = String(req.user.id).trim();
    const isMember = group.members.some(m => String(m._id).trim() === userId) ||
      group.admins.some(a => String(a._id).trim() === userId);

    if (isMember) {
      const lastRead = group.lastRead?.get(req.user.id) || new Date(0); // Default to epoch if never read
      unreadCount = await messageModel.countDocuments({
        groupId: group._id,
        sender: { $ne: req.user.id }, // Exclude own messages
        createdAt: { $gt: lastRead }
      });
      console.log(`[GET_GROUPS] Group: ${group.name} | User: ${req.user.id} | LastRead: ${lastRead} | Unread: ${unreadCount}`);
    }
    return {
      _id: group._id,
      name: group.name,
      description: group.description,
      isAnnouncement: group.isAnnouncement,
      admins: group.admins,
      members: group.members,
      pendingRequests: group.pendingRequests,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
      lastRead: group.lastRead, // Optional, but might be useful debugging
      unreadCount: unreadCount
    };
  }));

  res.json(groupsWithCount);
};

/* ==============================
   MEMBER REQUEST TO JOIN
================================ */
export const addMember = async (req, res) => {
  const group = await groupModel.findById(req.params.groupId);

  if (!group) {
    return res.status(404).json({ message: "Group not found" });
  }

  if (group.isAnnouncement) {
    return res.status(400).json({ message: "No join needed" });
  }

  // ❌ Already member
  if (group.members.includes(req.user.id)) {
    return res.status(400).json({ message: "Already a member" });
  }

  // ✅ Add to pending
  if (!group.pendingRequests.includes(req.user.id)) {
    group.pendingRequests.push(req.user.id);
    await group.save();
  }

  // 🔥 SOCKET EVENT
  const io = getIO();
  // 🔥 notify ADMINS (ObjectId → room)
  group.admins.forEach(adminId => {
    io.to(adminId.toString()).emit("joinRequested", {
      groupId: group._id.toString(),
      user: {
        _id: req.user.id,
        name: req.user.name
      }
    });
  });

  // 🔥 notify REQUESTING USER
  io.to(req.user.id).emit("joinPending", {
    groupId: group._id.toString(),
    user: {
      _id: req.user.id,
      name: req.user.name
    }
  });

  res.json({ message: "Join request sent" });
};

/* ==============================
   ADMIN APPROVE MEMBER
================================ */
export const approvedMember = async (req, res) => {
  const { userId } = req.body;
  const group = await groupModel.findById(req.params.groupId);

  if (!group) {
    return res.status(404).json({ message: "Group not found" });
  }

  const user = await userModel.findById(userId).select("_id name email");
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // ✅ Remove from pending
  group.pendingRequests = group.pendingRequests.filter(
    id => id.toString() !== userId
  );

  // ✅ Add to members (only once)
  if (!group.members.some(m => m.toString() === userId)) {
    group.members.push(userId);
  }
  await group.save();
  const io = getIO();
  // 🔥 1️⃣ notify APPROVED USER (REAL TIME)
  io.to(userId.toString()).emit("requestApproved", {
    groupId: group._id.toString(),
    user,
    groupName: group.name
  });

  // 🔥 2️⃣ notify ADMINS (REAL TIME)
  group.admins.forEach(adminId => {
    io.to(adminId.toString()).emit("requestApproved", {
      groupId: group._id.toString(),
      user,
      groupName: group.name
    });
  });

  res.json({ message: "User approved" });
};

/* ==============================
   DELETE GROUP (ADMIN)
================================ */
export const deleteGroup = async (req, res) => {
  const { groupId } = req.params;

  const group = await groupModel.findById(groupId);
  if (!group) {
    return res.status(404).json({ message: "Group not found" });
  }

  await messageModel.deleteMany({ groupId });
  await group.deleteOne();

  const io = getIO();
  io.emit("groupDeleted", {
    groupId: group._id.toString()
  });

  console.log("🔥 EMITTING groupDeleted:", group._id.toString());

  res.json({ success: true });
};


export const rejectRequest = async (req, res) => {
  const { userId } = req.body;

  const group = await groupModel.findById(req.params.groupId);

  if (!group) {
    return res.status(404).json({ message: "Group not found" });
  }

  // remove from pending
  group.pendingRequests = group.pendingRequests.filter(
    id => id.toString() !== userId
  );

  await group.save();

  // 🔥 REAL-TIME EMIT (THIS WAS MISSING)
  const io = getIO();
  io.emit("requestRejected", {
    groupId: group._id.toString(),
    userId,
    groupName: group.name
  });

  res.json({ success: true });
};

export const removeMember = async (req, res) => {
  const { groupId, userId } = req.params;
  const adminId = req.user.id;

  const group = await groupModel.findById(groupId);

  if (!group) {
    return res.status(404).json({ message: "Group not found" });
  }

  // 🔒 only admin can remove
  const isAdmin = group.admins.some(
    a => a.toString() === adminId.toString()
  );

  if (!isAdmin) {
    return res.status(403).json({ message: "Not authorized" });
  }

  // 🚫 cannot remove another admin (optional rule)
  if (group.admins.includes(userId)) {
    return res.status(400).json({ message: "Cannot remove admin" });
  }

  // remove member
  group.members = group.members.filter(
    m => m.toString() !== userId
  );

  await group.save();

  // 🔥 realtime update
  const io = getIO();
  io.to(group._id.toString()).emit("memberRemoved", {
    groupId: group._id.toString(),
    userId: userId.toString()
  });

  // Also notify the specific user directly (in case they aren't in the group room)
  io.to(userId.toString()).emit("memberRemoved", {
    groupId: group._id.toString(),
    userId: userId.toString()
  });

  io.to(userId.toString()).emit("kickedNotification", {
    message: `You were removed from ${group.name} Group by Admin`
  });


  res.json({ success: true });
};


export const addingMember = async (req, res) => {
  const { groupId, userId } = req.params;
  const adminId = req.user.id;

  const group = await groupModel.findById(groupId);

  if (!group) {
    return res.status(404).json({ message: "Group not found" });
  }

  // only admin can add
  const isAdmin = group.admins.some(
    a => a.toString() === adminId.toString()
  );

  if (!isAdmin) {
    return res.status(403).json({ message: "Not authorized" });
  }

  const user = await userModel
    .findById(userId)
    .select("_id name");

  // already member
  if (group.members.includes(userId)) {
    return res.status(400).json({ message: "User already a member" });
  }

  group.members.push(userId);
  await group.save();

  // 🔥 realtime update
  const io = getIO();

  // Notify group
  io.to(groupId.toString()).emit("memberAdded", {
    groupId: groupId.toString(),
    user
  });

  // Notify the user directly (in case they aren't in the group room)
  io.to(userId.toString()).emit("memberAdded", {
    groupId: groupId.toString(),
    user
  });

  res.json({ success: true });
};

/* ==============================
   MARK GROUP AS READ
================================ */
export const markGroupRead = async (req, res) => {
  const { groupId } = req.params;
  const userId = req.user.id;

  const group = await groupModel.findById(groupId);
  if (!group) {
    return res.status(404).json({ message: "Group not found" });
  }

  // Initialize map if it doesn't exist (handled by default map but good safety)
  if (!group.lastRead) {
    group.lastRead = new Map();
  }

  group.lastRead.set(userId, new Date());
  await group.save();

  res.json({ success: true });
};
