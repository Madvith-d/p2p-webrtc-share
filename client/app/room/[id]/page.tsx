"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { socket } from "@/lib/socket";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Room } from "@shared/types";
import { Users, Copy, Loader2, CheckCircle, Crown } from "lucide-react";
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
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!userName) {
      router.push("/");
      return;
    }

    socket.on("connect", () => {
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.emit("join-room", {
      roomId,
      name: userName,
    });

    const onRoomUpdated = (updatedRoom: Room) => {
      setRoom(updatedRoom);
      const currentPeer = updatedRoom.peers.find(p => p.socketId === socket.id);
      if (currentPeer) {
        setIsCreator(updatedRoom.peers[0]?.socketId === socket.id);
      }
    };

    const onRoomCreated = (createdRoom: Room) => {
      setRoom(createdRoom);
      setIsCreator(true);
      toast.success("Room created successfully!");
    };

    socket.on("room-updated", onRoomUpdated);
    socket.on("room-created", onRoomCreated);

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("room-updated", onRoomUpdated);
      socket.off("room-created", onRoomCreated);
    };
  }, [roomId, userName, router]);

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Room ID copied to clipboard!");
  };

  const handleStartSharing = () => {
    toast.success("Starting file sharing...");
  };

  if (!room) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Connecting to room...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <Card>
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <CardTitle>Waiting Room</CardTitle>
            </div>
            <CardDescription>
              Room ID: <code className="font-mono text-sm bg-muted px-1.5 py-0.5 rounded">{roomId}</code>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={copyRoomId}>
                <Copy className="mr-2 h-4 w-4" />
                {copied ? "Copied!" : "Copy Room ID"}
              </Button>
              {isCreator && (
                <Badge variant="secondary" className="ml-2">
                  <Crown className="mr-1 h-3 w-3" />
                  Host
                </Badge>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Participants ({room.peers.length})
                </h3>
                <span className="text-sm text-muted-foreground">
                  {isConnected ? (
                    <span className="flex items-center gap-1 text-green-500">
                      <span className="h-2 w-2 rounded-full bg-green-500" />
                      Connected
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-red-500">
                      <span className="h-2 w-2 rounded-full bg-red-500" />
                      Disconnected
                    </span>
                  )}
                </span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {room.peers.map((peer, index) => (
                  <div
                    key={peer.socketId}
                    className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {peer.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {peer.name}
                        {peer.socketId === socket.id && (
                          <span className="ml-2 text-xs text-muted-foreground">(You)</span>
                        )}
                        {index === 0 && (
                          <Badge variant="secondary" className="ml-2">
                            <Crown className="mr-1 h-3 w-3" />
                            Host
                          </Badge>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {peer.socketId === socket.id ? "Connected" : "Waiting..."}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {isCreator && room.peers.length > 1 && (
              <Button className="w-full" size="lg" onClick={handleStartSharing}>
                Start File Sharing
              </Button>
            )}
            {!isCreator && (
              <p className="text-center text-sm text-muted-foreground">
                Waiting for host to start sharing...
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}