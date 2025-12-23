import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";

export const registerUser = async (req, res) => {
    const { name, email, password, role } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    const user = await userModel.create({
      name,
      email,
      password: hashed,
      role
    });
    res.json(user);
}

export const loginUser = async (req, res) => {
    const { email, password } = req.body;

    const user = await userModel.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "User not found" });
  
    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(400).json({ message: "Wrong password" });
  
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );
  
    res.json({ token, user });
}