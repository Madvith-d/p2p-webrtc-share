import { createPeerConnection } from "./peer";

export const createOffer = async (pc: ReturnType<typeof createPeerConnection>) => {
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
 
    return offer;
}

export const handleOffer = async (pc: ReturnType<typeof createPeerConnection> | null, offer: RTCSessionDescriptionInit) => {
    if (!pc) {
        throw new Error("Peer connection not found");
    }
    await pc.setRemoteDescription(offer);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    return answer;
}

export const handleAnswer = async (pc: ReturnType<typeof createPeerConnection> | null, answer: RTCSessionDescriptionInit) => {
    if (!pc) {
        throw new Error("Peer connection not found");
    }
    await pc.setRemoteDescription(answer);
}

export const handleCandidate = async (pc: ReturnType<typeof createPeerConnection> | null, candidate: RTCIceCandidateInit) => {
    if (!pc) {
        throw new Error("Peer connection not found");
    }
    await pc.addIceCandidate(candidate);
}   