import express from "express";
import { Server } from "socket.io";
import http from "http";
import { RoomManager } from "./room/room";
import { Peer } from "../../shared/types";

const app = express();

const server = http.createServer(app);
server.listen(3001, () => {
  console.log("Server started on port 3001");
});

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});
const roomManager = new RoomManager();

io.on("connection", (socket) => {
  console.log("User connected", socket.id);

  socket.on("join-room", (payload: { roomId: string; name: string }) => {
    const peer: Peer = {
      name: payload.name,
      socketId: socket.id
    };
    const result = roomManager.addPeerToRoom(payload.roomId, peer);
    if (!result.ok) {
      socket.emit(result.error);
      return;
    }
    socket.join(payload.roomId);
    console.log("Peer added to room", payload.roomId, peer);
    io.to(payload.roomId).emit("room-updated", result.room);
  });

  socket.on("create-room", (
    payload : {
      name : string
    }
  )=>{
    console.log("Creating room", payload);
    const room = roomManager.createRoom({
      name: payload.name,
      socketId: socket.id
    });
    socket.join(room.roomId);
    console.log("Room created", room);
    socket.emit("room-created", room);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected", socket.id);
    const affected = roomManager.removePeerFromAllRooms(socket.id);
    for (const { roomId, room } of affected) {
      io.to(roomId).emit("peer-left", socket.id);
      io.to(roomId).emit("room-updated", room);
    }
  });

  socket.on("offer", (payload: { roomId: string; offer: any }) => {
    console.log("Offer received", payload);
    const otherPeer = roomManager.getOtherPeer(socket.id);
    if (otherPeer) {
      io.to(otherPeer.socketId).emit("offer", payload.offer);
    }
  });
});
