import { Server } from "socket.io";

let io;

export const initSocket = server => {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  io.on("connection", socket => {
    console.log("User connected:", socket.id);

    socket.on("joinGroup", groupId => {
      console.log("🟢 Joined room:", groupId);
      socket.join(groupId);
    });

    socket.on("leaveGroup", groupId => {
    socket.leave(groupId);
  });

    socket.on("joinUser", userId => {
      socket.join(userId);
      console.log("👤 User joined personal room:", userId);
    });

    socket.on("typing", ({ groupId, user }) => {
      socket.to(groupId).emit("typing", user);
    });

    socket.on("stopTyping", ({ groupId }) => {
      socket.to(groupId).emit("stopTyping");
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};
