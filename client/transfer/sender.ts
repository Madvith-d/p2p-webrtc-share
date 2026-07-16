import { chunkFile } from "./chunker";
import { CHUNK_SIZE, type FileMetadata, type TransferMessage } from "./protocol";

const MAX_BUFFERED_BYTES = 1024 * 1024;

function sendMessage(channel: RTCDataChannel, message: TransferMessage) {
  channel.send(JSON.stringify(message));
}

async function waitForBuffer(channel: RTCDataChannel) {
  if (channel.bufferedAmount <= MAX_BUFFERED_BYTES) return;
  channel.bufferedAmountLowThreshold = MAX_BUFFERED_BYTES / 2;
  await new Promise<void>((resolve) => channel.addEventListener("bufferedamountlow", () => resolve(), { once: true }));
}

export async function sendFile(channel: RTCDataChannel, file: File, onProgress?: (sent: number, total: number) => void) {
  if (channel.readyState !== "open") throw new Error("Data channel is not open");

  const metadata: FileMetadata = {
    type: "metadata",
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type || "application/octet-stream",
    chunkSize: CHUNK_SIZE,
  };
  sendMessage(channel, metadata);

  let sentBytes = 0;
  let index = 0;
  for await (const chunk of chunkFile(file, metadata.chunkSize)) {
    await waitForBuffer(channel);
    sendMessage(channel, { type: "chunk", index: index++ });
    channel.send(chunk);
    sentBytes += chunk.byteLength;
    onProgress?.(sentBytes, file.size);
  }
  sendMessage(channel, { type: "complete" });
}
