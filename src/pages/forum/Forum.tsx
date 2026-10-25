import ForumContentActions from "../../components/posts/ForumContentActions";
import {
  useEffect,
  useState,
  type ReactNode,
} from "react";

import type {
  Session,
} from "@supabase/supabase-js";

import {
  ChevronRight,
  Clock3,
  Eye,
  FolderOpen,
  Image as ImageIcon,
  Lock,
  MessageCircle,
  MessageSquare,
  Pin,
  Plus,
  Send,
  Trash2,
} from "lucide-react";

import {
  supabase,
} from "../../lib/supabase";

import SiteHeader from "../../components/layout/SiteHeader";
import GiphyPicker from "../../components/posts/GiphyPicker";
import QuickPostDialog from "../../components/posts/QuickPostDialog";

import type {
  GiphyGif,
} from "../../services/giphy";

import {
  getMyAccess,
} from "../../services/admin";

import {
  createForumReply,
  createForumThread,
  deleteForumReply,
  deleteForumThread,
  getCategoryForumThreads,
  getForumCategories,
  getForumCategory,
  getForumThread,
  getLatestForumThreads,
  incrementForumThreadView,
  setForumThreadControls,
} from "../../services/forum";

import type {
  UserRole,
} from "../../types/admin";

import type {
  ForumCategory,
  ForumReply,
  ForumThread,
  ForumThreadDetail,
} from "../../types/forum";

import "./Forum.css";


/* ==========================================================
   FORUM 001
   HELPERS
   ========================================================== */


function formatForumDate(
  value:
    string | null,
) {
  if (!value) {
    return "No activity yet";
  }

  return new Date(
    value
  ).toLocaleString(
    undefined,
    {
      dateStyle:
        "medium",

      timeStyle:
        "short",
    }
  );
}


function authorLabel(
  item:
    ForumThread |
    ForumReply,
) {
  return (
    item.author
      ?.username ||
    item.author
      ?.display_name ||
    "ROFFLE User"
  );
}


function AuthorAvatar({
  name,
}: {
  name: string;
}) {
  return (
    <span className="forum-avatar">
      {name
        .trim()
        .charAt(0)
        .toUpperCase() ||
        "R"}
    </span>
  );
}


/* ==========================================================
   FORUM 002
   BREADCRUMBS
   ========================================================== */


function ForumBreadcrumbs({
  category,
  thread,
}: {
  category?:
    ForumCategory | null;

  thread?:
    ForumThread | null;
}) {
  return (
    <nav className="forum-breadcrumbs">
      <a href="/forum">
        Forums
      </a>

      {category && (
        <>
          <ChevronRight
            size={12}
          />

          <a
            href={`/forum/c/${category.slug}`}
          >
            {category.name}
          </a>
        </>
      )}

      {thread && (
        <>
          <ChevronRight
            size={12}
          />

          <span>
            {thread.title}
          </span>
        </>
      )}
    </nav>
  );
}


function ThreadFlags({
  thread,
}: {
  thread:
    ForumThread;
}) {
  return (
    <div className="forum-thread-flags">
      {thread.is_pinned && (
        <span>
          <Pin
            size={11}
          />

          Pinned
        </span>
      )}

      {thread.is_locked && (
        <span>
          <Lock
            size={11}
          />

          Locked
        </span>
      )}
    </div>
  );
}


function ThreadRow({
  thread,
}: {
  thread:
    ForumThread;
}) {
  return (
    <a
      className="forum-thread-row"
      href={`/forum/t/${thread.id}`}
    >
      <div className="forum-thread-main">
        <div className="forum-thread-icon">
          {thread.is_locked ? (
            <Lock
              size={16}
            />
          ) : (
            <MessageSquare
              size={16}
            />
          )}
        </div>

        <div>
          <ThreadFlags
            thread={
              thread
            }
          />

          <strong className="forum-thread-title">
            {thread.title}
          </strong>

          <span className="forum-thread-byline">
            by{" "}
            {authorLabel(
              thread
            )}
            {" · "}
            {formatForumDate(
              thread.created_at
            )}
          </span>
        </div>
      </div>

      <div className="forum-thread-stat">
        <strong>
          {thread.reply_count}
        </strong>

        <span>
          replies
        </span>
      </div>

      <div className="forum-thread-stat">
        <strong>
          {thread.view_count}
        </strong>

        <span>
          views
        </span>
      </div>

      <div className="forum-thread-last">
        <Clock3
          size={11}
        />

        <span>
          {formatForumDate(
            thread.last_activity_at
          )}
        </span>
      </div>
    </a>
  );
}


/* ==========================================================
   FORUM 003
   FORUM HOME
   ========================================================== */


function ForumHome({
  session,
}: {
  session:
    Session | null;
}) {
  const [
    categories,
    setCategories,
  ] =
    useState<
      ForumCategory[]
    >(
      []
    );

  const [
    latestThreads,
    setLatestThreads,
  ] =
    useState<
      ForumThread[]
    >(
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
    useState<
      string | null
    >(
      null
    );


  useEffect(() => {
    let mounted = true;

    void Promise.all([
      getForumCategories(),
      getLatestForumThreads(
        10
      ),
    ])
      .then(
        ([
          nextCategories,
          nextThreads,
        ]) => {
          if (!mounted) {
            return;
          }

          setCategories(
            nextCategories
          );

          setLatestThreads(
            nextThreads
          );
        }
      )
      .catch(
        (
          nextError
        ) => {
          if (mounted) {
            setError(
              nextError
                instanceof Error
                ? nextError.message
                : "ROFFLE Forums could not load."
            );
          }
        }
      )
      .finally(
        () => {
          if (mounted) {
            setLoading(
              false
            );
          }
        }
      );

    return () => {
      mounted = false;
    };
  }, []);


  const totalThreads =
    categories.reduce(
      (
        total,
        category
      ) =>
        total +
        category.thread_count,
      0
    );

  const totalReplies =
    categories.reduce(
      (
        total,
        category
      ) =>
        total +
        category.reply_count,
      0
    );


  return (
    <>
      <section className="forum-hero">
        <div>
          <span className="forum-kicker">
            ROFFLE FORUMS
          </span>

          <h1>
            Talk longer.
          </h1>

          <p>
            Threads, replies, arguments, projects, and whatever else
            does not belong in a 500-character post.
          </p>
        </div>

        {session ? (
          <a
            className="forum-primary-button"
            href="/forum/new"
          >
            <Plus
              size={14}
            />

            Start a thread
          </a>
        ) : (
          <a
            className="forum-primary-button"
            href="/login"
          >
            Create account
          </a>
        )}
      </section>

      {error && (
        <div className="forum-error">
          {error}
        </div>
      )}

      {loading ? (
        <div className="forum-loading">
          Loading Forums...
        </div>
      ) : (
        <>
          <section className="forum-board">
            <header className="forum-section-header">
              <div>
                <FolderOpen
                  size={15}
                />

                <h2>
                  Forum Categories
                </h2>
              </div>

              <span>
                {totalThreads} threads · {totalReplies} replies
              </span>
            </header>

            <div className="forum-category-list">
              {categories.map(
                (
                  category
                ) => (
                  <a
                    className="forum-category-row"
                    href={`/forum/c/${category.slug}`}
                    key={
                      category.id
                    }
                  >
                    <div className="forum-category-orb">
                      <MessageSquare
                        size={17}
                      />
                    </div>

                    <div className="forum-category-copy">
                      <strong>
                        {category.name}
                      </strong>

                      <span>
                        {category.description}
                      </span>
                    </div>

                    <div className="forum-category-stat">
                      <strong>
                        {category.thread_count}
                      </strong>

                      <span>
                        threads
                      </span>
                    </div>

                    <div className="forum-category-stat">
                      <strong>
                        {category.reply_count}
                      </strong>

                      <span>
                        replies
                      </span>
                    </div>

                    <div className="forum-category-activity">
                      <Clock3
                        size={11}
                      />

                      <span>
                        {formatForumDate(
                          category.last_activity_at
                        )}
                      </span>
                    </div>

                    <ChevronRight
                      className="forum-row-arrow"
                      size={16}
                    />
                  </a>
                )
              )}
            </div>
          </section>

          <section className="forum-board">
            <header className="forum-section-header">
              <div>
                <Clock3
                  size={15}
                />

                <h2>
                  Recent Threads
                </h2>
              </div>
            </header>

            <div className="forum-thread-list">
              {latestThreads.length ===
                0 ? (
                <div className="forum-empty">
                  No threads yet. Suspiciously peaceful.
                </div>
              ) : (
                latestThreads.map(
                  (
                    thread
                  ) => (
                    <ThreadRow
                      key={
                        thread.id
                      }
                      thread={
                        thread
                      }
                    />
                  )
                )
              )}
            </div>
          </section>
        </>
      )}
    </>
  );
}


/* ==========================================================
   FORUM 004
   CATEGORY PAGE
   ========================================================== */


function CategoryPage({
  session,
  slug,
}: {
  session:
    Session | null;

  slug: string;
}) {
  const [
    category,
    setCategory,
  ] =
    useState<
      ForumCategory | null
    >(
      null
    );

  const [
    threads,
    setThreads,
  ] =
    useState<
      ForumThread[]
    >(
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
    useState<
      string | null
    >(
      null
    );


  useEffect(() => {
    let mounted = true;

    const load =
      async () => {
        try {
          const nextCategory =
            await getForumCategory(
              slug
            );

          if (!mounted) {
            return;
          }

          if (!nextCategory) {
            setCategory(
              null
            );

            return;
          }

          setCategory(
            nextCategory
          );

          const nextThreads =
            await getCategoryForumThreads(
              nextCategory.id
            );

          if (mounted) {
            setThreads(
              nextThreads
            );
          }
        } catch (
          nextError
        ) {
          if (mounted) {
            setError(
              nextError
                instanceof Error
                ? nextError.message
                : "Could not load forum category."
            );
          }
        } finally {
          if (mounted) {
            setLoading(
              false
            );
          }
        }
      };

    void load();

    return () => {
      mounted = false;
    };
  }, [
    slug,
  ]);


  if (loading) {
    return (
      <div className="forum-loading">
        Loading threads...
      </div>
    );
  }


  if (!category) {
    return (
      <div className="forum-not-found">
        <MessageSquare
          size={26}
        />

        <h1>
          Category not found.
        </h1>

        <a href="/forum">
          Back to Forums
        </a>
      </div>
    );
  }


  return (
    <>
      <ForumBreadcrumbs
        category={
          category
        }
      />

      <section className="forum-page-heading">
        <div>
          <span className="forum-kicker">
            CATEGORY
          </span>

          <h1>
            {category.name}
          </h1>

          <p>
            {category.description}
          </p>
        </div>

        {session ? (
          <a
            className="forum-primary-button"
            href={`/forum/new?category=${encodeURIComponent(
              category.slug
            )}`}
          >
            <Plus
              size={14}
            />

            New thread
          </a>
        ) : (
          <a
            className="forum-primary-button"
            href="/login"
          >
            Create account
          </a>
        )}
      </section>

      {error && (
        <div className="forum-error">
          {error}
        </div>
      )}

      <section className="forum-board">
        <header className="forum-section-header">
          <div>
            <MessageSquare
              size={15}
            />

            <h2>
              Threads
            </h2>
          </div>

          <span>
            {threads.length}
          </span>
        </header>

        <div className="forum-thread-list">
          {threads.length ===
            0 ? (
            <div className="forum-empty">
              Nothing here yet. Be the first bad influence.
            </div>
          ) : (
            threads.map(
              (
                thread
              ) => (
                <ThreadRow
                  key={
                    thread.id
                  }
                  thread={
                    thread
                  }
                />
              )
            )
          )}
        </div>
      </section>
    </>
  );
}


/* ==========================================================
   FORUM 005
   NEW THREAD
   ========================================================== */


function NewThreadPage({
  session,
}: {
  session:
    Session | null;
}) {
  const [
    categories,
    setCategories,
  ] =
    useState<
      ForumCategory[]
    >(
      []
    );

  const [
    categoryId,
    setCategoryId,
  ] =
    useState("");

  const [
    title,
    setTitle,
  ] =
    useState("");

  const [
    body,
    setBody,
  ] =
    useState("");

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(
      null
    );


  useEffect(() => {
    let mounted = true;

    void getForumCategories()
      .then(
        (
          nextCategories
        ) => {
          if (!mounted) {
            return;
          }

          setCategories(
            nextCategories
          );

          const params =
            new URLSearchParams(
              window.location.search
            );

          const requestedSlug =
            params.get(
              "category"
            );

          const requested =
            nextCategories.find(
              (
                category
              ) =>
                category.slug ===
                requestedSlug
            );

          setCategoryId(
            requested?.id ??
            nextCategories[0]
              ?.id ??
            ""
          );
        }
      )
      .catch(
        (
          nextError
        ) => {
          if (mounted) {
            setError(
              nextError
                instanceof Error
                ? nextError.message
                : "Could not load forum categories."
            );
          }
        }
      );

    return () => {
      mounted = false;
    };
  }, []);


  if (!session) {
    return (
      <div className="forum-signin-gate">
        <MessageSquare
          size={28}
        />

        <h1>
          You need an account.
        </h1>

        <p>
          Reading is public. Posting requires a ROFFLE account.
        </p>

        <a
          className="forum-primary-button"
          href="/login"
        >
          Create account
        </a>
      </div>
    );
  }


  const selectedCategory =
    categories.find(
      (
        category
      ) =>
        category.id ===
        categoryId
    ) ??
    null;


  const canSubmit =
    Boolean(
      categoryId
    ) &&
    title.trim().length >
      0 &&
    title.trim().length <=
      140 &&
    body.trim().length >
      0 &&
    body.trim().length <=
      5000;


  const submit =
    async () => {
      if (!canSubmit) {
        return;
      }

      setSaving(
        true
      );

      setError(
        null
      );

      try {
        const threadId =
          await createForumThread(
            categoryId,
            title,
            body
          );

        window.location.assign(
          `/forum/t/${threadId}`
        );
      } catch (
        nextError
      ) {
        setError(
          nextError
            instanceof Error
            ? nextError.message
            : "ROFFLE could not create the thread."
        );

        setSaving(
          false
        );
      }
    };


  return (
    <>
      <ForumBreadcrumbs
        category={
          selectedCategory
        }
      />

      <section className="forum-compose">
        <header>
          <span className="forum-kicker">
            NEW THREAD
          </span>

          <h1>
            Start something.
          </h1>

          <p>
            Forum posts get up to 5,000 characters.
          </p>
        </header>

        <label className="forum-field">
          <span>
            Category
          </span>

          <select
            value={
              categoryId
            }
            onChange={
              (
                event
              ) => {
                setCategoryId(
                  event.target
                    .value
                );
              }
            }
          >
            {categories.map(
              (
                category
              ) => (
                <option
                  key={
                    category.id
                  }
                  value={
                    category.id
                  }
                >
                  {category.name}
                </option>
              )
            )}
          </select>
        </label>

        <label className="forum-field">
          <span>
            Thread title

            <small>
              {title.length}/140
            </small>
          </span>

          <input
            value={
              title
            }
            maxLength={140}
            onChange={
              (
                event
              ) => {
                setTitle(
                  event.target
                    .value
                );
              }
            }
            placeholder="What are we talking about?"
          />
        </label>

        <label className="forum-field">
          <span>
            Post

            <small>
              {body.length}/5000
            </small>
          </span>

          <textarea
            value={
              body
            }
            maxLength={5000}
            onChange={
              (
                event
              ) => {
                setBody(
                  event.target
                    .value
                );
              }
            }
            placeholder="Use your words."
          />
        </label>

        {error && (
          <div className="forum-error">
            {error}
          </div>
        )}

        <footer className="forum-compose-actions">
          <a
            className="forum-secondary-button"
            href={
              selectedCategory
                ? `/forum/c/${selectedCategory.slug}`
                : "/forum"
            }
          >
            Cancel
          </a>

          <button
            className="forum-primary-button"
            type="button"
            disabled={
              !canSubmit ||
              saving
            }
            onClick={() => {
              void submit();
            }}
          >
            <Send
              size={13}
            />

            {saving
              ? "Posting..."
              : "Post thread"}
          </button>
        </footer>
      </section>
    </>
  );
}


/* ==========================================================
   FORUM 006
   THREAD POST CARD
   ========================================================== */


function ForumPost({
  body,
  gifUrl,
  authorName,
  createdAt,
  roleLabel,
  canDelete,
  onDelete,
  original,
  contentId, contentKind, accessRole, loggedIn, onChanged, threadTitle,
}: {
  contentId: string; contentKind: "thread" | "reply"; accessRole: string | null; loggedIn: boolean; onChanged: () => void; threadTitle?: string;
  body: string | null;
  gifUrl?: string | null;
  authorName: string;
  createdAt: string;
  roleLabel?: string;
  canDelete: boolean;
  onDelete: () => void;
  original?: boolean;
}) {
  return (
    <article className="forum-post">
      <aside className="forum-post-author">
        <AuthorAvatar
          name={
            authorName
          }
        />

        <strong>
          {authorName}
        </strong>

        {roleLabel && (
          <span className="forum-role-badge">
            {roleLabel}
          </span>
        )}
      </aside>

      <div className="forum-post-content">
        <header>
          <span>
            {original
              ? "Original post"
              : "Reply"}
          </span>

          <time>
            {formatForumDate(
              createdAt
            )}
          </time>

          {canDelete && (
            <button
              className="forum-delete-button"
              type="button"
              onClick={
                onDelete
              }
            >
              <Trash2
                size={11}
              />

              Delete
            </button>
          )}
        </header>

        <ForumContentActions kind={contentKind} id={contentId} title={threadTitle} body={body} role={accessRole} loggedIn={loggedIn} onChanged={onChanged} />
        {body && (
          <div className="forum-post-body">
            {body}
          </div>
        )}

        {gifUrl && (
          <div className="forum-post-gif">
            <img
              src={
                gifUrl
              }
              alt="Forum reaction GIF"
              loading="lazy"
            />

            <span>
              Powered by GIPHY
            </span>
          </div>
        )}
      </div>
    </article>
  );
}


/* ==========================================================
   FORUM 007
   THREAD PAGE
   ========================================================== */


function ThreadPage({
  session,
  accessRole,
  threadId,
}: {
  session:
    Session | null;

  accessRole:
    UserRole | null;

  threadId: string;
}) {
  const [
    detail,
    setDetail,
  ] =
    useState<
      ForumThreadDetail | null
    >(
      null
    );

  const [
    replyBody,
    setReplyBody,
  ] =
    useState("");

  const [
    selectedReplyGif,
    setSelectedReplyGif,
  ] =
    useState<GiphyGif | null>(
      null
    );

  const [
    giphyOpen,
    setGiphyOpen,
  ] =
    useState(false);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(
      null
    );


  const isStaff =
    accessRole ===
      "moderator" ||
    accessRole ===
      "admin";


  const load =
    async () => {
      try {
        const next =
          await getForumThread(
            threadId
          );

        setDetail(
          next
        );
      } catch (
        nextError
      ) {
        setError(
          nextError
            instanceof Error
            ? nextError.message
            : "Could not load thread."
        );
      } finally {
        setLoading(
          false
        );
      }
    };


  useEffect(() => {
    void load();

    void incrementForumThreadView(
      threadId
    );
  }, [
    threadId,
  ]);


  if (loading) {
    return (
      <div className="forum-loading">
        Loading thread...
      </div>
    );
  }


  if (!detail) {
    return (
      <div className="forum-not-found">
        <MessageSquare
          size={26}
        />

        <h1>
          Thread not found.
        </h1>

        <a href="/forum">
          Back to Forums
        </a>
      </div>
    );
  }


  const {
    thread,
    replies,
  } =
    detail;

  const category:
    ForumCategory | null =
      thread.category
        ? {
            ...thread.category,
            sort_order:
              0,
            active:
              true,
            thread_count:
              0,
            reply_count:
              0,
            last_activity_at:
              null,
          }
        : null;

  const canDeleteThread =
    Boolean(
      session &&
      (
        isStaff
      )
    );

  const canReply =
    Boolean(
      session &&
      (
        !thread.is_locked ||
        isStaff
      )
    );


  const submitReply =
    async () => {
      if (
        !canReply ||
        (
          !replyBody.trim() &&
          !selectedReplyGif
        ) ||
        replyBody.trim().length >
          5000
      ) {
        return;
      }

      setSaving(
        true
      );

      setError(
        null
      );

      try {
        await createForumReply(
          thread.id,
          replyBody,
          selectedReplyGif
        );

        setReplyBody("");

        setSelectedReplyGif(
          null
        );

        setGiphyOpen(
          false
        );

        await load();
      } catch (
        nextError
      ) {
        setError(
          nextError
            instanceof Error
            ? nextError.message
            : "Could not post reply."
        );
      } finally {
        setSaving(
          false
        );
      }
    };


  const removeThread =
    async () => {
      if (
        !window.confirm(
          `Delete "${thread.title}" and all replies?`
        )
      ) {
        return;
      }

      try {
        await deleteForumThread(
          thread.id
        );

        window.location.assign(
          category
            ? `/forum/c/${category.slug}`
            : "/forum"
        );
      } catch (
        nextError
      ) {
        setError(
          nextError
            instanceof Error
            ? nextError.message
            : "Could not delete thread."
        );
      }
    };


  const removeReply =
    async (
      replyId: string,
    ) => {
      if (
        !window.confirm(
          "Delete this reply?"
        )
      ) {
        return;
      }

      try {
        await deleteForumReply(
          replyId
        );

        await load();
      } catch (
        nextError
      ) {
        setError(
          nextError
            instanceof Error
            ? nextError.message
            : "Could not delete reply."
        );
      }
    };


  const updateControls =
    async (
      nextPinned:
        boolean,
      nextLocked:
        boolean,
    ) => {
      try {
        await setForumThreadControls(
          thread.id,
          nextPinned,
          nextLocked
        );

        await load();
      } catch (
        nextError
      ) {
        setError(
          nextError
            instanceof Error
            ? nextError.message
            : "Could not update thread controls."
        );
      }
    };


  return (
    <>
      <ForumBreadcrumbs
        category={
          category
        }
        thread={
          thread
        }
      />

      <section className="forum-thread-heading">
        <div>
          <ThreadFlags
            thread={
              thread
            }
          />

          <h1>
            {thread.title}
          </h1>

          <div className="forum-thread-heading-meta">
            <span>
              <Eye
                size={12}
              />

              {thread.view_count} views
            </span>

            <span>
              <MessageCircle
                size={12}
              />

              {thread.reply_count} replies
            </span>

            <span>
              <Clock3
                size={12}
              />

              {formatForumDate(
                thread.last_activity_at
              )}
            </span>
          </div>
        </div>

        <div className="forum-thread-actions">
          {accessRole === "admin" && (
            <>
              <button
                className={
                  thread.is_pinned
                    ? "forum-control active"
                    : "forum-control"
                }
                type="button"
                onClick={() => {
                  void updateControls(
                    !thread.is_pinned,
                    thread.is_locked
                  );
                }}
              >
                <Pin
                  size={12}
                />

                {thread.is_pinned
                  ? "Unpin"
                  : "Pin"}
              </button>

              <button
                className={
                  thread.is_locked
                    ? "forum-control active"
                    : "forum-control"
                }
                type="button"
                onClick={() => {
                  void updateControls(
                    thread.is_pinned,
                    !thread.is_locked
                  );
                }}
              >
                <Lock
                  size={12}
                />

                {thread.is_locked
                  ? "Unlock"
                  : "Lock"}
              </button>
            </>
          )}

          {canDeleteThread && (
            <button
              className="forum-control danger"
              type="button"
              onClick={() => {
                void removeThread();
              }}
            >
              <Trash2
                size={12}
              />

              Delete thread
            </button>
          )}
        </div>
      </section>

      {error && (
        <div className="forum-error">
          {error}
        </div>
      )}

      <section className="forum-post-stack">
        <ForumPost
          contentId={thread.id} contentKind="thread" accessRole={accessRole} loggedIn={Boolean(session)} onChanged={() => void load()} threadTitle={thread.title}
          original
          body={
            thread.body
          }
          authorName={
            authorLabel(
              thread
            )
          }
          createdAt={
            thread.created_at
          }
          roleLabel={
            thread.user_id ===
              session?.user.id &&
            isStaff
              ? accessRole ??
                undefined
              : undefined
          }
          canDelete={
            canDeleteThread
          }
          onDelete={() => {
            void removeThread();
          }}
        />

        {replies.map(
          (
            reply
          ) => {
            const canDeleteReply =
              Boolean(
                session &&
                (
                  isStaff
                )
              );

            return (
              <ForumPost
                contentId={reply.id} contentKind="reply" accessRole={accessRole} loggedIn={Boolean(session)} onChanged={() => void load()}
                key={
                  reply.id
                }
                body={
                  reply.body
                }
                gifUrl={
                  reply.gif_url
                }
                authorName={
                  authorLabel(
                    reply
                  )
                }
                createdAt={
                  reply.created_at
                }
                roleLabel={
                  reply.user_id ===
                    session?.user.id &&
                  isStaff
                    ? accessRole ??
                      undefined
                    : undefined
                }
                canDelete={
                  canDeleteReply
                }
                onDelete={() => {
                  void removeReply(
                    reply.id
                  );
                }}
              />
            );
          }
        )}
      </section>

      <section className="forum-reply-box">
        {!session ? (
          <div className="forum-reply-gate">
            <Lock
              size={15}
            />

            <span>
              Create an account to reply.
            </span>

            <a href="/login">
              Create account
            </a>
          </div>
        ) : thread.is_locked &&
          !isStaff ? (
          <div className="forum-reply-gate">
            <Lock
              size={15}
            />

            <span>
              This thread is locked.
            </span>
          </div>
        ) : (
          <>
            <header>
              <strong>
                Reply
              </strong>

              {thread.is_locked &&
                isStaff && (
                <span>
                  Staff reply to locked thread
                </span>
              )}
            </header>

            <textarea
              value={
                replyBody
              }
              maxLength={5000}
              onChange={
                (
                  event
                ) => {
                  setReplyBody(
                    event.target
                      .value
                  );
                }
              }
              placeholder="Add to the damage..."
            />

            <div className="forum-reply-tools">
              <button
                className={
                  giphyOpen
                    ? "active"
                    : ""
                }
                type="button"
                onClick={() => {
                  setGiphyOpen(
                    (
                      current
                    ) =>
                      !current
                  );
                }}
              >
                <ImageIcon
                  size={13}
                />

                GIPHY
              </button>

              {selectedReplyGif && (
                <div className="forum-selected-gif">
                  <img
                    src={
                      selectedReplyGif.previewUrl
                    }
                    alt="Selected GIF"
                  />

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedReplyGif(
                        null
                      );
                    }}
                  >
                    Remove GIF
                  </button>
                </div>
              )}
            </div>

            {giphyOpen && (
              <div className="forum-giphy-picker">
                <GiphyPicker
                  selected={
                    selectedReplyGif
                  }
                  onSelect={
                    (
                      gif
                    ) => {
                      setSelectedReplyGif(
                        gif
                      );

                      setGiphyOpen(
                        false
                      );
                    }
                  }
                />
              </div>
            )}

            <footer>
              <span>
                {replyBody.length}/5000
              </span>

              <button
                className="forum-primary-button"
                type="button"
                disabled={
                  saving ||
                  (
                    !replyBody.trim() &&
                    !selectedReplyGif
                  )
                }
                onClick={() => {
                  void submitReply();
                }}
              >
                <Send
                  size={13}
                />

                {saving
                  ? "Posting..."
                  : "Post reply"}
              </button>
            </footer>
          </>
        )}
      </section>
    </>
  );
}


/* ==========================================================
   FORUM 008
   ROUTING + AUTH
   ========================================================== */


export default function Forum() {
  const [forumSettings, setForumSettings] = useState<{title:string;description:string;allow_threads:boolean;allow_replies:boolean}|null>(null);
  useEffect(() => { let mounted=true; void supabase.from("forum_settings").select("*").single().then(({data}) => {if(mounted)setForumSettings(data);});return()=>{mounted=false;};}, []);
  const [
    postDialogOpen,
    setPostDialogOpen,
  ] =
    useState(false);

  const [
    session,
    setSession,
  ] =
    useState<
      Session | null
    >(
      null
    );

  const [
    accessRole,
    setAccessRole,
  ] =
    useState<
      UserRole | null
    >(
      null
    );

  const [
    authReady,
    setAuthReady,
  ] =
    useState(false);


  useEffect(() => {
    let mounted = true;

    void supabase.auth
      .getSession()
      .then(
        ({
          data,
        }) => {
          if (!mounted) {
            return;
          }

          setSession(
            data.session
          );

          setAuthReady(
            true
          );
        }
      );

    const {
      data: {
        subscription,
      },
    } =
      supabase.auth
        .onAuthStateChange(
          (
            _event,
            nextSession
          ) => {
            if (!mounted) {
              return;
            }

            setSession(
              nextSession
            );

            setAuthReady(
              true
            );
          }
        );

    return () => {
      mounted = false;

      subscription
        .unsubscribe();
    };
  }, []);


  useEffect(() => {
    let mounted = true;

    if (!session) {
      setAccessRole(
        null
      );

      return () => {
        mounted = false;
      };
    }

    void getMyAccess()
      .then(
        (
          access
        ) => {
          if (mounted) {
            setAccessRole(
              access?.account_status === "active" ? access.role : null
            );
          }
        }
      )
      .catch(
        () => {
          if (mounted) {
            setAccessRole(
              null
            );
          }
        }
      );

    return () => {
      mounted = false;
    };
  }, [
    session,
  ]);


  const signOut =
    async () => {
      await supabase.auth
        .signOut();

      window.location.assign(
        "/"
      );
    };


  const openQuickPost =
    () => {
      if (!session) {
        window.location.assign(
          "/login"
        );

        return;
      }

      setPostDialogOpen(
        true
      );
    };


  if (!authReady) {
    return (
      <div className="forum-page">
        <SiteHeader
          session={
            null
          }
          authReady={
            false
          }
          accessRole={
            null
          }
          activeSection="forums"
          onPost={
            openQuickPost
          }
          onSignOut={() => {
            void signOut();
          }}
        />

        <main className="forum-shell">
          <div className="forum-loading">
            Loading ROFFLE Forums...
          </div>
        </main>
      </div>
    );
  }


  const path =
    window.location.pathname;

  const categoryMatch =
    path.match(
      /^\/forum\/c\/([^/]+)\/?$/
    );

  const threadMatch =
    path.match(
      /^\/forum\/t\/([0-9a-f-]+)\/?$/i
    );


  let content:
    ReactNode;


  if (
    path ===
      "/forum/new" ||
    path ===
      "/forum/new/"
  ) {
    content = (
      <NewThreadPage
        session={
          session
        }
      />
    );
  } else if (
    categoryMatch
  ) {
    content = (
      <CategoryPage
        session={
          session
        }
        slug={
          decodeURIComponent(
            categoryMatch[1]
          )
        }
      />
    );
  } else if (
    threadMatch
  ) {
    content = (
      <ThreadPage
        session={
          session
        }
        accessRole={
          accessRole
        }
        threadId={
          threadMatch[1]
        }
      />
    );
  } else {
    content = (
      <ForumHome
        session={
          session
        }
      />
    );
  }


  return (
    <div className="forum-page">
      <SiteHeader
        session={
          session
        }
        authReady={
          authReady
        }
        accessRole={
          accessRole
        }
        activeSection="forums"
        onPost={
          openQuickPost
        }
        onSignOut={() => {
          void signOut();
        }}
      />
      {forumSettings && <section className="forum-settings-banner"><h1>{forumSettings.title}</h1><p>{forumSettings.description}</p>{!forumSettings.allow_threads && <p>New threads are temporarily paused.</p>}{!forumSettings.allow_replies && <p>Replies are temporarily paused.</p>}</section>}

      <main className="forum-shell">
        {content}
      </main>

      <QuickPostDialog
        open={
          postDialogOpen
        }
        onClose={() => {
          setPostDialogOpen(
            false
          );
        }}
        onPosted={() => {
          setPostDialogOpen(
            false
          );
        }}
      />

      <footer className="forum-footer">
        <div>
          <span>
            ROFFLE Forums
          </span>

          <a href="/">
            Back to Home
          </a>
        </div>
      </footer>
    </div>
  );
}
