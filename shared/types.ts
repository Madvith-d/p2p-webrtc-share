export interface Peer {
    name : string;
    socketId : string;
    
}

export interface Room {
    roomId: string;
    hostId: string;
    peers: Peer[];
}
