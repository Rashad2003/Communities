import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Group" },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    type: {
      type: String,
      enum: ["text", "image", "file", "emoji", "poll", "event"],
      default: "text"
    },

    content: String, // text OR file URL

    // 📊 POLL DATA
    pollData: {
      question: String,
      options: [
        {
          text: String,
          votes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
        }
      ],
      allowMultiple: { type: Boolean, default: false }
    },

    // 📅 EVENT DATA
    eventData: {
      title: String,
      description: String,
      date: Date,
      location: String,
      attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
    },

    // 👍 REACTIONS
    reactions: [
      {
        emoji: String,
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
      }
    ],

    // @ MENTIONS
    mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    isPinned: { type: Boolean, default: false },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: "Message", default: null }, // for threading
    replyCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

const messageModel = mongoose.models.Message || mongoose.model("Message", messageSchema);

export default messageModel;
