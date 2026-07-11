export interface OfferPayload {
    roomId : string ,
    offer: RTCSessionDescriptionInit
}

export interface AnswerPayload {
    roomId : string ,
    answer: RTCSessionDescriptionInit
}

export interface IceCandidatePayload {
    roomId : string ,
    candidate: RTCIceCandidateInit
}
