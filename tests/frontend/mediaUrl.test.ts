// Run: node --test tests/frontend/mediaUrl.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { mediaUrl, cloudinaryDownloadUrl } from "../../src/utils/mediaUrl.ts";

const PDF = "https://res.cloudinary.com/v8lwfibg/image/upload/v1795605542/hnhdfnz2quecvorw1dtb.pdf";

test("reads the imageUrl alias the backend actually serializes", () => {
  // Shape copied from live GET /api/public/sports response.
  assert.equal(mediaUrl({ imageUrl: "https://res.cloudinary.com/x/image/upload/a.png" }), "https://res.cloudinary.com/x/image/upload/a.png");
});

test("falls back to image_url", () => {
  assert.equal(mediaUrl({ image_url: "https://e.com/a.png" }), "https://e.com/a.png");
});

test("missing media / missing URL / non-http URL -> null (no broken link rendered)", () => {
  assert.equal(mediaUrl(null), null);
  assert.equal(mediaUrl(undefined), null);
  assert.equal(mediaUrl({}), null);
  assert.equal(mediaUrl({ imageUrl: "" }), null);
  assert.equal(mediaUrl({ imageUrl: "javascript:alert(1)" }), null);
});

test("cloudinary download URL inserts fl_attachment after /upload/", () => {
  assert.equal(
    cloudinaryDownloadUrl(PDF),
    "https://res.cloudinary.com/v8lwfibg/image/upload/fl_attachment/v1795605542/hnhdfnz2quecvorw1dtb.pdf",
  );
  assert.equal(
    cloudinaryDownloadUrl("https://res.cloudinary.com/c/raw/upload/v1/doc.pdf"),
    "https://res.cloudinary.com/c/raw/upload/fl_attachment/v1/doc.pdf",
  );
});

test("download URL is hidden for non-Cloudinary or missing URLs", () => {
  assert.equal(cloudinaryDownloadUrl(null), null);
  assert.equal(cloudinaryDownloadUrl("https://example.com/doc.pdf"), null);
});
