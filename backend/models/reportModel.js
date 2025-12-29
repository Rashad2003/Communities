import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    message: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      required: true
    },

    reportedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true
    },

    reason: {
      type: String,
      enum: ["abuse", "spam", "inappropriate", "harassment", "other"],
      required: true
    },

    status: {
      type: String,
      enum: ["pending", "reviewed", "action_taken"],
      default: "pending"
    }
  },
  { timestamps: true }
);

export default mongoose.model("Report", reportSchema);
