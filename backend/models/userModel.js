import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },
    password: String,
    role: {
      type: String,
      enum: ["admin", "instructor", "student"],
      default: "student"
    }
  },
  { timestamps: true }
);

const userModel = mongoose.models.User || mongoose.model("User", UserSchema);

export default userModel;
