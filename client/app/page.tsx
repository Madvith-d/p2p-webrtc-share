"use client";

import { socket } from "@/lib/socket";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Room } from "../../shared/types";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { USERNAME_STORAGE_KEY } from "@/lib/constants";

export default function Home() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [roomName, setRoomName] = useState("");
  const [createPending, setCreatePending] = useState(false);
  const [nameTouched, setNameTouched] = useState(false);
  const [roomTouched, setRoomTouched] = useState(false);

  const cleanName = userName.trim();
  const cleanRoom = roomName.trim();
  const nameError = nameTouched && !cleanName;
  const roomError = roomTouched && !cleanRoom;

  useEffect(() => {
    const savedName = window.localStorage.getItem(USERNAME_STORAGE_KEY);
    if (!savedName) return;
    const timer = window.setTimeout(() => setUserName(savedName), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const onRoomCreated = (room: Room) => {
      router.push(`/room/${room.roomId}?name=${encodeURIComponent(cleanName)}`);
    };
    socket.on("room-created", onRoomCreated);
    return () => {
      socket.off("room-created", onRoomCreated);
    };
  }, [cleanName, router]);

  function rememberName(name: string) {
    window.localStorage.setItem(USERNAME_STORAGE_KEY, name);
  }

  function handleJoinRoom() {
    setNameTouched(true);
    setRoomTouched(true);
    if (!cleanName || !cleanRoom) return;
    rememberName(cleanName);
    router.push(`/room/${cleanRoom}?name=${encodeURIComponent(cleanName)}`);
  }

  function handleCreateRoom() {
    setNameTouched(true);
    if (!cleanName || createPending) return;
    rememberName(cleanName);
    setCreatePending(true);
    socket.emit("create-room", {
      name: cleanName,
    });
  }

  return (
    <div className="landing-shell">
      <nav className="landing-nav" aria-label="Primary">
        <a className="landing-wordmark" href="#transfer" aria-label="P2P Share home">
          p2p/share
        </a>
        <a className="landing-nav__action" href="#transfer">
          Start
          <ArrowRight aria-hidden="true" size={15} strokeWidth={1.8} />
        </a>
      </nav>

      <main className="landing-main">
        <header className="landing-intro">
          <p className="landing-status"><span aria-hidden="true" /> Direct browser transfer</p>
          <h1 className="landing-title" id="landing-title">Move a file. Leave no copy.</h1>
          <p className="landing-lede">One private room. Two browsers. Nothing stored in between.</p>
        </header>

        <section className="transfer-panel" id="transfer" aria-labelledby="transfer-title">
          <h2 id="transfer-title">Choose a route</h2>
          <form className="transfer-form" onSubmit={(event) => { event.preventDefault(); handleCreateRoom(); }} noValidate>
            <article className="transfer-route">
              <div className="transfer-route__copy">
                <span className="transfer-route__number">01</span>
                <div><h3>Create a room</h3><p>Get a private link or QR code to share.</p></div>
              </div>
              <div className="transfer-route__controls">
                <div className="transfer-field">
                  <label htmlFor="display-name">Your name</label>
                  <input className="transfer-input" id="display-name" value={userName} onBlur={() => setNameTouched(true)} onChange={(event) => setUserName(event.target.value)} placeholder="e.g. Alex" autoComplete="name" aria-invalid={nameError} aria-describedby="name-help" required />
                  <p className="transfer-field__help" id="name-help" data-error={nameError}>{nameError ? "Add a name so the other person can identify you." : "Remembered on this device. Visible only inside this room."}</p>
                </div>
                <button className="transfer-button transfer-button--primary" type="submit" disabled={createPending} data-state={createPending ? "loading" : "default"}>
                  {createPending ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : <ArrowRight aria-hidden="true" />}
                  {createPending ? "Creating room" : "Create room"}
                </button>
              </div>
            </article>

            <article className="transfer-route">
              <div className="transfer-route__copy">
                <span className="transfer-route__number">02</span>
                <div><h3>Join a room</h3><p>Paste the code, or open a shared QR link.</p></div>
              </div>
              <div className="transfer-route__controls">
                <div className="transfer-field">
                  <label htmlFor="room-code">Room code</label>
                  <input className="transfer-input" id="room-code" value={roomName} onBlur={() => setRoomTouched(true)} onChange={(event) => setRoomName(event.target.value)} placeholder="Paste the shared code" autoComplete="off" spellCheck={false} aria-invalid={roomError} aria-describedby="room-help" />
                  <p className="transfer-field__help" id="room-help" data-error={roomError}>{roomError ? "Paste the room code from the shared link." : "A QR scan opens the room directly."}</p>
                </div>
                <button className="transfer-button transfer-button--secondary" type="button" onClick={handleJoinRoom}>Join room</button>
              </div>
            </article>
          </form>
        </section>

        <dl className="landing-trust" aria-label="Transfer facts">
          <div><dt>Path</dt><dd>Peer to peer</dd></div>
          <div><dt>Storage</dt><dd>None</dd></div>
          <div><dt>Account</dt><dd>Not required</dd></div>
        </dl>
      </main>

      <footer className="landing-footer">
        <p className="landing-footer__statement">The server makes the introduction. Your browsers do the rest.</p>
        <div className="landing-footer__meta"><span>p2p/share · signaling only</span><a href="https://github.com/madvithd/p2p-webrtc-share">View source</a></div>
      </footer>
    </div>
  );
}
