"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomManager = void 0;
class RoomManager {
    constructor() {
        this.rooms = new Map();
    }
    createRoom(peer) {
        const roomId = this.generateRoomId();
        this.rooms.set(roomId, {
            roomId,
            peers: [peer]
        });
        return this.rooms.get(roomId);
    }
    getRoom(roomId) {
        return this.rooms.get(roomId);
    }
    addPeerToRoom(roomId, peer) {
        const room = this.rooms.get(roomId);
        if (room) {
            const exists = room.peers.some(p => p.socketId === peer.socketId);
            if (!exists) {
                room.peers.push(peer);
            }
        }
    }
    removePeerFromRoom(roomId, peerId) {
        const room = this.rooms.get(roomId);
        if (room) {
            room.peers = room.peers.filter(peer => peer.socketId !== peerId);
        }
    }
    deleteRoom(roomId) {
        this.rooms.delete(roomId);
    }
    generateRoomId() {
        return Math.random().toString(36).substring(2, 15);
    }
}
exports.RoomManager = RoomManager;
