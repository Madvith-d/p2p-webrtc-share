export const CHUNK_SIZE = 64 * 1024;

export type FileMetadata = {
  type: "metadata";
  fileName: string;
  fileSize: number;
  mimeType: string;
  chunkSize: number;
};

export type FileChunk = {
  type: "chunk";
  index: number;
};

export type TransferComplete = {
  type: "complete";
};

export type TransferMessage = FileMetadata | FileChunk | TransferComplete;

export function parseMessage(data: string): TransferMessage {
  const message: unknown = JSON.parse(data);
  if (!message || typeof message !== "object" || !("type" in message)) {
    throw new Error("Invalid transfer message");
  }

  if (message.type === "metadata" &&
      "fileName" in message && typeof message.fileName === "string" && message.fileName.length > 0 &&
      "fileSize" in message && Number.isSafeInteger(message.fileSize) && (message.fileSize as number) >= 0 &&
      "mimeType" in message && typeof message.mimeType === "string" &&
      "chunkSize" in message && Number.isSafeInteger(message.chunkSize) && (message.chunkSize as number) > 0) {
    return message as FileMetadata;
  }
  if (message.type === "chunk" && "index" in message && Number.isSafeInteger(message.index) && (message.index as number) >= 0) {
    return message as FileChunk;
  }
  if (message.type === "complete") return { type: "complete" };
  throw new Error("Invalid transfer message");
}
