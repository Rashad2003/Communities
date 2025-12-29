import Report from "../models/reportModel.js";
import Message from "../models/messageModel.js";
import { getIO } from "../socket.js";
import reportModel from "../models/reportModel.js";
import messageModel from "../models/messageModel.js";
import groupModel from "../models/groupModel.js";

export const createReport = async (req, res) => {
  const { messageId, reason } = req.body;

  const message = await Message.findById(messageId);

  if (!message) {
    return res.status(404).json({ message: "Message not found" });
  }

  const report = await Report.create({
    message: messageId,
    reportedUser: message.sender,
    reportedBy: req.user.id,
    group: message.groupId,
    reason
  });

  // 🔥 notify admins in realtime
  const io = getIO();
  io.to(message.groupId.toString()).emit("newReport", {
    reportId: report._id
  });

  res.json({ success: true });
};

export const getReports = async (req, res) => {
  const reports = await Report.find()
    .populate("message")
    .populate("reportedUser", "name email")
    .populate("reportedBy", "name email")
    .populate("group", "name");
    res.json(reports);
};

export const deleteReportedMessage = async (req, res) => {
  const { reportId } = req.params;

  const report = await Report.findById(reportId);

  if (!report) {
    return res.status(404).json({ message: "Report not found" });
  }

  const messageId = report.message; // 👈 ObjectId
  const groupId = report.group;

  if (messageId) {
    await Message.findByIdAndDelete(messageId);

    // 🔥 realtime update
    const io = getIO();
    io.to(groupId.toString()).emit("messageDeleted", {
      messageId: messageId.toString()
    });
  }

  // 🔥 DELETE REPORT FROM DB
  await Report.findByIdAndDelete(reportId);

  res.json({ success: true });
};

export const removeReportedUser = async (req, res) => {
  const { reportId } = req.params;

  const report = await Report.findById(reportId);

  if (!report) {
    return res.status(404).json({ message: "Report not found" });
  }

  const group = await groupModel.findById(report.group);

  if (group) {
    const userId = report.reportedUser.toString();

    group.members = group.members.filter(
      m => m.toString() !== userId
    );

    await group.save();

    const io = getIO();

    // realtime update
    io.to(group._id.toString()).emit("memberRemoved", {
      groupId: group._id.toString(),
      userId
    });

    // notify user
    io.to(userId).emit("kickedNotification", {
      message: `You were removed from ${group.name} by admin`
    });
  }

  // 🔥 DELETE REPORT COMPLETELY
  await Report.findByIdAndDelete(reportId);

  res.json({ success: true });
};