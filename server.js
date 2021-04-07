const express = require("express");
const app = require("express")();
const httpServer = require("http").createServer(app);
const io = require("socket.io")(httpServer);
const PORT = 3000;
const gameSockets = {};
const controllerSockets = {};

app.use("/", express.static(__dirname + "/public"));

httpServer.listen(process.env.PORT || PORT);

io.on("connection", (socket) => {
  console.log(`Connected to Browser on ${socket.id}`);

  socket.on("game connect", () => {
    console.log(`Game Connected on ${socket.id}`);

    gameSockets[socket.id] = {
      socket: socket,
      controllerId: undefined,
    };
    socket.emit("game connected");
  });
  socket.on("controller connect", (gameSocketId) => {
    if (gameSockets[gameSocketId]) {
      console.log(`Controller Connected on ${socket.id}`);

      controllerSockets[socket.id] = {
        socket: socket,
        gameId: gameSocketId,
      };

      socket.emit("controller connected", true);

      gameSockets[gameSocketId].controllerId = socket.id;

      gameSockets[gameSocketId].socket.emit("controller connected", true);

      socket.on("controller state change", (data) => {
        if (gameSockets[gameSocketId]) {
          gameSockets[gameSocketId].socket.emit(
            "controller state change",
            data
          );
        }
      });
    } else {
      console.log(`Controller Connection Failed on ${socket.id}`);

      socket.emit("controller connected", false);
    }
  });

  socket.on("disconnect", () => {
    if (gameSockets[socket.id]) {
      console.log(`Game Disconnected on ${socket.id}`);

      if (controllerSockets[gameSockets[socket.id].controllerId]) {
        controllerSockets[gameSockets[socket.id].controllerId].socket.emit(
          "controller connected",
          false
        );

        controllerSockets[
          gameSockets[socket.id].controllerId
        ].gameId = undefined;
      }

      delete gameSockets[socket.id];
    }

    if (controllerSockets[socket.id]) {
      console.log(`Controller Disconnected on ${socket.id}`);

      if (gameSockets[controllerSockets[socket.id].gameId]) {
        gameSockets[controllerSockets[socket.id].gameId].socket.emit(
          "controller connected",
          false
        );

        gameSockets[
          controllerSockets[socket.id].gameId
        ].controllerId = undefined;
      }

      delete controllerSockets[socket.id];
    }
  });
});
