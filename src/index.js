const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const Filter = require("bad-words");
const {
  generateMessage,
  generateLocationMessage
} = require("./utils/messages");
const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom
} = require("./utils/users");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, "../public");

app.use(express.static(publicDirectoryPath));

io.on("connection", socket => {
  console.log("New WebSocket connection");

  socket.on("join", (userData, callback) => {
    const { error, user } = addUser(
      socket.id,
      userData.username,
      userData.room
    );

    if (error) {
      return callback(error);
    }

    const { username, room } = user;
    socket.join(room);

    socket.emit("message", generateMessage("Welcome!", "admin"));
    socket.broadcast
      .to(room)
      .emit("message", generateMessage(`${username} has joined!`, "admin"));
    io.to(room).emit("roomData", {
      room,
      users: getUsersInRoom(room)
    });

    callback();
  });

  socket.on("sendMessage", (msg, callback) => {
    const filter = new Filter();
    if (filter.isProfane(msg)) {
      return callback("Profanity is not allowed!");
    }

    const user = getUser(socket.id);
    if (!user) {
      return callback("User does not exist");
    }

    const { username, room } = user;
    io.to(room).emit("message", generateMessage(msg, username));
    callback();
  });

  socket.on("sendLocation", ({ latitude, longitude }, callback) => {
    const user = getUser(socket.id);
    if (!user) {
      return callback("User does not exist");
    }

    const { username, room } = user;
    io.to(room).emit(
      "locationMessage",
      generateLocationMessage(latitude, longitude, username)
    );
    callback();
  });

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);

    if (user) {
      const { username, room } = user;
      io.to(room).emit(
        "message",
        generateMessage(`${username} has left!`, "admin")
      );
      io.to(room).emit("roomData", {
        room,
        users: getUsersInRoom(room)
      });
    }
  });
});

server.listen(port, () => {
  console.log(`Server is up on port ${port}`);
});
