import UploadedMedia from "../posts/UploadedMedia";
import {
  useEffect,
  useState,
} from "react";

import {
  RefreshCw,
  RotateCcw,
  Trash2,
} from "lucide-react";

import {
  getRejectedPosts,
  permanentlyDeleteRejectedPost,
  restoreRejectedPost,
} from "../../services/admin";

import type {
  RejectedPost,
} from "../../types/admin";


/* ==========================================================
   ROFFLE ADMIN
   REJECTED POSTS
   ========================================================== */


export default function RejectedPosts() {
  const [
    posts,
    setPosts,
  ] =
    useState<RejectedPost[]>(
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
          await getRejectedPosts()
        );
      } catch (
        nextError
      ) {
        setError(
          nextError
            instanceof Error
            ? nextError.message
            : "Could not load rejected posts."
        );
      } finally {
        setLoading(false);
      }
    };


  useEffect(() => {
    void load();
  }, []);


  const restore =
    async (
      postId:
        string
    ) => {
      setWorkingId(
        postId
      );

      try {
        await restoreRejectedPost(
          postId
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
      } catch (
        nextError
      ) {
        setError(
          nextError
            instanceof Error
            ? nextError.message
            : "Could not restore post."
        );
      } finally {
        setWorkingId(
          null
        );
      }
    };


  const remove =
    async (
      postId:
        string
    ) => {
      const confirmed =
        window.confirm(
          "Permanently delete this rejected post? This cannot be undone."
        );

      if (!confirmed) {
        return;
      }

      setWorkingId(
        postId
      );

      try {
        await permanentlyDeleteRejectedPost(
          postId
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
      } catch (
        nextError
      ) {
        setError(
          nextError
            instanceof Error
            ? nextError.message
            : "Could not delete rejected post."
        );
      } finally {
        setWorkingId(
          null
        );
      }
    };


  return (
    <section className="admin-panel">
      <header className="admin-panel-header">
        <div>
          <span className="admin-eyebrow">
            REJECTED
          </span>

          <h2>
            Rejected posts
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
          Loading rejected posts...
        </div>
      ) : posts.length ===
        0 ? (
        <div className="admin-empty">
          No rejected posts.
        </div>
      ) : (
        <div className="rejected-post-list">
          {posts.map(
            (
              post
            ) => {
              const author =
                post.profiles
                  ?.username
                  ? `@${post.profiles.username}`
                  : post.profiles
                      ?.display_name ??
                    "ROFFLE User";

              return (
                <article
                  className="rejected-post-card"
                  key={
                    post.id
                  }
                >
                  <div className="rejected-post-meta">
                    <span>
                      {post.post_type}
                    </span>

                    <span>
                      {author}
                    </span>

                    <span>
                      {post.moderated_at
                        ? new Date(
                            post.moderated_at
                          ).toLocaleString()
                        : "Rejected"}
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
                    </a>
                  )}

                  {post.moderation_note && (
                    <div className="rejected-note">
                      {post.moderation_note}
                    </div>
                  )}

                  <div className="rejected-post-actions">
                    <button
                      className="restore"
                      type="button"
                      disabled={
                        workingId ===
                        post.id
                      }
                      onClick={() => {
                        void restore(
                          post.id
                        );
                      }}
                    >
                      <RotateCcw
                        size={14}
                      />

                      Restore
                    </button>

                    <button
                      className="permanent-delete"
                      type="button"
                      disabled={
                        workingId ===
                        post.id
                      }
                      onClick={() => {
                        void remove(
                          post.id
                        );
                      }}
                    >
                      <Trash2
                        size={14}
                      />

                      Delete permanently
                    </button>
                  </div>
                </article>
              );
            }
          )}
        </div>
      )}
    </section>
  );
}
