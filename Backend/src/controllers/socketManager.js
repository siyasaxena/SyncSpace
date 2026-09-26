import { Server } from "socket.io";

const messages = {};
const timeOnline = {};

const connectToSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      allowedHeaders: ["*"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    socket.on("join-call", (path) => {
      // 1. Join  .io room natively
      socket.join(path);
      socket.data.room = path; // Store path directly on the socket
      timeOnline[socket.id] = new Date();

      // 2. Broadcast to everyone in the room (including sender)
      io.to(path).emit("user-joined", socket.id);

      // 3. Send message history to the newly joined user
      if (messages[path]) {
        messages[path].forEach((msg) => {
          socket.emit(
            "chat-message",
            msg.data,
            msg.sender,
            msg["socket-id-sender"],
          );
        });
      }
    });

    socket.on("signal", (toId, message) => {
      io.to(toId).emit("signal", socket.id, message);
    });

    socket.on("chat-message", (data, sender) => {
      const room = socket.data.room;

      if (room) {
        if (!messages[room]) {
          messages[room] = [];
        }

        messages[room].push({
          sender: sender,
          data: data,
          "socket-id-sender": socket.id,
        });

        console.log("message", room, ":", sender, data);

        // Broadcast to all clients in the room
        io.to(room).emit("chat-message", data, sender, socket.id);
      }
    });

    socket.on("disconnect", () => {
      const room = socket.data.room;
      const connectedTime = timeOnline[socket.id];

      if (connectedTime) {
        const diffTime = Math.abs(new Date() - connectedTime);
        delete timeOnline[socket.id];
      }

      if (room) {
        // Notify others in the room that this user left
        io.to(room).emit("user-left", socket.id);
      }
    });
  });

  return io; // Correctly returns the initialized Socket.io instance
};

export default connectToSocket;
