import { Room, Peer } from "../../../shared/types";

export class RoomManager {
    private rooms: Map<string, Room> = new Map();
    
    createRoom(peer: Peer): Room {
        const roomId = this.generateRoomId();
        this.rooms.set(roomId, {
            roomId,
            peers: [peer]
        });
        return this.rooms.get(roomId)!;
    }
    
    getRoom(roomId: string) : Room | undefined {
        return this.rooms.get(roomId);
    }
    
    addPeerToRoom(roomId: string, peer: Peer) {
        const room = this.rooms.get(roomId);
        if (room) {
            const exists = room.peers.some(p => p.socketId === peer.socketId);
            if (!exists) {
                room.peers.push(peer);
            }
        }
    }
    
    removePeerFromRoom(roomId: string, peerId: string) {
        const room = this.rooms.get(roomId);
        if (room) {
            room.peers = room.peers.filter(peer => peer.socketId !== peerId);
            if (room.peers.length === 0) {
                this.deleteRoom(roomId);
            }
        }
    }
    
    removePeerFromAllRooms(socketId: string) {
        for (const [roomId, room] of this.rooms) {
            const before = room.peers.length;
            room.peers = room.peers.filter(peer => peer.socketId !== socketId);
            if (room.peers.length === 0) {
                this.deleteRoom(roomId);
            }
        }
    }
    
    deleteRoom(roomId: string) {
        this.rooms.delete(roomId);
    }

    generateRoomId(): string {
        return Math.random().toString(36).substring(2, 15);
    }
}
