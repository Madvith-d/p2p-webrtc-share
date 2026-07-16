"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const socket_io_1 = require("socket.io");
const http_1 = __importDefault(require("http"));
const room_1 = require("./room/room");
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
server.listen(3001, () => {
    console.log("Server started on port 3001");
});
const io = new socket_io_1.Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
    }
});
const roomManager = new room_1.RoomManager();
io.on("connection", (socket) => {
    console.log("User connected", socket.id);
    socket.on("join-room", (payload) => {
        const peer = {
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
    socket.on("create-room", (payload) => {
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
    socket.on("offer", (payload) => {
        const otherPeer = roomManager.getOtherPeer(payload.roomId, socket.id);
        if (otherPeer) {
            io.to(otherPeer.socketId).emit("offer", payload.offer);
        }
    });
    socket.on("answer", (payload) => {
        const otherPeer = roomManager.getOtherPeer(payload.roomId, socket.id);
        if (otherPeer) {
            io.to(otherPeer.socketId).emit("answer", payload.answer);
        }
    });
    socket.on("ice-candidate", (payload) => {
        const otherPeer = roomManager.getOtherPeer(payload.roomId, socket.id);
        if (otherPeer) {
            io.to(otherPeer.socketId).emit("ice-candidate", payload.candidate);
        }
    });
});
//# sourceMappingURL=index.js.map