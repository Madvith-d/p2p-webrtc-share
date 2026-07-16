import { io } from "socket.io-client";

export const socket = io(process.env.NEXT_PUBLIC_SIGNALING_URL ?? "http://localhost:3001", {
    withCredentials: true
});
