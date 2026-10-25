import {
  ArrowLeft,
  Check,
  Image as ImageIcon,
  Send,
  UploadCloud,
  Video,
  X,
} from "lucide-react";
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
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState("");
  useEffect(() => {
    if (!file) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  function chooseFile(next: File | null) {
    if (busy) return;
    setError("");
    if (!next) return;
    const max =
      next.type === "image/webp" ? 10 * 1024 * 1024 : 50 * 1024 * 1024;
    if (
      !["video/mp4", "video/webm", "image/webp"].includes(next.type) ||
      next.size === 0 ||
      next.size > max
    ) {
      setError(
        "Choose an MP4 or WebM up to 50 MB, or a WebP image up to 10 MB.",
      );
      return;
    }
    setFile(next);
    setAssetId("");
    setProgress(0);
  }
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
        aria-describedby="r2-description"
      >
        <header className="quick-post-header">
          <div>
            <span className="quick-post-eyebrow">ROFFLE MEDIA</span>
            <h2 id="r2-title">Something worth sharing?</h2>
            <p id="r2-description" className="r2-subtitle">
              Drop in a clip or image. Give it a title. Let it loose.
            </p>
          </div>
          <button
            autoFocus
            className="quick-post-close"
            type="button"
            disabled={busy}
            onClick={onClose}
            aria-label="Back to post types"
          >
            <X size={22} />
          </button>
        </header>
        <form onSubmit={submit} className="r2-form">
          <div className="r2-body">
            <div className="r2-format-chips">
              <span>
                <Video size={17} /> MP4 / WebM
              </span>
              <span>
                <ImageIcon size={17} /> WebP
              </span>
            </div>
            <input
              ref={fileRef}
              type="file"
              className="r2-file-input"
              tabIndex={-1}
              disabled={busy}
              accept="video/mp4,video/webm,image/webp"
              aria-label="Select video or WebP file"
              onChange={(e) => chooseFile(e.target.files?.[0] || null)}
            />
            <div
              className={`r2-dropzone ${dragging ? "is-dragging" : ""} ${file ? "has-file" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                if (!busy) setDragging(true);
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node))
                  setDragging(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                chooseFile(e.dataTransfer.files[0] || null);
              }}
            >
              {file ? (
                <>
                  <span className="r2-file-status">
                    <Check size={18} /> Ready to post
                  </span>
                  <strong className="r2-filename">{file.name}</strong>
                  <span>
                    {(file.size / 1024 / 1024).toFixed(1)} MB ·{" "}
                    {file.type === "image/webp" ? "WebP image" : "Video clip"}
                  </span>
                  <button
                    className="r2-secondary"
                    type="button"
                    disabled={busy}
                    onClick={() => fileRef.current?.click()}
                  >
                    Choose a different file
                  </button>
                </>
              ) : (
                <>
                  <span className="r2-drop-icon">
                    <UploadCloud size={30} />
                  </span>
                  <strong>Drag your file here</strong>
                  <span>Or pick something from your device.</span>
                  <button
                    className="r2-primary"
                    type="button"
                    disabled={busy}
                    onClick={() => fileRef.current?.click()}
                  >
                    Choose file
                  </button>
                </>
              )}
              <small>Videos up to 50 MB · WebP images up to 10 MB</small>
            </div>
            {file && preview && (
              <div className="r2-preview">
                {file.type.startsWith("video/") ? (
                  <video
                    src={preview}
                    controls
                    playsInline
                    preload="metadata"
                    aria-label="Selected video preview"
                  />
                ) : (
                  <img src={preview} alt="Selected image preview" />
                )}
              </div>
            )}
            <label className="r2-field">
              <span>
                Title <span className="r2-required">Required</span>
              </span>
              <input
                required
                maxLength={180}
                placeholder="What's this one called?"
                value={title}
                disabled={busy}
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>
            <label className="r2-field">
              <span>
                Caption <span className="r2-optional">Optional</span>
              </span>
              <textarea
                maxLength={500}
                rows={3}
                placeholder="A little context. Or let the clip do the talking."
                value={body}
                disabled={busy}
                onChange={(e) => setBody(e.target.value)}
              />
              <small className="r2-character-count">{body.length} / 500</small>
            </label>
            <label className="r2-field">
              <span>Category</span>
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
              <p className="r2-notice">
                No active categories yet. Add one in admin before posting.
              </p>
            )}
            {error && (
              <p className="r2-error" role="alert">
                {error}
              </p>
            )}
            {busy && (
              <div className="r2-progress" role="status">
                <div className="r2-progress-label">
                  <strong>
                    {progress < 100
                      ? "Sending your file…"
                      : "Finishing your post…"}
                  </strong>
                  <span>{progress}%</span>
                </div>
                <progress
                  max={100}
                  value={progress}
                  aria-label="File transfer progress"
                />
              </div>
            )}
          </div>
          <footer className="r2-footer">
            <button
              className="r2-secondary"
              type="button"
              disabled={busy}
              onClick={onClose}
            >
              <ArrowLeft size={17} /> Back
            </button>
            <button
              className="r2-primary"
              disabled={busy || !file || !category || !title.trim()}
              type="submit"
            >
              <Send size={17} />
              {busy ? "Posting…" : assetId ? "Retry post" : "Post to ROFFLE"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}
