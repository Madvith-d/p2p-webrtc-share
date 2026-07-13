import { createPeerConnection } from "./peer";

export const createOffer = async (pc: ReturnType<typeof createPeerConnection>) => {
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
 
    return offer;
}

export const handleOffer = async (pc: ReturnType<typeof createPeerConnection>, offer: RTCSessionDescriptionInit) => {
    await pc.setRemoteDescription(offer);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    return answer;
}

export const handleAnswer = async (pc: ReturnType<typeof createPeerConnection>, answer: RTCSessionDescriptionInit) => {
    await pc.setRemoteDescription(answer);
}

export const handleCandidate = async (pc: ReturnType<typeof createPeerConnection>, candidate: RTCIceCandidateInit) => {
    await pc.addIceCandidate(candidate);
}   