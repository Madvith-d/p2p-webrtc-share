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
            hostId: peer.socketId,
            peers: [peer]
        });
        return this.rooms.get(roomId);
    }
    getRoom(roomId) {
        return this.rooms.get(roomId);
    }
    addPeerToRoom(roomId, peer) {
        const room = this.rooms.get(roomId);
        if (!room) {
            return { ok: false, error: "room-not-found" };
        }
        const exists = room.peers.some(p => p.socketId === peer.socketId);
        if (exists) {
            return { ok: true, room };
        }
        if (room.peers.length >= 2) {
            return { ok: false, error: "room-full" };
        }
        room.peers.push(peer);
        return { ok: true, room };
    }
    removePeerFromRoom(roomId, peerId) {
        const room = this.rooms.get(roomId);
        if (room) {
            room.peers = room.peers.filter(peer => peer.socketId !== peerId);
            if (room.peers.length === 0) {
                this.deleteRoom(roomId);
            }
        }
    }
    removePeerFromAllRooms(socketId) {
        const affected = [];
        for (const [roomId, room] of this.rooms) {
            const before = room.peers.length;
            room.peers = room.peers.filter(peer => peer.socketId !== socketId);
            if (room.peers.length === 0) {
                this.deleteRoom(roomId);
            }
            else if (room.peers.length < before) {
                affected.push({ roomId, room });
            }
        }
        return affected;
    }
    deleteRoom(roomId) {
        this.rooms.delete(roomId);
    }
    generateRoomId() {
        return Math.random().toString(36).substring(2, 15);
    }
    getOtherPeer(roomId, currentPeerId) {
        const room = this.rooms.get(roomId);
        if (!room?.peers.some(peer => peer.socketId === currentPeerId))
            return;
        return room.peers.find(peer => peer.socketId !== currentPeerId);
    }
}
exports.RoomManager = RoomManager;
//# sourceMappingURL=room.js.map