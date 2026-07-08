import express from "express";
import { Server } from "socket.io";
import http from "http";
import { RoomManager } from "./room/room";
import { Peer } from "../../shared/types";

const app = express();

const server = app.listen(3000, () => {
  console.log("Server started on port 3000");
});

const io = new Server(server);
const roomManager = new RoomManager();

io.on("connection", (socket) => {
  console.log("User connected", socket.id);

  socket.on("join-room", (payload: { roomId: string; name: string }) => {
    const peer: Peer = {
      name: payload.name,
      socketId: socket.id
    };
    roomManager.addPeerToRoom(payload.roomId, peer);
    socket.emit("room-updated", roomManager.getRoom(payload.roomId));
  });

  socket.on("create-room", (
    payload : {
      name : string
    }
  )=>{
    const room = roomManager.createRoom({
      name: payload.name,
      socketId: socket.id
    });
    socket.emit("room-created", room);
  })
});
