import messageModel from "../models/messageModel.js";
import groupModel from "../models/groupModel.js";
import { getIO } from "../socket.js";

export const getMessage = async (req, res) => {
    const messages = await messageModel.find({
    groupId: req.params.groupId
  }).populate("sender", "name");

  res.json(messages);
};

export const sendMessage = async (req, res) => {
  try {
    console.log("BODY:", req.body);
    console.log("FILE:", req.file);

    const groupId = req.body.groupId;
    if (!groupId) {
      return res.status(400).json({ message: "groupId missing" });
    }

    const group = await groupModel.findById(groupId);

    let finalType = "text";
    let finalContent = "";

    if (req.file) {
      finalType = req.file.mimetype.startsWith("image")
        ? "image"
        : "file";
      finalContent = `/uploads/${req.file.filename}`;
    } else {
      finalType = "text";
      finalContent = req.body.content;
    }

    const message = await messageModel.create({
      groupId,
      sender: req.user.id,
      type: finalType,
      content: finalContent
    });

    // 🔥 EMIT REAL-TIME
    const io = getIO();
    io.to(groupId).emit("newMessage", {
      _id: message._id,
      groupId,
      sender: { _id: req.user.id, name: req.user.name },
      type: finalType,
      content: finalContent,
      createdAt: message.createdAt
    });

    res.json(message);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "File send failed" });
  }
};


export const files = async (req, res) => {
  const { groupId, type, content } = req.body;
  const group = await groupModel.findById(groupId);

  // permission check (same as before)
  if (group.isAnnouncement && !group.admins.includes(req.user.id)) {
    return res.status(403).json({ message: "Admins only" });
  }
  if (!group.isAnnouncement && !group.members.includes(req.user.id)) {
    return res.status(403).json({ message: "Not a member" });
  }

  let finalContent = content;
  let finalType = type || "text";

if (req.file) {
      finalType = req.file.mimetype.startsWith("image")
        ? "image"
        : "file";

      finalContent = `/uploads/${req.file.filename}`;
    } 
    // 📝 TEXT MESSAGE
    else {
      finalType = "text";
      finalContent = req.body.content;
    }

  const message = await messageModel.create({
    groupId,
    sender: req.user.id,
    type: finalType,
    content: finalContent
  });

  res.json(message);
}

export const pinMessage = async (req, res) => {
  const { messageId } = req.params;
  const message = await messageModel.findById(messageId);
  const group = await groupModel.findById(message.groupId);

  // 🔐 only admin
  if (!group.admins.includes(req.user.id)) {
    return res.status(403).json({ message: "Admin only" });
  }

  // ❌ unpin all previous pinned messages in group
  await messageModel.updateMany(
    { groupId: message.groupId },
    { isPinned: false }
  );

  // 📌 pin selected message
  message.isPinned = true;
  await message.save();

  res.json(message);
};

export const getPinnedMessage = async (req, res) => {
  const pinned = await messageModel.findOne({
    groupId: req.params.groupId,
    isPinned: true
  }).populate("sender", "name");

  res.json(pinned);
};

export const togglePinMessage = async (req, res) => {
  const { messageId } = req.params;

  const message = await messageModel.findById(messageId);
  if (!message) {
    return res.status(404).json({ message: "Message not found" });
  }

  const group = await groupModel.findById(message.groupId);

  // 🔐 Admin only
  if (!group.admins.includes(req.user.id)) {
    return res.status(403).json({ message: "Admin only" });
  }

  const newPinState = !message.isPinned;

  // if pinning → unpin others in group
  if (newPinState) {
    await messageModel.updateMany(
      { groupId: message.groupId },
      { isPinned: false }
    );
  }

  message.isPinned = newPinState;
  await message.save();

  const updatedMessage = await messageModel
    .findById(message._id)
    .populate("sender", "name");

  const io = getIO();
  io.to(message.groupId.toString()).emit("pinUpdated", {
    groupId: message.groupId.toString(),
    pinnedMessage: newPinState ? updatedMessage : null
  });
};

export const deleteMessage = async (req, res) => {
  const message = await messageModel.findById(req.params.messageId);
  const group = await groupModel.findById(message.groupId);

  const isAdmin = group.admins.includes(req.user.id);
  const isSender = message.sender.toString() === req.user.id;

  if (!isAdmin && !isSender) {
    return res.status(403).json({ message: "Not allowed" });
  }

  await message.deleteOne();

  const io = getIO();
  io.to(group._id.toString()).emit("messageDeleted", {
    messageId: message._id
  });

  res.json({ success: true });
};

export const clearGroupMessages = async (req, res) => {
  const { groupId } = req.params;

  // const group = await groupModel.findById(groupId);
  // if (!group.admins.includes(req.user.id)) {
  //   return res.status(403).json({ message: "Admin only" });
  // }

  await messageModel.deleteMany({ groupId });

  const io = getIO();
  io.to(groupId).emit("chatCleared");

  res.json({ success: true });
};
