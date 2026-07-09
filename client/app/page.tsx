
"use client";
import { socket } from "@/lib/socket";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Room } from "../../shared/types";

export default function Home() {
  const [userName, setUserName] = useState("");
  const [roomName, setRoomName] = useState("");
  const [createdRoomCode, setCreatedRoomCode] = useState("");

  useEffect(() => {
    const onRoomCreated = (room: Room) => {
      setCreatedRoomCode(room.roomId);
    };
    socket.on("room-created", onRoomCreated);
    return () => {
      socket.off("room-created", onRoomCreated);
    };
  }, []);

  function handleJoinRoom() {
    if (!userName.trim()) return;
    socket.emit("join-room", {
      roomId: roomName,
      name: userName.trim()
    });
  }
  function handleCreateRoom() {
    if (!userName.trim()) return;
    socket.emit("create-room", {
      name: userName.trim()
    });
  }
  return (
    <div className="flex justify-center items-center h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Peer-to-Peer File Sharing</CardTitle>
          <CardDescription>Share files with others using WebRTC</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <Label>Enter Your Name</Label>
          <Input value={userName} onChange={(e) => setUserName(e.target.value)} />
          <Button className="w-full" onClick={handleCreateRoom}>Create Room</Button>
          {createdRoomCode && (
            <div className="text-center p-2 bg-green-100 rounded-lg">
              <p className="text-sm font-medium text-green-800">
                Room Created: <span className="font-mono text-base">{createdRoomCode}</span>
              </p>
              <p className="text-xs text-green-700 mt-1">Share this code to let others join</p>
            </div>
          )}
          <Label>Room Code</Label>
          <Input value={roomName} onChange={(e) => setRoomName(e.target.value)} />
          <Button className="w-full" onClick={handleJoinRoom}>Join Room</Button>
        </CardContent>
      </Card>
    </div>
  );
}
