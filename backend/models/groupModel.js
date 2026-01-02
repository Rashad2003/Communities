import mongoose from "mongoose";

const GroupSchema = new mongoose.Schema(
  {
    name: String,
    description: String,
    isAnnouncement: { type: Boolean, default: false },
    admins: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    pendingRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
  },
  { timestamps: true }
);

const groupModel = mongoose.models.Group || mongoose.model("Group", GroupSchema);

export default groupModel;
