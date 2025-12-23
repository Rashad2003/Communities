import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Group" },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    type: {
      type: String,
      enum: ["text", "image", "file", "emoji"],
      default: "text"
    },

    content: String, // text OR file URL
    
    isPinned: { type: Boolean, default: false }
  },
  { timestamps: true }
);

const messageModel = mongoose.models.Message || mongoose.model("Message", messageSchema);

export default messageModel;
