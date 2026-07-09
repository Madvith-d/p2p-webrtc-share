"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const socket_io_1 = require("socket.io");
const room_1 = require("./room/room");
const app = (0, express_1.default)();
const server = app.listen(3001, () => {
    console.log("Server started on port 3001");
});
const io = new socket_io_1.Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
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
        roomManager.addPeerToRoom(payload.roomId, peer);
        console.log("Peer added to room", payload.roomId, peer);
        socket.emit("room-updated", roomManager.getRoom(payload.roomId));
    });
    socket.on("create-room", (payload) => {
        console.log("Creating room", payload);
        const room = roomManager.createRoom({
            name: payload.name,
            socketId: socket.id
        });
        console.log("Room created", room);
        socket.emit("room-created", room);
    });
});
