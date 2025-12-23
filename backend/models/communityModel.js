import mongoose from "mongoose";

const communitySchema = new mongoose.Schema(
  {
    name: String,
    description: String,
    admins: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
  },
  { timestamps: true }
);

const communityModel = mongoose.models.Community || mongoose.model("Community", communitySchema);

export default communityModel;
