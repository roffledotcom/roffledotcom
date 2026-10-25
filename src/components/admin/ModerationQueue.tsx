import UploadedMedia from "../posts/UploadedMedia";
import {
  useEffect,
  useState,
} from "react";

import {
  Check,
  ExternalLink,
  RefreshCw,
  X,
} from "lucide-react";

import {
  getModerationQueue,
  moderatePost,
} from "../../services/admin";

import type {
  ModerationPost,
} from "../../types/admin";


/* ==========================================================
   ROFFLE
   MODERATION QUEUE
   ========================================================== */


type Props = {
  limit?: number;

  onChanged?: () => void;

  onViewAll?: () => void;
};


export default function ModerationQueue({
  limit,
  onChanged,
  onViewAll,
}: Props) {
  const [
    posts,
    setPosts,
  ] =
    useState<ModerationPost[]>(
      []
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null
    );

  const [
    workingId,
    setWorkingId,
  ] =
    useState<string | null>(
      null
    );


  const load =
    async () => {
      setLoading(true);
      setError(null);

      try {
        setPosts(
          await getModerationQueue()
        );
      } catch (
        nextError
      ) {
        setError(
          nextError
            instanceof Error
            ? nextError.message
            : "Could not load moderation queue."
        );
      } finally {
        setLoading(false);
      }
    };


  useEffect(() => {
    void load();
  }, []);


  const decide =
    async (
      postId: string,
      decision:
        | "approved"
        | "rejected"
    ) => {
      setWorkingId(
        postId
      );

      setError(null);

      try {
        await moderatePost(
          postId,
          decision
        );

        setPosts(
          (
            current
          ) =>
            current.filter(
              (
                post
              ) =>
                post.id !==
                postId
            )
        );

        onChanged?.();
      } catch (
        nextError
      ) {
        setError(
          nextError
            instanceof Error
            ? nextError.message
            : "Moderation failed."
        );
      } finally {
        setWorkingId(
          null
        );
      }
    };


  const visiblePosts =
    typeof limit ===
      "number"
      ? posts.slice(
          0,
          limit
        )
      : posts;


  return (
    <section className="admin-panel">
      <header className="admin-panel-header">
        <div>
          <span className="admin-eyebrow">
            MODERATION
          </span>

          <h2>
            Pending posts
          </h2>
        </div>

        <button
          className="admin-secondary-button"
          type="button"
          onClick={() => {
            void load();
          }}
        >
          <RefreshCw
            size={14}
          />

          Refresh
        </button>
      </header>

      {error && (
        <div className="admin-error">
          {error}
        </div>
      )}

      {loading ? (
        <div className="admin-empty">
          Loading queue...
        </div>
      ) : posts.length ===
        0 ? (
        <div className="admin-empty">
          Nothing waiting for judgment. Suspiciously peaceful.
        </div>
      ) : (
        <div className="moderation-list">
          {visiblePosts.map(
            (
              post
            ) => {
              const author =
                post.profiles
                  ?.username ??
                post.profiles
                  ?.display_name ??
                "ROFFLE User";

              return (
                <article
                  className="moderation-card"
                  key={
                    post.id
                  }
                >
                  <div className="moderation-meta">
                    <span>
                      {post.post_type}
                    </span>

                    <span>
                      @{author}
                    </span>

                    <span>
                      {new Date(
                        post.created_at
                      ).toLocaleString()}
                    </span>
                  </div>

                  <h3>
                    {post.title ??
                      "Untitled nonsense"}
                  </h3>

                  {post.body && (
                    <p>
                      {post.body}
                    </p>
                  )}

                  {post.media_asset_id && <UploadedMedia postId={post.id} video={post.post_type === "upload_video"} title={post.title || "Uploaded media"} />}
                  {post.image_url && (
                    <img
                      className="moderation-image"
                      src={
                        post.image_url
                      }
                      alt=""
                    />
                  )}

                  {post.youtube_url && (
                    <a
                      className="moderation-source"
                      href={
                        post.youtube_url
                      }
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open YouTube
                      <ExternalLink
                        size={13}
                      />
                    </a>
                  )}

                  <div className="moderation-actions">
                    <button
                      className="approve"
                      type="button"
                      disabled={
                        workingId ===
                        post.id
                      }
                      onClick={() => {
                        void decide(
                          post.id,
                          "approved"
                        );
                      }}
                    >
                      <Check
                        size={15}
                      />

                      Approve
                    </button>

                    <button
                      className="reject"
                      type="button"
                      disabled={
                        workingId ===
                        post.id
                      }
                      onClick={() => {
                        void decide(
                          post.id,
                          "rejected"
                        );
                      }}
                    >
                      <X
                        size={15}
                      />

                      Reject
                    </button>
                  </div>
                </article>
              );
            }
          )}
        </div>
      )}

      {typeof limit ===
        "number" &&
        posts.length >
          limit &&
        onViewAll && (
        <div className="moderation-queue-footer">
          <button
            className="admin-secondary-button"
            type="button"
            onClick={
              onViewAll
            }
          >
            View all pending posts
          </button>
        </div>
      )}
    </section>
  );
}
