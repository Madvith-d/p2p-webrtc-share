export function createPeerConnection() {
    const pc = new RTCPeerConnection({
        iceServers: [
            {
                urls: "stun:stun.l.google.com:19302",
            },
        ],
    })
    pc.onicecandidate = (event) => {
      if(event.candidate) {
        console.log("ICE candidate:", event.candidate)
        // TODO: Send candidate to other peer
      }else{
        console.log("ICE candidate gathering completed")
        // TODO: Signal that candidate gathering is complete
      }
    }
    pc.onconnectionstatechange = (event) =>{
      console.log("Connection state change:", pc.connectionState)
    }

    pc.ondatachannel = (event) =>{
        console.log("Data channel created:", event.channel)
    }
    return pc
}
