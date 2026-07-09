import { Room, Peer } from "../../../shared/types";

type AddPeerResult =
    | { ok: true; room: Room }
    | { ok: false; error: "room-not-found" | "room-full" };

type RemoveResult = Array<{ roomId: string; room: Room }>;

export class RoomManager {
    private rooms: Map<string, Room> = new Map();
    
    createRoom(peer: Peer): Room {
        const roomId = this.generateRoomId();
        this.rooms.set(roomId, {
            roomId,
            hostId: peer.socketId,
            peers: [peer]
        });
        return this.rooms.get(roomId)!;
    }
    
    getRoom(roomId: string) : Room | undefined {
        return this.rooms.get(roomId);
    }
    
    addPeerToRoom(roomId: string, peer: Peer): AddPeerResult {
        const room = this.rooms.get(roomId);
        if (!room) {
            return { ok: false, error: "room-not-found" };
        }
        if (room.peers.length >= 2) {
            return { ok: false, error: "room-full" };
        }
        const exists = room.peers.some(p => p.socketId === peer.socketId);
        if (!exists) {
            room.peers.push(peer);
        }
        return { ok: true, room };
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
    
    removePeerFromAllRooms(socketId: string): RemoveResult {
        const affected: RemoveResult = [];
        for (const [roomId, room] of this.rooms) {
            const before = room.peers.length;
            room.peers = room.peers.filter(peer => peer.socketId !== socketId);
            if (room.peers.length === 0) {
                this.deleteRoom(roomId);
            } else if (room.peers.length < before) {
                affected.push({ roomId, room });
            }
        }
        return affected;
    }
    
    deleteRoom(roomId: string) {
        this.rooms.delete(roomId);
    }

    generateRoomId(): string {
        return Math.random().toString(36).substring(2, 15);
    }
}
