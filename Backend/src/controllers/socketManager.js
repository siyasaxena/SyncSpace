import { Server } from "socket.io";

const connections = {};
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
    console.log("Something connected:", socket.id);

    socket.on("join-call", (path) => {
      // 1. Initialize room arrays if they don't exist
      if (connections[path] === undefined) {
        connections[path] = [];
      }

      // Add socket ID to room list
      connections[path].push(socket.id);
      socket.data.room = path;
      timeOnline[socket.id] = new Date();

      // 2. Broadcast user-joined event with BOTH required parameters: (id, clientsArray)
      for (let a = 0; a < connections[path].length; a++) {
        io.to(connections[path][a]).emit(
          "user-joined",
          socket.id,
          connections[path],
        );
      }

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

        console.log("Message in", room, ":", sender, data);

        // Broadcast chat message to all clients in the room
        for (let a = 0; a < connections[room].length; a++) {
          io.to(connections[room][a]).emit(
            "chat-message",
            data,
            sender,
            socket.id,
          );
        }
      }
    });

    socket.on("disconnect", () => {
      const room = socket.data.room;

      if (timeOnline[socket.id]) {
        delete timeOnline[socket.id];
      }

      if (room && connections[room]) {
        // Remove user from connections array
        connections[room] = connections[room].filter((id) => id !== socket.id);

        // Notify remaining users in the room
        connections[room].forEach((id) => {
          io.to(id).emit("user-left", socket.id);
        });

        // Clean up empty room history if needed
        if (connections[room].length === 0) {
          delete connections[room];
        }
      }
    });
  });

  return io;
};

export default connectToSocket;
