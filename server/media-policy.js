export const FILE_TYPES = {
  "video/mp4": { extension: "mp4", max: 50 * 1024 * 1024 },
  "video/webm": { extension: "webm", max: 50 * 1024 * 1024 },
  "image/webp": { extension: "webp", max: 10 * 1024 * 1024 },
};
export function validateFile(type, size) {
  if (
    !FILE_TYPES[type] ||
    !Number.isSafeInteger(size) ||
    size < 1 ||
    size > FILE_TYPES[type].max
  )
    throw new Error("Use MP4/WebM up to 50 MB or WebP up to 10 MB.");
}
export function matchesSignature(type, bytes) {
  const b = Buffer.from(bytes);
  if (type === "video/mp4")
    return b.length >= 12 && b.toString("ascii", 4, 8) === "ftyp";
  if (type === "video/webm")
    return (
      b.length >= 4 &&
      b.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))
    );
  return (
    type === "image/webp" &&
    b.length >= 12 &&
    b.toString("ascii", 0, 4) === "RIFF" &&
    b.toString("ascii", 8, 12) === "WEBP"
  );
}
