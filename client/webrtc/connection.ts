import { socket } from "../lib/socket";
import { createPeerConnection } from "./peer";
import { createOffer, handleAnswer, handleCandidate, handleOffer } from "./signaling";
import { FileReceiver } from "../transfer/receiver";
import { sendFile } from "../transfer/sender";

export class ConnectionManager {
  private roomId = "";
  private connection: RTCPeerConnection | null = null;
  private pendingCandidates: RTCIceCandidateInit[] = [];
  private channel: RTCDataChannel | null = null;
  private sending = false;
  private onStateChange: (state: RTCPeerConnectionState) => void = () => {};
  private receiver = new FileReceiver();

  initialize(
    roomId: string,
    onStateChange: (state: RTCPeerConnectionState) => void,
    onReceiveProgress?: (received: number, total: number) => void,
  ) {
    this.roomId = roomId;
    this.onStateChange = onStateChange;
    this.receiver = new FileReceiver(onReceiveProgress);
    socket.on("offer", this.onOffer);
    socket.on("answer", this.onAnswer);
    socket.on("ice-candidate", this.onCandidate);
  }

  async start() {
    if (this.connection) return;

    const connection = this.createConnection();
    const channel = connection.createDataChannel("files");
    this.configureChannel(channel);
    socket.emit("offer", { roomId: this.roomId, offer: await createOffer(connection) });
  }

  async send(file: File, onProgress?: (sent: number, total: number) => void) {
    if (!this.channel) throw new Error("Data channel is not ready");
    if (this.sending) throw new Error("A transfer is already in progress");
    // ponytail: version 1 sends one file at a time; add transfer IDs before multiplexing.
    this.sending = true;
    try {
      await sendFile(this.channel, file, onProgress);
    } finally {
      this.sending = false;
    }
  }

  close() {
    socket.off("offer", this.onOffer);
    socket.off("answer", this.onAnswer);
    socket.off("ice-candidate", this.onCandidate);
    this.reset();
  }

  reset() {
    this.connection?.close();
    this.connection = null;
    this.channel = null;
    this.sending = false;
    this.pendingCandidates = [];
  }

  private createConnection() {
    if (this.connection) return this.connection;

    // ponytail: rooms are capped at two peers, so one connection is enough.
    const connection = createPeerConnection();
    connection.onicecandidate = ({ candidate }) => {
      if (candidate) socket.emit("ice-candidate", { roomId: this.roomId, candidate: candidate.toJSON() });
    };
    connection.onconnectionstatechange = () => this.onStateChange(connection.connectionState);
    connection.oniceconnectionstatechange = () => console.log("ICE connection state:", connection.iceConnectionState);
    connection.ondatachannel = ({ channel }) => this.configureChannel(channel);
    this.connection = connection;
    return connection;
  }

  private addPendingCandidates = async () => {
    const connection = this.connection;
    if (!connection) return;
    for (const candidate of this.pendingCandidates.splice(0)) {
      await handleCandidate(connection, candidate);
    }
  };

  private onOffer = async (offer: RTCSessionDescriptionInit) => {
    const connection = this.createConnection();
    const answer = await handleOffer(connection, offer);
    await this.addPendingCandidates();
    socket.emit("answer", { roomId: this.roomId, answer });
  };

  private onAnswer = async (answer: RTCSessionDescriptionInit) => {
    if (!this.connection) return;
    await handleAnswer(this.connection, answer);
    await this.addPendingCandidates();
  };

  private onCandidate = async (candidate: RTCIceCandidateInit) => {
    if (this.connection?.remoteDescription) await handleCandidate(this.connection, candidate);
    else this.pendingCandidates.push(candidate);
  };

  private configureChannel(channel: RTCDataChannel) {
    channel.binaryType = "arraybuffer";
    channel.onmessage = ({ data }: MessageEvent<string | ArrayBuffer>) => this.receiver.receive(data);
    this.channel = channel;
  }
}
