import { useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabase";
import type { PostRecord } from "../../types/post";
export default function R2UploadDialog({
  onClose,
  onPosted,
}: {
  onClose: () => void;
  onPosted: (p: PostRecord) => void;
}) {
  const [file, setFile] = useState<File | null>(null),
    [title, setTitle] = useState(""),
    [body, setBody] = useState(""),
    [category, setCategory] = useState(""),
    [categories, setCategories] = useState<{ id: string; name: string }[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [progress, setProgress] = useState(0),
    [assetId, setAssetId] = useState("");
  const xhrRef = useRef<XMLHttpRequest | null>(null),
    alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    void supabase
      .from("post_categories")
      .select("id,name")
      .eq("active", true)
      .order("sort_order")
      .then(({ data, error }) => {
        if (alive.current) {
          if (error) setError(error.message);
          else setCategories(data || []);
        }
      });
    return () => {
      alive.current = false;
      xhrRef.current?.abort();
    };
  }, []);
  useEffect(() => {
    const close = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [busy, onClose]);
  async function submit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy || !file) return;
    setBusy(true);
    setError("");
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session) throw new Error("Sign in to upload.");
      const headers = {
        Authorization: "Bearer " + data.session.access_token,
        "Content-Type": "application/json",
      };
      const call = async (payload: unknown) => {
        const res = await fetch("/api/media", {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Upload failed.");
        return data;
      };
      let id = assetId;
      if (!id) {
        const signed = await call({
          action: "sign",
          contentType: file.type,
          bytes: file.size,
        });
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhrRef.current = xhr;
          xhr.open("PUT", signed.url);
          xhr.setRequestHeader("Content-Type", file.type);
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable && alive.current)
              setProgress(Math.round((e.loaded / e.total) * 100));
          };
          xhr.onload = () =>
            xhr.status >= 200 && xhr.status < 300
              ? resolve()
              : reject(
                  new Error(
                    "R2 rejected the upload. Check bucket CORS and retry.",
                  ),
                );
          xhr.onerror = () =>
            reject(
              new Error(
                "Upload failed. Check your connection and R2 CORS settings.",
              ),
            );
          xhr.onabort = () => reject(new Error("Upload cancelled."));
          xhr.send(file);
        });
        id = signed.assetId;
        if (alive.current) setAssetId(id);
      }
      const finished = await call({
        action: "finish",
        assetId: id,
        title,
        body,
        categoryId: category,
      });
      if (alive.current) onPosted(finished.post);
    } catch (e) {
      if (alive.current)
        setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      if (alive.current) setBusy(false);
    }
  }
  return (
    <div className="quick-post-backdrop">
      <section
        className="quick-post-dialog r2-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="r2-title"
      >
        <header className="quick-post-header">
          <h2 id="r2-title">Upload a video or WebP</h2>
          <button
            autoFocus
            type="button"
            disabled={busy}
            onClick={onClose}
            aria-label="Close upload"
          >
            ×
          </button>
        </header>
        <form onSubmit={submit} className="r2-form">
          <label>
            File
            <input
              required
              type="file"
              disabled={busy}
              accept="video/mp4,video/webm,image/webp"
              onChange={(e) => {
                setFile(e.target.files?.[0] || null);
                setAssetId("");
                setProgress(0);
              }}
            />
          </label>
          <p>
            MP4 / WebM: up to 50 MB. WebP images: up to 10 MB. Videos retain
            their original format.
          </p>
          <label>
            Title
            <input
              required
              maxLength={180}
              value={title}
              disabled={busy}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <label>
            Caption
            <textarea
              maxLength={500}
              value={body}
              disabled={busy}
              onChange={(e) => setBody(e.target.value)}
            />
          </label>
          <label>
            Category
            <select
              required
              value={category}
              disabled={busy}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">Choose a category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          {!categories.length && (
            <p>Create an active post category in admin before uploading.</p>
          )}
          {error && <p role="alert">{error}</p>}
          {busy && (
            <p role="status">
              {progress < 100
                ? `Uploading: ${progress}%`
                : "Checking file and creating post…"}
            </p>
          )}
          <button disabled={busy || !file || !category} type="submit">
            {busy
              ? "Uploading…"
              : assetId
                ? "Retry creating post"
                : "Upload and post"}
          </button>
        </form>
      </section>
    </div>
  );
}
