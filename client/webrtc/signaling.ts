import { createPeerConnection } from "./peer";

export const createOffer = async (pc: ReturnType<typeof createPeerConnection>) => {
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
 
    return offer;
}