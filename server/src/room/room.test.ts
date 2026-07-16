import assert from "node:assert/strict";
import test from "node:test";
import { RoomManager } from "./room";

test("finds only the other peer in the requested room", () => {
  const rooms = new RoomManager();
  const first = rooms.createRoom({ name: "Host", socketId: "host" });
  const second = rooms.createRoom({ name: "Other host", socketId: "other-host" });

  assert.equal(rooms.addPeerToRoom(first.roomId, { name: "Guest", socketId: "guest" }).ok, true);
  assert.equal(rooms.addPeerToRoom(first.roomId, { name: "Host", socketId: "host" }).ok, true);
  assert.equal(rooms.getOtherPeer(first.roomId, "host")?.socketId, "guest");
  assert.equal(rooms.getOtherPeer(second.roomId, "host"), undefined);
});
