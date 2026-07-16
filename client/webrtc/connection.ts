import { createPeerConnection } from "./peer.js"
import { socket } from "../lib/socket.js"
import {createOffer} from "./signaling.js"

export class ConnectionManager {
    private connections: Map<string, RTCPeerConnection> = new Map();
    
    public async connect(roomId: string): Promise<void> {
        const pc = createPeerConnection();
        const offer = await createOffer(pc);
        socket.emit("offer", { roomId, offer });
        this.connections.set(roomId, pc);
    }
}