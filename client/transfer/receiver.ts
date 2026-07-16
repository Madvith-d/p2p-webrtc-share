import { assembleFile, downloadFile } from "./assembler";
import { parseMessage, type FileMetadata } from "./protocol";

export class FileReceiver {
  private metadata: FileMetadata | null = null;
  private chunks: ArrayBuffer[] = [];
  private pendingIndex: number | null = null;
  private receivedBytes = 0;

  constructor(private onProgress?: (received: number, total: number) => void) {}

  receive(data: string | ArrayBuffer) {
    if (typeof data !== "string") return this.receiveChunk(data);

    const message = parseMessage(data);
    if (message.type === "metadata") {
      // ponytail: version 1 receives one file at a time; add transfer IDs before multiplexing.
      if (this.metadata) throw new Error("A transfer is already in progress");
      this.metadata = message;
      this.chunks = new Array(Math.ceil(message.fileSize / message.chunkSize));
      this.receivedBytes = 0;
    } else if (message.type === "chunk") {
      if (!this.metadata || this.pendingIndex !== null || message.index >= this.chunks.length) {
        throw new Error("Invalid chunk header");
      }
      this.pendingIndex = message.index;
    } else {
      if (!this.metadata || this.pendingIndex !== null) throw new Error("Transfer is incomplete");
      const file = assembleFile(this.metadata, this.chunks);
      downloadFile(file, this.metadata.fileName);
      this.reset();
      return file;
    }
  }

  private receiveChunk(chunk: ArrayBuffer) {
    if (!this.metadata || this.pendingIndex === null || this.chunks[this.pendingIndex]) {
      throw new Error("Unexpected file data");
    }
    const expectedSize = Math.min(this.metadata.chunkSize, this.metadata.fileSize - this.pendingIndex * this.metadata.chunkSize);
    if (chunk.byteLength !== expectedSize) throw new Error("Invalid chunk size");
    this.chunks[this.pendingIndex] = chunk;
    this.pendingIndex = null;
    this.receivedBytes += chunk.byteLength;
    this.onProgress?.(this.receivedBytes, this.metadata.fileSize);
  }

  private reset() {
    this.metadata = null;
    this.chunks = [];
    this.pendingIndex = null;
    this.receivedBytes = 0;
  }
}
