import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🔥 FETCH FULL USER
    const user = await User.findById(decoded.id).select("_id name");

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // 🔥 ATTACH FULL USER
    req.user = {
      id: user._id,
      name: user.name
    };

    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
};

export default authMiddleware;
