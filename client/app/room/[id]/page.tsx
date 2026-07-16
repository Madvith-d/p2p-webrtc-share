"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { socket } from "@/lib/socket";
import { toast } from "sonner";
import { ConnectionManager } from "@/webrtc/connection";
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
import { Input } from "@/components/ui/input";
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
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>("new");
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
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
    socket.emit("join-room", { roomId, name: userName });

    return () => {
      socket.off("room-updated", onRoomUpdated);
      socket.off("room-created", onRoomCreated);
      connection.close();
      connectionRef.current = null;
    };
  }, [roomId, userName, router]);

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Room ID copied to clipboard!");
  };

  const handleStartSharing = async () => {
    if (!file || !connectionRef.current) return;
    setProgress(0);
    await connectionRef.current.send(file, (sent, total) => setProgress(total ? sent / total : 1));
    toast.success("File sent");
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
                  {connectionState === "connected" ? (
                    <span className="flex items-center gap-1 text-green-500">
                      <span className="h-2 w-2 rounded-full bg-green-500" />
                      Connected
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-red-500">
                      <span className="h-2 w-2 rounded-full bg-red-500" />
                      {connectionState === "new" ? "Waiting" : connectionState}
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
              <div className="space-y-2">
                <Input type="file" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
                <Button className="w-full" size="lg" disabled={!file || connectionState !== "connected"} onClick={handleStartSharing}>
                  Send File
                </Button>
              </div>
            )}
            {progress > 0 && <p className="text-center text-sm">Transfer progress: {Math.round(progress * 100)}%</p>}
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
