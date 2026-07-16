import type { FileMetadata } from "./protocol";

export function assembleFile(metadata: FileMetadata, chunks: ArrayBuffer[]) {
  const expectedChunks = Math.ceil(metadata.fileSize / metadata.chunkSize);
  const receivedBytes = chunks.reduce((total, chunk) => total + chunk.byteLength, 0);
  if (chunks.length !== expectedChunks || chunks.some((chunk) => !chunk) || receivedBytes !== metadata.fileSize) {
    throw new Error("Transfer incomplete: one or more chunks are missing");
  }
  return new Blob(chunks, { type: metadata.mimeType });
}

export function downloadFile(file: Blob, fileName: string) {
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
