import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
export default function UploadedMedia({
  postId,
  video,
  title,
}: {
  postId: string;
  video: boolean;
  title: string;
}) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [requested, setRequested] = useState(!video);
  useEffect(() => {
    if (!requested) return;
    let live = true;
    setLoading(true);
    void (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const res = await fetch(
          "/api/media?post=" + encodeURIComponent(postId),
          {
            headers: data.session
              ? { Authorization: "Bearer " + data.session.access_token }
              : {},
          },
        );
        const body = await res.json();
        if (!res.ok) throw new Error(body.error);
        if (live) setUrl(body.url);
      } catch (e) {
        if (live)
          setError(e instanceof Error ? e.message : "Media unavailable.");
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => {
      live = false;
    };
  }, [postId, requested]);
  if (error)
    return (
      <div role="alert">
        {error}{" "}
        <button
          type="button"
          onClick={() => {
            setError("");
            setRequested(false);
            setTimeout(() => setRequested(true), 0);
          }}
        >
          Retry
        </button>
      </div>
    );
  if (!requested)
    return (
      <button
        type="button"
        className="r2-play"
        onClick={() => setRequested(true)}
      >
        ▶ Play video
      </button>
    );
  if (loading || !url) return <p role="status">Loading media…</p>;
  return video ? (
    <video
      src={url}
      controls
      playsInline
      autoPlay
      preload="none"
      aria-label={title}
      style={{ width: "100%", maxHeight: 720, display: "block" }}
      onError={() =>
        setError(
          "Could not play this video. Its codec may not be supported by your browser.",
        )
      }
    />
  ) : (
    <img
      src={url}
      alt={title}
      loading="lazy"
      style={{
        maxWidth: "100%",
        maxHeight: 720,
        display: "block",
        margin: "auto",
      }}
    />
  );
}
