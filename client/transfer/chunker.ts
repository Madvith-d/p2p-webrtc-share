import { CHUNK_SIZE } from "./protocol";

export async function* chunkFile(file: File, chunkSize = CHUNK_SIZE) {
  for (let offset = 0; offset < file.size; offset += chunkSize) {
    yield file.slice(offset, offset + chunkSize).arrayBuffer();
  }
}
