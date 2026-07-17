"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { socket } from "@/lib/socket";
import { toast } from "sonner";
import { ConnectionManager } from "@/webrtc/connection";
import { Room } from "@shared/types";
import { LoaderCircle, ArrowLeft, Copy, Check, Users } from "lucide-react";
import { useRouter } from "next/navigation";

export default function RoomPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const roomId = params.id as string;
  const userName = searchParams.get("name") || "";

  const [room, setRoom] = useState<Room | null>(null);
  const [isCreator, setIsCreator] = useState(false);
  const [copied, setCopied] = useState(false);
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>("new");
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [sendState, setSendState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const connectionRef = useRef<ConnectionManager | null>(null);

  useEffect(() => {
    if (!userName) {
      router.push("/");
      return;
    }
    const connection = new ConnectionManager();
    connectionRef.current = connection;
    connection.initialize(roomId, setConnectionState, (received, total) => setProgress(total ? received / total : 1));

    const onRoomUpdated = async (updatedRoom: Room) => {
      setRoom(updatedRoom);
      const isHost = updatedRoom.hostId === socket.id;
      setIsCreator(isHost);
      if (updatedRoom.peers.length === 1) connection.reset();
      if (isHost && updatedRoom.peers.length === 2) await connection.start();
    };

    const onRoomCreated = (createdRoom: Room) => {
      setRoom(createdRoom);
      setIsCreator(true);
      toast.success("Room created successfully!");
    };

    socket.on("room-updated", onRoomUpdated);
    socket.on("room-created", onRoomCreated);
    socket.on("join-error", (error: string) => {
      toast.error(error === "room-not-found" ? "Room not found" : "Room is full");
      router.push("/");
    });
    socket.emit("join-room", { roomId, name: userName });

    return () => {
      socket.off("room-updated", onRoomUpdated);
      socket.off("room-created", onRoomCreated);
      socket.off("join-error");
      connection.close();
      connectionRef.current = null;
    };
  }, [roomId, userName, router]);

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Room ID copied");
  };

  const handleStartSharing = async () => {
    if (!file || !connectionRef.current) return;
    setSendState("loading");
    setProgress(0);
    try {
      await connectionRef.current.send(file, (sent, total) => setProgress(total ? sent / total : 1));
      setSendState("success");
      toast.success("File sent");
    } catch {
      setSendState("error");
      toast.error("Transfer failed");
    }
  };

  const isConnected = connectionState === "connected";
  const peerCount = room?.peers.length ?? 0;

  return (
    <div className="room-shell">
      <nav className="room-bar" aria-label="Room navigation">
        <div className="room-bar__start">
          <a className="room-bar__wordmark" href="/" aria-label="Back to home">
            <ArrowLeft aria-hidden="true" size={14} strokeWidth={1.8} style={{ marginRight: "0.5rem", verticalAlign: "middle" }} />
            p2p/share
          </a>
          <span className="room-bar__status">
            <span aria-hidden="true" />
            {isConnected ? "connected" : "connecting"}
          </span>
        </div>
        <a className="room-bar__leave" href="/">Leave room</a>
      </nav>

      <main className="room-main">
        {!room ? (
          <section className="room-panel room-panel--center">
            <div className="room-spinner" aria-label="Connecting" />
            <p className="room-muted">Connecting to room</p>
          </section>
        ) : (
          <section className="room-panel" aria-label="Room">
            <header className="room-header">
              <p className="room-header__indicator">
                <span aria-hidden="true" />
                Waiting Room
              </p>
              <h1 className="room-title">
                {isCreator ? "Share a file" : "Ready to receive"}
              </h1>
              <div className="room-meta">
                <code className="room-meta__code">{roomId}</code>
                <button
                  className="room-meta__copy"
                  onClick={copyRoomId}
                  data-state={copied ? "success" : "default"}
                  aria-label={copied ? "Room ID copied" : "Copy room ID"}
                >
                  {copied ? <Check aria-hidden="true" size={12} strokeWidth={2.5} /> : <Copy aria-hidden="true" size={12} strokeWidth={2.5} />}
                  {copied ? "Copied" : "Copy ID"}
                </button>
              </div>
            </header>

            <hr className="room-divider" role="presentation" />

            <div className="room-section">
              <div className="room-section__head">
                <span>
                  <Users aria-hidden="true" size={12} strokeWidth={2} style={{ marginRight: "0.35rem", verticalAlign: "middle" }} />
                  Participants ({peerCount})
                </span>
                <span className="room-connection">
                  <span className={`room-connection__dot${isConnected ? " room-connection__dot--active" : ""}`} aria-hidden="true" />
                  {isConnected ? "Connected" : connectionState === "new" ? "Waiting" : connectionState}
                </span>
              </div>
              <div className="room-participants">
                {room.peers.map((peer, index) => (
                  <div key={peer.socketId} className="room-peer">
                    <div className="room-peer__avatar" aria-hidden="true">
                      {peer.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="room-peer__info">
                      <div className="room-peer__name">
                        {peer.name}
                        {peer.socketId === socket.id && <span className="room-peer__tag">You</span>}
                        {index === 0 && <span className="room-peer__tag">Host</span>}
                      </div>
                      <div className="room-peer__status">
                        {peer.socketId === socket.id ? "Connected" : "Waiting"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {isCreator && peerCount > 1 && (
              <>
                <hr className="room-divider" role="presentation" />
                <div className="room-section">
                  <div className="room-section__head">
                    <span>Transfer</span>
                  </div>
                  <div className="room-transfer">
                    <div className="room-transfer__input">
                      <label htmlFor="file-input">Choose a file to send</label>
                      <input
                        id="file-input"
                        className="room-file-input"
                        type="file"
                        onChange={(event) => {
                          setFile(event.target.files?.[0] ?? null);
                          setSendState("idle");
                        }}
                      />
                    </div>
                    <button
                      className="room-send"
                      disabled={!file || !isConnected}
                      data-state={sendState}
                      onClick={handleStartSharing}
                    >
                      {sendState === "loading" ? (
                        <LoaderCircle aria-hidden="true" className="animate-spin" size={16} strokeWidth={2.5} />
                      ) : null}
                      {sendState === "loading" ? "Sending" : sendState === "success" ? "Sent" : "Send File"}
                    </button>
                    {progress > 0 && (
                      <div className="room-progress">
                        <div className="room-progress__track">
                          <div
                            className="room-progress__fill"
                            style={{ width: `${Math.round(progress * 100)}%` }}
                          />
                        </div>
                        <span className="room-progress__label">{Math.round(progress * 100)}%</span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {!isCreator && (
              <hr className="room-divider" role="presentation" />
            )}

            {!isCreator && (
              <p className="room-waiting">
                {peerCount < 2 ? "Waiting for the host to connect…" : "The host will send a file shortly."}
              </p>
            )}
          </section>
        )}
      </main>

      <footer className="room-footer">
        p2p/share &middot; signaling only
      </footer>
    </div>
  );
}
