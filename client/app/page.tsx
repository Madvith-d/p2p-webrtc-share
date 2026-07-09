"use client";
import { socket } from "@/lib/socket";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Room } from "../../shared/types";

export default function Home() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [roomName, setRoomName] = useState("");

  useEffect(() => {
    const onRoomCreated = (room: Room) => {
      toast.success("Room created successfully!");
      router.push(`/room/${room.roomId}?name=${encodeURIComponent(userName.trim())}`);
    };
    socket.on("room-created", onRoomCreated);
    return () => {
      socket.off("room-created", onRoomCreated);
    };
  }, [userName, router]);

  function handleJoinRoom() {
    if (!userName.trim() || !roomName.trim()) return;
    router.push(`/room/${roomName.trim()}?name=${encodeURIComponent(userName.trim())}`);
  }

  function handleCreateRoom() {
    if (!userName.trim()) return;
    socket.emit("create-room", {
      name: userName.trim(),
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
          <Input value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="Your name" />
          <Button className="w-full" onClick={handleCreateRoom}>Create Room</Button>
          <Label>Room Code</Label>
          <Input value={roomName} onChange={(e) => setRoomName(e.target.value)} placeholder="Enter room code" />
          <Button className="w-full" variant="outline" onClick={handleJoinRoom}>Join Room</Button>
        </CardContent>
      </Card>
    </div>
  );
}