# p2p/share

p2p/share is a private, browser-to-browser file transfer app. A small signaling server introduces the two peers, and WebRTC then moves the file directly between their browsers.

## Features

| Capability | Behavior |
| --- | --- |
| Bidirectional sharing | Either participant can select and send a file after the room is connected. |
| Progress on both sides | The sender sees outgoing progress while the receiver sees incoming filename, byte progress, and completion state. |
| QR room sharing | A room owner can display a QR code containing the room link, share the link through the device share sheet, or copy it. |
| Automatic QR joining | Scanning the QR code opens the room directly. A remembered device name joins automatically; a first-time device is asked for a name once. |
| Local username | The display name is stored in browser local storage and is never sent to the signaling server except as room presence data. |
| No file storage | File bytes do not pass through or persist on the signaling server. |

## Architecture

The app uses Socket.IO only for room membership and WebRTC signaling. Once the direct peer connection is established, the browser data channel carries file metadata and chunks in both directions. Received files are assembled locally and downloaded automatically.

## Run the app

```bash
git clone https://github.com/madvithd/p2p-webrtc-share.git
cd p2p-webrtc-share
docker compose up -d
```

For local development, install dependencies in the client and server workspaces, then run the root development command:

```bash
pnpm install
pnpm --dir client install
pnpm --dir server install
pnpm dev
```

The client defaults to `http://localhost:3000` and the signaling server defaults to `http://localhost:3001`. Set `NEXT_PUBLIC_SIGNALING_URL` and `CLIENT_ORIGIN` when running them on different hosts.

## Validation

The client can be checked with `pnpm --dir client lint` and `pnpm --dir client build`. The server room behavior is covered by `pnpm --dir server test`.
