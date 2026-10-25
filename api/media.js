import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createClient } from "@supabase/supabase-js";
import { validateFile, matchesSignature } from "../server/media-policy.js";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function check(result) {
  if (result.error) throw new Error(result.error.message);
  return result.data;
}
function configuration() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const {
    R2_ENDPOINT,
    R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY,
    R2_BUCKET_NAME,
  } = process.env;
  if (
    ![
      url,
      key,
      secret,
      R2_ENDPOINT,
      R2_ACCESS_KEY_ID,
      R2_SECRET_ACCESS_KEY,
      R2_BUCKET_NAME,
    ].every(Boolean)
  )
    throw new Error(
      "Media hosting is not configured. Check the server environment variables.",
    );
  return {
    url,
    key,
    secret,
    bucket: R2_BUCKET_NAME,
    s3: new S3Client({
      region: "auto",
      endpoint: R2_ENDPOINT,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
      requestChecksumCalculation: "WHEN_REQUIRED",
      responseChecksumValidation: "WHEN_REQUIRED",
    }),
  };
}
export async function GET(request) {
  try {
    const c = configuration();
    const id = new URL(request.url).searchParams.get("post");
    if (!uuid.test(id || ""))
      return Response.json({ error: "Invalid post." }, { status: 400 });
    const authorization = request.headers.get("authorization");
    const db = createClient(c.url, c.key, {
      global: {
        headers: authorization ? { Authorization: authorization } : {},
      },
      auth: { persistSession: false },
    });
    // Read the post with the visitor's RLS permissions before signing private media.
    const post = check(
      await db
        .from("posts")
        .select("media_asset_id")
        .eq("id", id)
        .maybeSingle(),
    );
    if (!post?.media_asset_id)
      return Response.json({ error: "Media not found." }, { status: 404 });
    const admin = createClient(c.url, c.secret, {
      auth: { persistSession: false },
    });
    const asset = check(
      await admin
        .from("media_assets")
        .select("*")
        .eq("id", post.media_asset_id)
        .eq("status", "ready")
        .single(),
    );
    const url = await getSignedUrl(
      c.s3,
      new GetObjectCommand({
        Bucket: c.bucket,
        Key: asset.object_key,
        ResponseContentType: asset.content_type,
      }),
      { expiresIn: 3600 },
    );
    return Response.json(
      { url },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (e) {
    console.error("Roffle media read failed", e.name);
    return Response.json({ error: "Could not load media." }, { status: 500 });
  }
}
export async function POST(request) {
  let c, admin, asset;
  try {
    c = configuration();
    const auth = request.headers.get("authorization") || "";
    if (!auth.startsWith("Bearer "))
      return Response.json({ error: "Sign in to upload." }, { status: 401 });
    const db = createClient(c.url, c.key, {
      global: { headers: { Authorization: auth } },
      auth: { persistSession: false },
    });
    const user = check(await db.auth.getUser(auth.slice(7)))?.user;
    if (!user)
      return Response.json({ error: "Sign in again." }, { status: 401 });
    const access = check(
      await db
        .from("user_roles")
        .select("role,account_status")
        .eq("user_id", user.id)
        .single(),
    );
    if (access.account_status !== "active")
      return Response.json(
        { error: "Active account required." },
        { status: 403 },
      );
    admin = createClient(c.url, c.secret, { auth: { persistSession: false } });
    if (Number(request.headers.get("content-length") || 0) > 16384)
      return Response.json({ error: "Request too large." }, { status: 413 });
    const b = await request.json();
    if (b.action === "sign") {
      validateFile(b.contentType, b.bytes);
      asset = check(
        await admin.rpc("reserve_media_upload", {
          owner_id: user.id,
          mime: b.contentType,
          file_bytes: b.bytes,
        }).single(),
      );
      const url = await getSignedUrl(
        c.s3,
        new PutObjectCommand({
          Bucket: c.bucket,
          Key: "staging/" + asset.object_key,
          ContentType: asset.content_type,
          ContentLength: asset.bytes,
        }),
        { expiresIn: 300 },
      );
      return Response.json(
        { assetId: asset.id, url },
        { headers: { "Cache-Control": "no-store" } },
      );
    }
    if (b.action !== "finish" || !uuid.test(b.assetId || ""))
      return Response.json(
        { error: "Invalid upload request." },
        { status: 400 },
      );
    asset = check(
      await admin
        .from("media_assets")
        .select("*")
        .eq("id", b.assetId)
        .eq("user_id", user.id)
        .single(),
    );
    if (asset.status === "failed")
      throw new Error("This upload failed. Start again.");
    const existing = check(
      await db
        .from("posts")
        .select("*")
        .eq("media_asset_id", asset.id)
        .maybeSingle(),
    );
    if (existing) return Response.json({ post: existing });
    if (
      typeof b.title !== "string" ||
      b.title.trim().length < 1 ||
      b.title.trim().length > 180 ||
      typeof b.body !== "string" ||
      b.body.length > 500
    )
      throw new Error(
        "Enter a title (1–180 characters) and a caption up to 500 characters.",
      );
    if (!uuid.test(b.categoryId || "")) throw new Error("Choose a category.");
    if (asset.status === "uploading") {
      if (Date.now() - Date.parse(asset.created_at) > 60 * 60 * 1000)
        throw new Error("Upload expired. Start again.");
      const staging = "staging/" + asset.object_key;
      const head = await c.s3.send(
        new HeadObjectCommand({ Bucket: c.bucket, Key: staging }),
      );
      if (
        head.ContentLength !== Number(asset.bytes) ||
        head.ContentType !== asset.content_type
      )
        throw new Error(
          "Uploaded file does not match the approved type or size.",
        );
      const sample = await c.s3.send(
        new GetObjectCommand({
          Bucket: c.bucket,
          Key: staging,
          Range: "bytes=0-63",
        }),
      );
      if (
        !matchesSignature(
          asset.content_type,
          await sample.Body.transformToByteArray(),
        )
      )
        throw new Error("The file content does not match its format.");
      // Copy to a final key which the browser's temporary upload URL cannot overwrite.
      await c.s3.send(
        new CopyObjectCommand({
          Bucket: c.bucket,
          Key: asset.object_key,
          CopySource:
            c.bucket +
            "/" +
            staging.split("/").map(encodeURIComponent).join("/"),
          ContentType: asset.content_type,
          MetadataDirective: "REPLACE",
        }),
      );
      check(
        await admin
          .from("media_assets")
          .update({ status: "ready" })
          .eq("id", asset.id),
      );
      await c.s3.send(
        new DeleteObjectCommand({ Bucket: c.bucket, Key: staging }),
      );
    }
    const post = check(
      await db
        .from("posts")
        .insert({
          user_id: user.id,
          post_type: asset.content_type.startsWith("video/")
            ? "upload_video"
            : "image",
          media_asset_id: asset.id,
          title: b.title.trim(),
          body: b.body.trim() || null,
          category_id: b.categoryId,
          display_size: "large",
        })
        .select("*")
        .single(),
    );
    return Response.json({ post });
  } catch (e) {
    console.error("Roffle media upload failed", e.name);
    return Response.json(
      { error: e.message || "Upload failed." },
      { status: 400 },
    );
  }
}
