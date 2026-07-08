
"use client";
import { socket } from "@/lib/socket";
import { useState, useEffect } from "react";
import { Room , Peer } from "../../shared/types";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export default function Home() {
  const [userName, setUserName] = useState("");
  const [roomName, setRoomName] = useState("");
  useEffect(() => {
    // Generate a random room name
    
  }, []);

  function handleJoinRoom() {
    socket.emit("join-room", {
      roomId: roomName,
      name: userName
    });
  }
  function handleCreateRoom() {
      socket.emit("create-room", {
        name: userName
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
          <Label>Room Code</Label>
          <Input value={roomName} onChange={(e) => setRoomName(e.target.value)} />
          <Button className="w-full" onClick={handleJoinRoom}>Join Room</Button>
        </CardContent>
      </Card>
    </div>
  );
}
