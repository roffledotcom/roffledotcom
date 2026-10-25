import test from "node:test";
import assert from "node:assert/strict";
import { validateFile, matchesSignature } from "../server/media-policy.js";
test("upload limits reject oversized files, unsupported types, empty/fractional sizes", () => {
  for (const [type, max] of [
    ["video/mp4", 52428800],
    ["video/webm", 52428800],
    ["image/webp", 10485760],
  ]) {
    assert.doesNotThrow(() => validateFile(type, max));
    assert.throws(() => validateFile(type, max + 1));
    assert.throws(() => validateFile(type, 0));
    assert.throws(() => validateFile(type, 1.5));
  }
  assert.throws(() => validateFile("text/html", 10));
  assert.throws(() => validateFile("image/svg+xml", 10));
});
test("file signatures distinguish video, WebP and disguised HTML", () => {
  assert.ok(
    matchesSignature(
      "video/mp4",
      Buffer.from("000000186674797069736f6d", "hex"),
    ),
  );
  assert.ok(matchesSignature("video/webm", Buffer.from("1a45dfa3", "hex")));
  assert.ok(matchesSignature("image/webp", Buffer.from("RIFF0000WEBP")));
  for (const type of ["video/mp4", "video/webm", "image/webp"])
    assert.equal(
      matchesSignature(type, Buffer.from("<html>bad file</html>")),
      false,
    );
  assert.equal(
    matchesSignature("image/webp", Buffer.from("RIFF0000WAVE")),
    false,
  );
});
