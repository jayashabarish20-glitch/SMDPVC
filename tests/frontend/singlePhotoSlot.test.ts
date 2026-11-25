// Run: node --test tests/frontend/singlePhotoSlot.test.ts
// In-memory fake of the backend photo contract: (config_key, display_order) unique,
// DELETE unknown config -> 404, DELETE media still referenced -> 409.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  replaceSingleSlotPhoto,
  clearSingleSlotPhoto,
  type SingleSlotApi,
  type SlotConfig,
} from "../../src/services/singlePhotoSlot.ts";

const KEY = "principal.higherSecondary";

function httpError(status: number, message: string) {
  return Object.assign(new Error(message), { status });
}

function makeBackend(initial: { configs?: (SlotConfig & { key: string })[]; media?: string[] } = {}) {
  let seq = 0;
  const configs = [...(initial.configs ?? [])];
  const media = new Set(initial.media ?? configs.map((c) => c.mediaId));
  const calls: string[] = [];
  const fail: Partial<Record<keyof SingleSlotApi, Error>> = {};

  const api: SingleSlotApi = {
    async listConfigs(key) {
      calls.push("list");
      return configs.filter((c) => c.key === key).map(({ configId, mediaId, displayOrder }) => ({ configId, mediaId, displayOrder }));
    },
    async uploadMedia() {
      calls.push("upload");
      if (fail.uploadMedia) throw fail.uploadMedia;
      const id = `media-new-${++seq}`;
      media.add(id);
      return { id };
    },
    async assign(mediaId, key, order) {
      calls.push(`assign:${order}`);
      if (fail.assign) throw fail.assign;
      if (configs.some((c) => c.key === key && c.displayOrder === order)) {
        throw httpError(409, `A photo already exists at ${key} with display_order ${order}`);
      }
      const configId = `cfg-new-${++seq}`;
      configs.push({ key, configId, mediaId, displayOrder: order });
      return { id: configId };
    },
    async unlink(configId) {
      calls.push(`unlink:${configId}`);
      if (fail.unlink) throw fail.unlink;
      const i = configs.findIndex((c) => c.configId === configId);
      if (i < 0) throw httpError(404, `Photo configuration with id ${configId} not found`);
      configs.splice(i, 1);
    },
    async reorder(configId, order) {
      calls.push(`reorder:${order}`);
      if (fail.reorder) throw fail.reorder;
      const c = configs.find((x) => x.configId === configId)!;
      if (configs.some((x) => x !== c && x.key === c.key && x.displayOrder === order)) {
        throw httpError(409, "conflict");
      }
      c.displayOrder = order;
    },
    async deleteMedia(id) {
      calls.push(`deleteMedia:${id}`);
      if (configs.some((c) => c.mediaId === id)) throw httpError(409, "Image is still referenced by website content");
      media.delete(id);
    },
  };
  return { api, configs, media, calls, fail };
}

const file = new File(["x"], "p.png", { type: "image/png" });
const OLD = { key: KEY, configId: "cfg-old", mediaId: "media-old", displayOrder: 0 };

test("first-time assignment goes straight to display_order 0", async () => {
  const b = makeBackend();
  const result = await replaceSingleSlotPhoto(b.api, file, KEY);
  assert.deepEqual(result.warnings, []);
  assert.equal(b.configs.length, 1);
  assert.equal(b.configs[0].displayOrder, 0);
  assert.ok(!b.calls.some((c) => c.startsWith("reorder")));
});

test("replacing an existing photo never assigns a second config to the occupied slot", async () => {
  const b = makeBackend({ configs: [OLD] });
  const result = await replaceSingleSlotPhoto(b.api, file, KEY);
  assert.deepEqual(result.warnings, []);
  assert.deepEqual(b.calls, ["list", "upload", "assign:1", "unlink:cfg-old", "reorder:0", "deleteMedia:media-old"]);
  assert.equal(b.configs.length, 1);
  assert.equal(b.configs[0].displayOrder, 0);
  assert.notEqual(b.configs[0].mediaId, "media-old");
  assert.ok(!b.media.has("media-old"));
});

test("uses fresh server state, not a stale client-side config id (the reported 404/409 bug)", async () => {
  // Server already holds a different config at slot 0 than the one the UI cached.
  const b = makeBackend({ configs: [{ ...OLD, configId: "cfg-actual" }] });
  await replaceSingleSlotPhoto(b.api, file, KEY);
  assert.ok(b.calls.includes("unlink:cfg-actual"));
  assert.equal(b.configs.length, 1);
  assert.equal(b.configs[0].displayOrder, 0);
});

test("assign failure: old photo stays linked and the new upload is removed", async () => {
  const b = makeBackend({ configs: [OLD] });
  b.fail.assign = httpError(500, "db down");
  await assert.rejects(replaceSingleSlotPhoto(b.api, file, KEY), /db down/);
  assert.deepEqual(b.configs, [OLD]);
  assert.deepEqual([...b.media], ["media-old"]);
});

test("upload failure: nothing changes", async () => {
  const b = makeBackend({ configs: [OLD] });
  b.fail.uploadMedia = httpError(502, "cloudinary down");
  await assert.rejects(replaceSingleSlotPhoto(b.api, file, KEY), /cloudinary down/);
  assert.deepEqual(b.configs, [OLD]);
});

test("unlink of old config fails (non-404): rolled back, old photo preserved", async () => {
  const b = makeBackend({ configs: [OLD] });
  const realUnlink = b.api.unlink;
  b.api.unlink = async (id) => {
    if (id === "cfg-old") throw httpError(500, "boom");
    return realUnlink(id);
  };
  await assert.rejects(replaceSingleSlotPhoto(b.api, file, KEY), /previous photo was kept/);
  assert.deepEqual(b.configs, [OLD]);
  assert.deepEqual([...b.media], ["media-old"]);
});

test("old config already gone (404) does not block a valid replacement", async () => {
  const b = makeBackend({ configs: [OLD] });
  const realUnlink = b.api.unlink;
  b.api.unlink = async (id) => {
    if (id === "cfg-old") {
      b.configs.splice(b.configs.findIndex((c) => c.configId === id), 1); // removed concurrently
      throw httpError(404, "not found");
    }
    return realUnlink(id);
  };
  await replaceSingleSlotPhoto(b.api, file, KEY);
  assert.equal(b.configs.length, 1);
  assert.equal(b.configs[0].displayOrder, 0);
  // Old media was not unlinked by us, so it is not deleted by us.
  assert.ok(!b.calls.includes("deleteMedia:media-old"));
});

test("old media still referenced elsewhere is kept and reported as a warning", async () => {
  const b = makeBackend({ configs: [OLD, { key: "other.section", configId: "cfg-x", mediaId: "media-old", displayOrder: 0 }] });
  const result = await replaceSingleSlotPhoto(b.api, file, KEY);
  assert.ok(b.media.has("media-old"));
  assert.equal(result.warnings.length, 1);
});

test("clear removes the server's actual config, tolerating 404", async () => {
  const b = makeBackend({ configs: [OLD] });
  await clearSingleSlotPhoto(b.api, KEY);
  assert.equal(b.configs.length, 0);
  assert.ok(!b.media.has("media-old"));
});
