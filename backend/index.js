import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoute.js";
import groupRoutes from "./routes/groupRoute.js";
import communityRoutes from "./routes/communityRoute.js";
import messageRoutes from "./routes/messageRoute.js";
import { connectDB } from "./config/db.js";
import http from "http";
import { initSocket } from "./socket.js";
import path from "path";

dotenv.config();

const app = express();
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/messages", messageRoutes);
app.use("/uploads", express.static("uploads"));


// 🔥 CREATE HTTP SERVER
const server = http.createServer(app);

// 🔥 INIT SOCKET.IO HERE
initSocket(server);

app.get('/', (req, res) => res.send('API is running...'));

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log("server is running on PORT:" + PORT);
    connectDB();
  });