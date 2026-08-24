"use client";

import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { socket } from "@/lib/socket";
import { toast } from "sonner";
import { ConnectionManager } from "@/webrtc/connection";
import { Room } from "@shared/types";
import { type FileMetadata } from "@/transfer/protocol";
import { USERNAME_STORAGE_KEY } from "@/lib/constants";
import { QRCodeSVG } from "qrcode.react";
import { LoaderCircle, ArrowLeft, Copy, Check, Users, QrCode, Share2, X } from "lucide-react";

const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** unitIndex).toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
};

const percentage = (progress: number) => Math.round(Math.min(1, Math.max(0, progress)) * 100);

type TransferState = "idle" | "loading" | "success" | "error";

export default function RoomPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const roomId = params.id as string;
  const nameFromUrl = searchParams.get("name")?.trim() || "";

  const [userName, setUserName] = useState(nameFromUrl);
  const [nameInput, setNameInput] = useState("");
  const [room, setRoom] = useState<Room | null>(null);
  const [copied, setCopied] = useState(false);
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>("new");
  const [file, setFile] = useState<File | null>(null);
  const [sendProgress, setSendProgress] = useState(0);
  const [sendState, setSendState] = useState<TransferState>("idle");
  const [receiveFile, setReceiveFile] = useState<FileMetadata | null>(null);
  const [receiveProgress, setReceiveProgress] = useState(0);
  const [receiveState, setReceiveState] = useState<TransferState>("idle");
  const [showQr, setShowQr] = useState(false);
  const roomUrl = typeof window === "undefined" ? "" : `${window.location.origin}/room/${encodeURIComponent(roomId)}`;
  const connectionRef = useRef<ConnectionManager | null>(null);

  useEffect(() => {
    if (nameFromUrl) {
      window.localStorage.setItem(USERNAME_STORAGE_KEY, nameFromUrl);
      return;
    }
    const savedName = window.localStorage.getItem(USERNAME_STORAGE_KEY)?.trim() || "";
    if (!savedName) return;
    const timer = window.setTimeout(() => setUserName(savedName), 0);
    return () => window.clearTimeout(timer);
  }, [nameFromUrl]);

  useEffect(() => {
    if (!userName) return;

    const connection = new ConnectionManager();
    connectionRef.current = connection;
    connection.initialize(roomId, setConnectionState, {
      onStart: (metadata) => {
        setReceiveFile(metadata);
        setReceiveProgress(0);
        setReceiveState("loading");
      },
      onProgress: (received, total) => {
        setReceiveProgress(total ? received / total : 1);
      },
      onComplete: (metadata) => {
        setReceiveFile(metadata);
        setReceiveProgress(1);
        setReceiveState("success");
        toast.success(`${metadata.fileName} received and downloaded`);
      },
    });

    const onRoomUpdated = async (updatedRoom: Room) => {
      setRoom(updatedRoom);
      if (updatedRoom.peers.length === 1) connection.reset();
      if (updatedRoom.hostId === socket.id && updatedRoom.peers.length === 2) await connection.start();
    };

    const onRoomCreated = (createdRoom: Room) => {
      setRoom(createdRoom);
      toast.success("Room created successfully!");
    };

    const onJoinError = (error: string) => {
      toast.error(error === "room-not-found" ? "Room not found" : "Room is full");
      router.push("/");
    };

    socket.on("room-updated", onRoomUpdated);
    socket.on("room-created", onRoomCreated);
    socket.on("join-error", onJoinError);
    socket.emit("join-room", { roomId, name: userName });

    return () => {
      socket.off("room-updated", onRoomUpdated);
      socket.off("room-created", onRoomCreated);
      socket.off("join-error", onJoinError);
      connection.close();
      connectionRef.current = null;
    };
  }, [roomId, router, userName]);

  const rememberAndJoin = (event: FormEvent) => {
    event.preventDefault();
    const cleanName = nameInput.trim();
    if (!cleanName) return;
    window.localStorage.setItem(USERNAME_STORAGE_KEY, cleanName);
    setUserName(cleanName);
  };

  const copyText = async (text: string, successMessage: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success(successMessage);
  };

  const copyRoomId = () => copyText(roomId, "Room ID copied");

  const handleShareRoom = async () => {
    if (!roomUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join my p2p/share room",
          text: `${userName} invited you to share files privately.`,
          url: roomUrl,
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
      return;
    }
    await copyText(roomUrl, "Room link copied");
  };

  const handleStartSharing = async () => {
    if (!file || !connectionRef.current) return;
    setSendState("loading");
    setSendProgress(0);
    try {
      await connectionRef.current.send(file, (sent, total) => setSendProgress(total ? sent / total : 1));
      setSendState("success");
      toast.success("File sent");
    } catch {
      setSendState("error");
      toast.error("Transfer failed");
    }
  };

  const isConnected = connectionState === "connected";
  const peerCount = room?.peers.length ?? 0;
  const isCreator = room?.hostId === socket.id;

  if (!userName) {
    return (
      <div className="room-shell">
        <nav className="room-bar" aria-label="Room navigation">
          <Link className="room-bar__wordmark" href="/" aria-label="Back to home"><ArrowLeft aria-hidden="true" size={14} strokeWidth={1.8} style={{ marginRight: "0.5rem", verticalAlign: "middle" }} />p2p/share</Link>
        </nav>
        <main className="room-main">
          <section className="room-panel room-panel--center room-name-gate">
            <p className="room-header__indicator"><span aria-hidden="true" />You are invited</p>
            <h1 className="room-title">Choose a name to join</h1>
            <p className="room-muted">It will be remembered on this device and shown to the other person.</p>
            <form className="room-name-form" onSubmit={rememberAndJoin}>
              <label htmlFor="room-display-name">Your name</label>
              <input id="room-display-name" className="transfer-input" value={nameInput} onChange={(event) => setNameInput(event.target.value)} placeholder="e.g. Alex" autoComplete="name" autoFocus required />
              <button className="room-send" type="submit" disabled={!nameInput.trim()}>Join room</button>
            </form>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="room-shell">
      <nav className="room-bar" aria-label="Room navigation">
        <div className="room-bar__start">
          <Link className="room-bar__wordmark" href="/" aria-label="Back to home">
            <ArrowLeft aria-hidden="true" size={14} strokeWidth={1.8} style={{ marginRight: "0.5rem", verticalAlign: "middle" }} />
            p2p/share
                      </Link>
          <span className="room-bar__status"><span aria-hidden="true" />{isConnected ? "connected" : "connecting"}</span>
        </div>
        <Link className="room-bar__leave" href="/">Leave room</Link>
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
              <p className="room-header__indicator"><span aria-hidden="true" />Private room</p>
              <h1 className="room-title">Share files both ways</h1>
              <p className="room-muted">You can send and receive at the same time.</p>
              <div className="room-meta">
                <code className="room-meta__code">{roomId}</code>
                <button className="room-meta__copy" onClick={copyRoomId} data-state={copied ? "success" : "default"} aria-label={copied ? "Room ID copied" : "Copy room ID"}>
                  {copied ? <Check aria-hidden="true" size={12} strokeWidth={2.5} /> : <Copy aria-hidden="true" size={12} strokeWidth={2.5} />}{copied ? "Copied" : "Copy ID"}
                </button>
                <button className="room-meta__copy" onClick={() => setShowQr(true)}><QrCode aria-hidden="true" size={12} strokeWidth={2.5} />Show QR</button>
                <button className="room-meta__copy" onClick={handleShareRoom}><Share2 aria-hidden="true" size={12} strokeWidth={2.5} />Share link</button>
              </div>
            </header>

            <hr className="room-divider" role="presentation" />

            <div className="room-section">
              <div className="room-section__head"><span><Users aria-hidden="true" size={12} strokeWidth={2} style={{ marginRight: "0.35rem", verticalAlign: "middle" }} />Participants ({peerCount})</span><span className="room-connection"><span className={`room-connection__dot${isConnected ? " room-connection__dot--active" : ""}`} aria-hidden="true" />{isConnected ? "Connected" : connectionState === "new" ? "Waiting" : connectionState}</span></div>
              <div className="room-participants">
                {room.peers.map((peer, index) => (
                  <div key={peer.socketId} className="room-peer">
                    <div className="room-peer__avatar" aria-hidden="true">{peer.name.charAt(0).toUpperCase()}</div>
                    <div className="room-peer__info">
                      <div className="room-peer__name">{peer.name}{peer.socketId === socket.id && <span className="room-peer__tag">You</span>}{index === 0 && <span className="room-peer__tag">Host</span>}</div>
                      <div className="room-peer__status">{peer.socketId === socket.id ? "Connected" : "In this room"}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {peerCount > 1 && (
              <>
                <hr className="room-divider" role="presentation" />
                <div className="room-section">
                  <div className="room-section__head"><span>File transfer</span><span>Two-way</span></div>
                  <div className="room-transfer">
                    <div className="room-transfer__input">
                      <label htmlFor="file-input">Choose a file to send</label>
                      <input id="file-input" className="room-file-input" type="file" onChange={(event) => { setFile(event.target.files?.[0] ?? null); setSendState("idle"); setSendProgress(0); }} />
                    </div>
                    <button className="room-send" disabled={!file || !isConnected || sendState === "loading"} data-state={sendState} onClick={handleStartSharing}>
                      {sendState === "loading" ? <LoaderCircle aria-hidden="true" className="animate-spin" size={16} strokeWidth={2.5} /> : null}
                      {sendState === "loading" ? "Sending" : sendState === "success" ? "Sent" : sendState === "error" ? "Try again" : "Send file"}
                    </button>
                  </div>

                  {sendState !== "idle" && (
                    <div className="room-progress-card" aria-live="polite">
                      <div className="room-progress-card__head"><span>Outgoing · {file?.name}</span><strong>{sendState === "error" ? "Failed" : `${percentage(sendProgress)}%`}</strong></div>
                      <div className="room-progress__track"><div className="room-progress__fill" style={{ width: `${percentage(sendProgress)}%` }} /></div>
                      <span className="room-progress-card__meta">{sendState === "success" ? "Delivered to the other browser" : sendState === "loading" ? `Sending ${formatBytes(file?.size ?? 0)}` : "Select Try again to resend"}</span>
                    </div>
                  )}

                  {receiveState !== "idle" && receiveFile && (
                    <div className="room-progress-card room-progress-card--incoming" aria-live="polite">
                      <div className="room-progress-card__head"><span>Incoming · {receiveFile.fileName}</span><strong>{receiveState === "error" ? "Failed" : `${percentage(receiveProgress)}%`}</strong></div>
                      <div className="room-progress__track"><div className="room-progress__fill" style={{ width: `${percentage(receiveProgress)}%` }} /></div>
                      <span className="room-progress-card__meta">{receiveState === "success" ? `Downloaded automatically · ${formatBytes(receiveFile.fileSize)}` : `Receiving ${formatBytes(receiveFile.fileSize)}`}</span>
                    </div>
                  )}
                </div>
              </>
            )}

            {peerCount < 2 && <p className="room-waiting">Share the room link or QR code. File controls appear when the other person joins.</p>}
            {peerCount > 1 && !isConnected && <p className="room-waiting">The room is joined. Establishing the direct browser connection…</p>}
            {isCreator && peerCount > 1 && <p className="room-waiting room-waiting--hint">Both participants can choose a file and send it.</p>}
          </section>
        )}
      </main>

      <footer className="room-footer">p2p/share &middot; signaling only</footer>

      {showQr && roomUrl && (
        <div className="room-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowQr(false); }}>
          <section className="room-modal" role="dialog" aria-modal="true" aria-labelledby="qr-title">
            <div className="room-modal__head"><div><p className="room-header__indicator"><span aria-hidden="true" />Scan to join</p><h2 id="qr-title">Join this room</h2></div><button className="room-modal__close" onClick={() => setShowQr(false)} aria-label="Close QR code"><X size={18} /></button></div>
            <div className="room-qr"><QRCodeSVG value={roomUrl} size={220} bgColor="#ffffff" fgColor="#111518" includeMargin /></div>
            <p className="room-modal__copy">Scan with your phone camera. The room opens directly, and the saved name on that device is used automatically.</p>
            <div className="room-modal__actions"><button className="room-meta__copy" onClick={handleShareRoom}><Share2 size={13} />Share link</button><button className="room-meta__copy" onClick={() => copyText(roomUrl, "Room link copied")}><Copy size={13} />Copy link</button></div>
          </section>
        </div>
      )}
    </div>
  );
}
