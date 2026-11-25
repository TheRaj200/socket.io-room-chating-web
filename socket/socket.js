import { Server } from "socket.io";

const normalizeText = (value) => {
  if (typeof value !== "string") return "";
  return value.trim();
};

export const setupSocket = (httpServer) => {
  const io = new Server(httpServer);
  const activeUsers = new Map();
  const guestName = (socket) => `Guest ${socket.id.slice(0, 4)}`;
  const broadcastActiveUsers = () => {
    io.emit("active-users", Array.from(activeUsers.values()));
  };

  io.on("connection", (socket) => {
    console.log("A user connected", socket.id);
    activeUsers.set(socket.id, guestName(socket));
    broadcastActiveUsers();

    socket.on("set-username", (value) => {
      const username = normalizeText(value);
      if (username.length > 32) {
        socket.emit("chat-error", "Names can be up to 32 characters.");
        return;
      }

      const activeName = username || guestName(socket);
      if (activeUsers.get(socket.id) === activeName) return;

      activeUsers.set(socket.id, activeName);
      broadcastActiveUsers();
    });

    socket.on("send-message", (payload) => {
      const data = payload && typeof payload === "object" ? payload : {};
      const message = normalizeText(data.message);

      if (!message || message.length > 1000) {
        socket.emit("chat-error", "Messages must be between 1 and 1000 characters.");
        return;
      }

      socket.broadcast.emit("Message received:", {
        username: activeUsers.get(socket.id),
        message,
      });
    });

    socket.on("room-message", (payload) => {
      const data = payload && typeof payload === "object" ? payload : {};
      const room = normalizeText(data.room);
      const message = normalizeText(data.message);

      if (
        !room ||
        room.length > 64 ||
        !message ||
        message.length > 1000
      ) {
        socket.emit(
          "chat-error",
          "Choose a room (up to 64 characters) and write a message (up to 1000 characters)."
        );
        return;
      }

      if (!socket.rooms.has(room)) {
        socket.emit("chat-error", "Join this room before sending a room message.");
        return;
      }

      socket.to(room).emit("room-message", {
        username: activeUsers.get(socket.id),
        message,
      });
    });

    socket.on("join-room", (room) => {
      const roomName = normalizeText(room);
      if (!roomName || roomName.length > 64) {
        socket.emit(
          "chat-error",
          "Room names must be between 1 and 64 characters."
        );
        return;
      }

      socket.join(roomName);
      console.log(`User ${socket.id} joined room ${roomName}`);
    });

    socket.on("leave-room", (room) => {
      const roomName = normalizeText(room);
      if (!roomName || roomName.length > 64) {
        socket.emit(
          "chat-error",
          "Room names must be between 1 and 64 characters."
        );
        return;
      }

      socket.leave(roomName);
      console.log(`User ${socket.id} left room ${roomName}`);
    });

    socket.on("disconnect", () => {
      activeUsers.delete(socket.id);
      broadcastActiveUsers();
      console.log("A user disconnected", socket.id);
    });
  });
};