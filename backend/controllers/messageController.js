import messageModel from "../models/messageModel.js";
import groupModel from "../models/groupModel.js";
import { getIO } from "../socket.js";

export const getMessage = async (req, res) => {
  const messages = await messageModel.find({
    groupId: req.params.groupId,
    parentId: null // Only fetch top-level messages
  }).populate("sender", "name");

  res.json(messages);
};

export const getThreadMessages = async (req, res) => {
  const messages = await messageModel.find({
    parentId: req.params.parentId
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
    } else if (req.body.type === "poll") {
      finalType = "poll";
      finalContent = "📊 Poll";
    } else if (req.body.type === "event") {
      finalType = "event";
      finalContent = "📅 Event";
    } else {
      finalType = "text";
      finalContent = req.body.content;
    }

    const messageData = {
      groupId,
      sender: req.user.id,
      type: finalType,
      content: finalContent,
      parentId: req.body.parentId || null,
      mentions: req.body.mentions || []
    };

    if (finalType === "poll") {
      messageData.pollData = JSON.parse(req.body.pollData);
    } else if (finalType === "event") {
      messageData.eventData = JSON.parse(req.body.eventData);
    }

    const message = await messageModel.create(messageData);

    if (req.body.parentId) {
      await messageModel.findByIdAndUpdate(req.body.parentId, {
        $inc: { replyCount: 1 }
      });
    }

    // 🔥 EMIT REAL-TIME
    const io = getIO();
    io.to(groupId).emit("newMessage", {
      ...message.toObject(),
      sender: { _id: req.user.id, name: req.user.name }
    });

    res.json(message);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "File send failed" });
  }
};


export const votePoll = async (req, res) => {
  const { messageId, optionIndex } = req.body;
  const userId = req.user.id;

  const message = await messageModel.findById(messageId);
  if (!message || message.type !== "poll") return res.status(404).json({ message: "Poll not found" });

  const poll = message.pollData;
  const option = poll.options[optionIndex];

  // Check if already voted
  const alreadyVotedIndex = poll.options.findIndex(opt => opt.votes.includes(userId));

  if (alreadyVotedIndex !== -1) {
    // Remove previous vote
    poll.options[alreadyVotedIndex].votes.pull(userId);
  }

  // Toggle vote if clicking same option, else add vote
  if (alreadyVotedIndex !== optionIndex) {
    option.votes.push(userId);
  }

  await message.save();

  const io = getIO();
  io.to(message.groupId.toString()).emit("pollUpdated", {
    messageId: message._id,
    pollData: message.pollData
  });

  res.json(message);
};

export const joinEvent = async (req, res) => {
  const { messageId } = req.body;
  const userId = req.user.id;

  const message = await messageModel.findById(messageId);
  if (!message || message.type !== "event") return res.status(404).json({ message: "Event not found" });

  const attendees = message.eventData.attendees;
  const isAttending = attendees.includes(userId);

  if (isAttending) {
    attendees.pull(userId);
  } else {
    attendees.push(userId);
  }

  await message.save();

  const io = getIO();
  io.to(message.groupId.toString()).emit("eventUpdated", {
    messageId: message._id,
    eventData: message.eventData
  });

  res.json(message);
};

export const reactToMessage = async (req, res) => {
  const { messageId, emoji } = req.body;
  const userId = req.user.id;

  console.log(`[REACT] User: ${userId} Message: ${messageId} Emoji: ${emoji}`);

  const message = await messageModel.findById(messageId);
  if (!message) return res.status(404).json({ message: "Message not found" });

  console.log(`[REACT] Current Reactions:`, message.reactions);

  // 1. Find existing reaction from this user
  const existingReaction = message.reactions.find(r => r.user.toString() === userId);
  console.log(`[REACT] Existing Reaction:`, existingReaction);

  // 2. Remove ANY reaction from this user
  const initialLength = message.reactions.length;
  message.reactions = message.reactions.filter(r => r.user.toString() !== userId);
  console.log(`[REACT] Reactions after filter:`, message.reactions.length);

  // 3. If they clicked a DIFFERENT emoji (or didn't have one), add the new one.
  //    If they clicked the SAME emoji, we do nothing (so it remains removed -> toggle off).
  if (!existingReaction || existingReaction.emoji !== emoji) {
    console.log(`[REACT] Adding new reaction: ${emoji}`);
    message.reactions.push({ emoji, user: userId });
  } else {
    console.log(`[REACT] Toggled off (same emoji)`);
  }

  await message.save();

  const io = getIO();
  io.to(message.groupId.toString()).emit("reactionUpdated", {
    messageId: message._id,
    reactions: message.reactions
  });

  res.json(message);
};

export const removeReaction = async (req, res) => {
  const { messageId, emoji } = req.body;
  const userId = req.user.id;

  console.log(`[REMOVE] User: ${userId} Message: ${messageId} Emoji: ${emoji}`);

  const message = await messageModel.findByIdAndUpdate(
    messageId,
    {
      $pull: { reactions: { user: userId, emoji: emoji } }
    },
    { new: true } // Return the updated document
  );

  if (!message) return res.status(404).json({ message: "Message not found" });

  console.log(`[REMOVE] Left reactions:`, message.reactions.length);

  const io = getIO();
  io.to(message.groupId.toString()).emit("reactionUpdated", {
    messageId: message._id,
    reactions: message.reactions
  });

  res.json(message);
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

  // const isAdmin = group.admins.includes(req.user.id);
  // const isSender = message.sender.toString() === req.user.id;

  // if (!isAdmin && !isSender) {
  //   return res.status(403).json({ message: "Not allowed" });
  // }

  if (message.parentId) {
    await messageModel.findByIdAndUpdate(message.parentId, {
      $inc: { replyCount: -1 }
    });
  }

  await message.deleteOne();

  const io = getIO();
  io.to(group._id.toString()).emit("messageDeleted", {
    messageId: message._id,
    parentId: message.parentId
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

export const getGroupResources = async (req, res) => {
  const { groupId } = req.params;

  const resources = await messageModel.find({
    groupId,
    type: { $in: ["image", "file"] }
  })
    .sort({ createdAt: -1 })
    .populate("sender", "name");

  res.json(resources);
};
