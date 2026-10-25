import UploadedMedia from "./components/posts/UploadedMedia";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  type Session,
} from "@supabase/supabase-js";

import { supabase } from "./lib/supabase";
import {
  BookOpen,
  MessageCircle,
  Play,
  ChevronRight,
  SlidersHorizontal,
  Clock,
  ExternalLink,
  EyeOff,
  Flame,
  Hash,
  Image as ImageIcon,
  Video,
  Heart,
  Pencil,
  Pin,
  Trash2,
} from "lucide-react";

import SiteHeader, {
  RoffleLogo,
} from "./components/layout/SiteHeader";
import QuickPostDialog from "./components/posts/QuickPostDialog";
import EditPostDialog from "./components/posts/EditPostDialog";
import PostComments from "./components/posts/PostComments";

import {
  deletePost,
  getFeedPosts,
  setFrontPagePin,
  setFrontPageVisibility,
} from "./services/posts";

import {
  getYouTubeGems,
  togglePostLike,
  type YouTubeGem,
} from "./services/engagement";

import {
  getMyAccess,
} from "./services/admin";

import {
  getActiveTaxonomy,
} from "./services/taxonomy";

import {
  getHighlightedBlogPost,
} from "./services/blog";

import type {
  UserRole,
} from "./types/admin";

import type {
  BlogPost,
} from "./types/blog";

import type {
  PostDisplaySize,
  PostRecord,
} from "./types/post";

import type {
  PostCategory,
  PostTag,
  PostTagReference,
} from "./types/taxonomy";

import "./AppV2.css";

type PostType =
  | "short"
  | "video"
  | "image"
  | "gallery"
  | "link"
  | "text";


type TimeFilter =
  | "all"
  | "today"
  | "week"
  | "month";


type ContentFilter =
  | "all"
  | "videos"
  | "photos"
  | "discussions";


const POSTS_PER_PAGE =
  10;


type Post = {
  id: number | string;
  userId: string;

  sourceRecord:
    PostRecord;

  title: string;
  author: string;
  avatar: string;
  published: string;
  createdAt: string;
  views: number;
  likes: number;
  comments: number;
  likedByMe: boolean;
  type: PostType;
  description?: string;
  image?: string;
  youtubeId?: string;
  gifUrl?: string;
  source?: string;
  tag?: string;

  categoryId?:
    string;

  categorySlug?:
    string;

  articleTags:
    PostTagReference[];

  moderationStatus?:
    | "pending"
    | "approved"
    | "rejected";

  frontPagePinned:
    boolean;

  frontPagePinnedAt:
    string | null;

  frontPageVisible:
    boolean;

  displaySize:
    PostDisplaySize;
};

function formatPostDate(
  value: string,
) {
  const date =
    new Date(value);

  return date.toLocaleString(
    undefined,
    {
      dateStyle:
        "medium",

      timeStyle:
        "short",
    }
  );
}


function getTextPostBackground(
  postId: string,
) {
  return `https://picsum.photos/seed/roffle-${postId}/1200/800`;
}


function mapPostRecord(
  post: PostRecord,
): Post {
  const author =
    post.profiles
      ?.display_name ??
    "ROFFLE User";

  const avatar =
    author
      .trim()
      .charAt(0)
      .toUpperCase() ||
    "R";

  if (
    post.post_type ===
    "youtube"
  ) {
    return {
      id:
        post.id,

      userId:
        post.user_id,

      sourceRecord:
        post,

      title:
        post.title ??
        (
          post.video_type ===
          "short"
            ? "YouTube Short"
            : "YouTube video"
        ),

      author,
      avatar,

      published:
        formatPostDate(
          post.created_at
        ),

      createdAt:
        post.created_at,

      views: 0,

      likes:
        post.like_count ??
        0,

      comments:
        post.comment_count ??
        0,

      likedByMe:
        post.liked_by_me ??
        false,

      type:
        post.video_type ===
        "short"
          ? "short"
          : "video",

      tag:
        post.category
          ?.name ??
        "VIDEO",

      categoryId:
        post.category
          ?.id,

      categorySlug:
        post.category
          ?.slug,

      articleTags:
        post.tags ??
        [],

      moderationStatus:
        post.moderation_status,

      frontPagePinned:
        Boolean(
          post.front_page_pinned
        ),

      frontPagePinnedAt:
        post.front_page_pinned_at ??
        null,

      frontPageVisible:
        post.front_page_visible !==
        false,

      displaySize:
        post.display_size ??
        "large",

      description:
        post.body ??
        undefined,

      gifUrl:
        post.gif_url ??
        undefined,

      youtubeId:
        post.youtube_id ??
        undefined,

      image:
        post.youtube_id
          ? `https://i.ytimg.com/vi/${post.youtube_id}/hqdefault.jpg`
          : undefined,
    };
  }

  if (
    (post.post_type === "image" || post.post_type === "upload_video")
  ) {
    return {
      id:
        post.id,

      userId:
        post.user_id,

      sourceRecord:
        post,

      title:
        post.title ??
        "Image post",

      author,
      avatar,

      published:
        formatPostDate(
          post.created_at
        ),

      createdAt:
        post.created_at,

      views: 0,

      likes:
        post.like_count ??
        0,

      comments:
        post.comment_count ??
        0,

      likedByMe:
        post.liked_by_me ??
        false,

      type: post.post_type === "upload_video" ? "video" : "image",

      tag:
        post.category
          ?.name ??
        "IMAGE",

      categoryId:
        post.category
          ?.id,

      categorySlug:
        post.category
          ?.slug,

      articleTags:
        post.tags ??
        [],

      moderationStatus:
        post.moderation_status,

      frontPagePinned:
        Boolean(
          post.front_page_pinned
        ),

      frontPagePinnedAt:
        post.front_page_pinned_at ??
        null,

      frontPageVisible:
        post.front_page_visible !==
        false,

      displaySize:
        post.display_size ??
        "large",

      description:
        post.body ??
        undefined,

      gifUrl:
        post.gif_url ??
        undefined,

      image:
        post.image_url ??
        undefined,
    };
  }

  return {
    id:
      post.id,

    userId:
      post.user_id,

    sourceRecord:
      post,

    title:
      post.title ??
      "Untitled nonsense",

    author,
    avatar,

    published:
      formatPostDate(
        post.created_at
      ),

    createdAt:
      post.created_at,

    views: 0,

    likes:
      post.like_count ??
      0,

    comments:
      post.comment_count ??
      0,

    likedByMe:
      post.liked_by_me ??
      false,

    type:
      "text",

    tag:
      post.category
        ?.name ??
      "TEXT",

    categoryId:
      post.category
        ?.id,

    categorySlug:
      post.category
        ?.slug,

    articleTags:
      post.tags ??
      [],

    moderationStatus:
      post.moderation_status,

    frontPagePinned:
      Boolean(
        post.front_page_pinned
      ),

    frontPagePinnedAt:
      post.front_page_pinned_at ??
      null,

    frontPageVisible:
      post.front_page_visible !==
      false,

    displaySize:
      post.display_size ??
      "large",

    description:
      post.body ??
      undefined,

    gifUrl:
      post.gif_url ??
      undefined,

    image:
      getTextPostBackground(
        post.id
      ),
  };
}


function MediaStage({
  post,
}: {
  post: Post;
}) {
  if (post.sourceRecord.media_asset_id) return <div className="photo-stage"><UploadedMedia postId={String(post.id)} video={post.sourceRecord.post_type === "upload_video"} title={post.title} /></div>;
  if (post.type === "short") {
    const hasRealVideo =
      post.youtubeId &&
      post.youtubeId !== "YOUR_SHORT_ID";

    return (
      <div className="short-stage">
        <div className="short-ambient">
          <img
            src={post.image}
            alt=""
          />
        </div>

        <div className="short-frame">
          {hasRealVideo ? (
            <iframe
              src={`https://www.youtube.com/embed/${post.youtubeId}?rel=0&modestbranding=1`}
              title={post.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <div className="short-placeholder">
              <img
                src={post.image}
                alt={post.title}
              />

              <div className="short-shade" />

              <button
                className="big-play"
                aria-label="Play video"
              >
                <Play
                  size={29}
                  fill="currentColor"
                />
              </button>

              <div className="short-label">
                <Video size={15} />
                YouTube Short
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (
    post.type ===
    "video"
  ) {
    return (
      <div className="video-stage">
        {post.youtubeId ? (
          <iframe
            src={`https://www.youtube.com/embed/${post.youtubeId}?rel=0&modestbranding=1`}
            title={post.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <div className="video-stage-empty">
            Video unavailable
          </div>
        )}
      </div>
    );
  }


  if (
    post.type === "image" ||
    post.type === "gallery"
  ) {
    return (
      <div className="photo-stage">
        <img
          src={post.image}
          alt={post.title}
        />

        {post.type === "gallery" && (
          <div className="photo-count">
            <ImageIcon size={15} />
            3 photos
          </div>
        )}
      </div>
    );
  }

  if (post.type === "link") {
    return (
      <a
        className="link-card"
        href="#external"
      >
        <div className="link-image">
          <img
            src={post.image}
            alt=""
          />

          <span className="external-badge">
            <ExternalLink size={15} />
          </span>
        </div>

        <div className="link-copy">
          <span className="link-source">
            {post.source}
          </span>

          <h3>{post.title}</h3>

          <p>
            {post.description}
          </p>

          <span className="visit-link">
            Visit link
            <ChevronRight size={15} />
          </span>
        </div>
      </a>
    );
  }

  if (
    post.type ===
    "text"
  ) {
    return (
      <div
        className="text-magazine-stage"
        style={{
          backgroundImage:
            post.image
              ? `url(${post.image})`
              : undefined,
        }}
      >
        <div className="text-magazine-overlay" />

        <div className="text-magazine-copy">
          <span>
            TEXT POST
          </span>

          <strong>
            {post.title}
          </strong>

          {post.description && (
            <p>
              {post.description}
            </p>
          )}
        </div>
      </div>
    );
  }


  return null;
}

function PostCard({
  post,
  session,
  onToggleLike,
  onCommentCountChanged,
  onEdit,
  onDelete,
  onToggleFrontPagePin,
  onToggleFrontPageVisibility,
  isStaff,
  isAdmin,
  featured = false,
}: {
  post: Post;

  session:
    Session | null;

  onToggleLike: (
    post: Post,
  ) => void;

  onCommentCountChanged: (
    postId: string,
    count: number,
  ) => void;

  onEdit: (
    post: Post,
  ) => void;

  onDelete: (
    post: Post,
  ) => void;

  onToggleFrontPagePin: (
    post: Post,
  ) => void;

  onToggleFrontPageVisibility: (
    post: Post,
  ) => void;

  isStaff: boolean;

  isAdmin: boolean;

  featured?: boolean;
}) {
  const [
    commentsOpen,
    setCommentsOpen,
  ] =
    useState(false);

  const [
    menuOpen,
    setMenuOpen,
  ] =
    useState(false);

  const isOwner =
    session?.user.id ===
    post.userId;

  const canEdit =
    Boolean(
      isOwner
    );

  const canDelete =
    Boolean(
      isOwner ||
      isStaff
    );


  return (
    <article
      className={`post-card magazine-card magazine-card-${post.displaySize} ${
        featured
          ? "front-page-pinned-card"
          : ""
      }`}
      id={`post-${post.id}`}
    >
      <header className="post-header">
        <div className="post-header-top">
          <div className="post-badge-group">
            <span className="content-badge">
              {post.tag}
            </span>

            {post.frontPagePinned && (
              <span className="front-page-pin-badge">
                <Pin
                  size={10}
                />

                Front page
              </span>
            )}

            {isAdmin &&
              !post.frontPageVisible && (
              <span className="front-page-pin-badge">
                <EyeOff
                  size={10}
                />

                Front page hidden
              </span>
            )}

            {post.moderationStatus ===
              "pending" && (
              <span className="moderation-badge pending">
                Pending approval
              </span>
            )}

            {post.moderationStatus ===
              "rejected" && (
              <span className="moderation-badge rejected">
                Rejected
              </span>
            )}
          </div>

          {(canEdit ||
            canDelete ||
            isAdmin) && (
            <div className="post-menu-wrap">
              <button
                className="post-menu"
                type="button"
                aria-label="Post menu"
                aria-expanded={
                  menuOpen
                }
                onClick={() => {
                  setMenuOpen(
                    (
                      current
                    ) =>
                      !current
                  );
                }}
              >
                •••
              </button>

              {menuOpen && (
                <div className="post-menu-dropdown">
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(
                          false
                        );

                        onEdit(
                          post
                        );
                      }}
                    >
                      <Pencil
                        size={13}
                      />

                      Edit
                    </button>
                  )}

                  {isAdmin &&
                    post.moderationStatus ===
                      "approved" && (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(
                          false
                        );

                        onToggleFrontPageVisibility(
                          post
                        );
                      }}
                    >
                      <EyeOff
                        size={13}
                      />

                      {post.frontPageVisible
                        ? "Hide from front page"
                        : "Show on front page"}
                    </button>
                  )}

                  {isAdmin &&
                    post.moderationStatus ===
                      "approved" &&
                    post.frontPageVisible && (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(
                          false
                        );

                        onToggleFrontPagePin(
                          post
                        );
                      }}
                    >
                      <Pin
                        size={13}
                      />

                      {post.frontPagePinned
                        ? "Unpin from front page"
                        : "Pin to front page"}
                    </button>
                  )}

                  {canDelete && (
                    <button
                      className="danger"
                      type="button"
                      onClick={() => {
                        setMenuOpen(
                          false
                        );

                        onDelete(
                          post
                        );
                      }}
                    >
                      <Trash2
                        size={13}
                      />

                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <a
          className="post-title"
          href={`#post-${post.id}`}
        >
          {post.title}
        </a>

        {post.articleTags.length >
          0 && (
          <div className="post-article-tags">
            {post.articleTags.map(
              (
                articleTag
              ) => (
                <span
                  key={
                    articleTag.id
                  }
                >
                  #
                  {articleTag.name}
                </span>
              )
            )}
          </div>
        )}

        <div className="post-meta-row">
          <div className="avatar">
            {post.avatar}
          </div>

          <div className="author-inline">
            <a href="#author">
              {post.author}
            </a>

            <span className="meta-dot">
              •
            </span>

            <span>
              {post.published}
            </span>
          </div>

          <div className="post-metrics">
            <span>
              <Heart size={15} />
              {post.likes}
            </span>

            <span>
              <MessageCircle size={15} />
              {post.comments}
            </span>
          </div>
        </div>
      </header>

      <div className="post-media">
        <MediaStage post={post} />
      </div>


      {post.gifUrl && (
        <div className="post-gif-attachment">
          <img
            src={
              post.gifUrl
            }
            alt="Attached reaction GIF"
            loading="lazy"
          />

          <span>
            GIF
          </span>
        </div>
      )}

      <footer className="post-footer">
        <button
          className={
            post.likedByMe
              ? "reaction liked"
              : "reaction"
          }
          type="button"
          onClick={() => {
            onToggleLike(
              post
            );
          }}
        >
          😂
          <span>
            Roffle
          </span>

          {post.likes >
            0 && (
            <strong>
              {post.likes}
            </strong>
          )}
        </button>

        <button
          className={
            commentsOpen
              ? "comment-link active"
              : "comment-link"
          }
          type="button"
          onClick={() => {
            setCommentsOpen(
              (
                current
              ) =>
                !current
            );
          }}
        >
          <MessageCircle size={16} />

          {post.comments === 1
            ? "1 comment"
            : `${post.comments} comments`}
        </button>

        <a
          className="open-post"
          href={`#post-${post.id}`}
        >
          Open post
          <ChevronRight size={17} />
        </a>
      </footer>

      {commentsOpen && (
        <PostComments
          postId={
            String(
              post.id
            )
          }
          session={
            session
          }
          onCountChanged={
            (
              count
            ) => {
              onCommentCountChanged(
                String(
                  post.id
                ),
                count
              );
            }
          }
          isStaff={
            isStaff
          }
        />
      )}
    </article>
  );
}


function RailModule({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rail-module">
      <header className="rail-heading">
        <div>
          {icon}
          <h3>{title}</h3>
        </div>
      </header>

      <div className="rail-body">
        {children}
      </div>
    </section>
  );
}

function App() {
  const [filterOpen, setFilterOpen] =
    useState(false);

  const [
    timeFilter,
    setTimeFilter,
  ] =
    useState<TimeFilter>(
      "all"
    );

  const [
    contentFilter,
    setContentFilter,
  ] =
    useState<ContentFilter>(
      "all"
    );

  const [
    categoryFilter,
    setCategoryFilter,
  ] =
    useState("all");

  const [
    tagFilter,
    setTagFilter,
  ] =
    useState("all");

  const [
    filterCategories,
    setFilterCategories,
  ] =
    useState<PostCategory[]>(
      []
    );

  const [
    filterTags,
    setFilterTags,
  ] =
    useState<PostTag[]>(
      []
    );

  const [
    categoriesExpanded,
    setCategoriesExpanded,
  ] =
    useState(false);

  const [
    currentPage,
    setCurrentPage,
  ] =
    useState(1);

  const [
    postDialogOpen,
    setPostDialogOpen,
  ] =
    useState(false);

  const [
    editingPost,
    setEditingPost,
  ] =
    useState<PostRecord | null>(
      null
    );

  const [
    livePosts,
    setLivePosts,
  ] =
    useState<Post[]>([]);

  const [
    highlightedBlogPost,
    setHighlightedBlogPost,
  ] =
    useState<BlogPost | null>(
      null
    );

  const [
    youtubeGems,
    setYoutubeGems,
  ] =
    useState<YouTubeGem[]>(
      []
    );

  const [
    session,
    setSession,
  ] = useState<Session | null>(
    null
  );

  const [
    authReady,
    setAuthReady,
  ] = useState(false);

  const [
    accessRole,
    setAccessRole,
  ] =
    useState<UserRole | null>(
      null
    );


  useEffect(() => {
    let mounted = true;

    void supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!mounted) {
          return;
        }

        setSession(
          data.session
        );

        setAuthReady(true);
      });

    const {
      data: {
        subscription,
      },
    } =
      supabase.auth.onAuthStateChange(
        (_event, nextSession) => {
          if (!mounted) {
            return;
          }

          setSession(
            nextSession
          );

          setAuthReady(true);
        }
      );

    return () => {
      mounted = false;
      subscription.unsubscribe();
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
          if (!mounted) {
            return;
          }

          setAccessRole(
            access?.role ??
            null
          );
        }
      )
      .catch(() => {
        if (mounted) {
          setAccessRole(
            null
          );
        }
      });

    return () => {
      mounted = false;
    };
  }, [session]);


  useEffect(() => {
    let mounted = true;

    void getActiveTaxonomy()
      .then(
        (
          taxonomy
        ) => {
          if (!mounted) {
            return;
          }

          setFilterCategories(
            taxonomy.categories
          );

          setFilterTags(
            taxonomy.tags
          );
        }
      )
      .catch(
        (
          error
        ) => {
          console.warn(
            "ROFFLE FILTER TAXONOMY ERROR:",
            error
          );
        }
      );

    return () => {
      mounted = false;
    };
  }, []);


  useEffect(() => {
    let mounted = true;

    void getHighlightedBlogPost()
      .then(
        (
          post
        ) => {
          if (mounted) {
            setHighlightedBlogPost(
              post
            );
          }
        }
      )
      .catch(
        (
          error
        ) => {
          console.warn(
            "ROFFLE BLOG HIGHLIGHT ERROR:",
            error
          );
        }
      );

    return () => {
      mounted = false;
    };
  }, []);


  useEffect(() => {
    if (!authReady) {
      return;
    }

    let mounted = true;

    void getFeedPosts()
      .then(
        (
          records
        ) => {
          if (!mounted) {
            return;
          }

          console.log(
            "ROFFLE POSTS LOADED:",
            records.length
          );

          setLivePosts(
            records.map(
              mapPostRecord
            )
          );
        }
      )
      .catch(
        (
          error
        ) => {
          console.error(
            "ROFFLE FEED ERROR:",
            error
          );

          if (mounted) {
            setLivePosts([]);
          }
        }
      );

    return () => {
      mounted = false;
    };
  }, [
    authReady,
    session?.user.id,
  ]);


  useEffect(() => {
    let mounted = true;

    void getYouTubeGems(
      3
    ).then(
      (
        gems
      ) => {
        if (mounted) {
          setYoutubeGems(
            gems
          );
        }
      }
    );

    return () => {
      mounted = false;
    };
  }, []);


  const refreshYouTubeGems =
    () => {
      void getYouTubeGems(
        3
      ).then(
        setYoutubeGems
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


  const handlePostCreated =
    (
      post:
        PostRecord
    ) => {
      const mapped =
        mapPostRecord(
          post
        );

      setLivePosts(
        (
          current
        ) => [
          mapped,

          ...current.filter(
            (
              item
            ) =>
              item.id !==
              mapped.id
          ),
        ]
      );
    };


  const handlePostEdited =
    (
      updated:
        PostRecord
    ) => {
      const mapped =
        mapPostRecord(
          updated
        );

      setLivePosts(
        (
          current
        ) =>
          current.map(
            (
              item
            ) =>
              item.id ===
                mapped.id
                ? mapped
                : item
          )
      );

      setEditingPost(
        null
      );

      refreshYouTubeGems();
    };


  const handleDeletePost =
    async (
      post:
        Post
    ) => {
      const confirmed =
        window.confirm(
          `Delete "${post.title}"? This cannot be undone.`
        );

      if (!confirmed) {
        return;
      }

      try {
        await deletePost(
          String(
            post.id
          )
        );

        setLivePosts(
          (
            current
          ) =>
            current.filter(
              (
                item
              ) =>
                item.id !==
                post.id
            )
        );

        refreshYouTubeGems();
      } catch (
        error
      ) {
        console.error(
          "ROFFLE POST DELETE ERROR:",
          error
        );

        const message =
          error &&
          typeof error ===
            "object" &&
          "message" in error
            ? String(
                (
                  error as {
                    message:
                      unknown;
                  }
                ).message
              )
            : "ROFFLE could not delete the post.";

        window.alert(
          message
        );
      }
    };


  const handleToggleFrontPagePin =
    async (
      post: Post,
    ) => {
      if (
        accessRole !==
        "admin"
      ) {
        return;
      }

      const nextPinned =
        !post.frontPagePinned;

      try {
        await setFrontPagePin(
          String(
            post.id
          ),
          nextPinned
        );

        setLivePosts(
          (
            current
          ) =>
            current.map(
              (
                item
              ) =>
                item.id ===
                  post.id
                  ? {
                      ...item,

                      frontPagePinned:
                        nextPinned,

                      frontPagePinnedAt:
                        nextPinned
                          ? new Date().toISOString()
                          : null,
                    }
                  : item
            )
        );
      } catch (
        error
      ) {
        console.error(
          "ROFFLE FRONT PAGE PIN ERROR:",
          error
        );

        window.alert(
          error instanceof Error
            ? error.message
            : "Could not update front page pin."
        );
      }
    };


  const handleToggleFrontPageVisibility =
    async (
      post: Post,
    ) => {
      if (
        accessRole !==
        "admin"
      ) {
        return;
      }

      const nextVisible =
        !post.frontPageVisible;

      try {
        await setFrontPageVisibility(
          String(
            post.id
          ),
          nextVisible
        );

        setLivePosts(
          (
            current
          ) =>
            current.map(
              (
                item
              ) =>
                item.id ===
                  post.id
                  ? {
                      ...item,

                      frontPageVisible:
                        nextVisible,

                      frontPagePinned:
                        nextVisible
                          ? item.frontPagePinned
                          : false,

                      frontPagePinnedAt:
                        nextVisible
                          ? item.frontPagePinnedAt
                          : null,
                    }
                  : item
            )
        );
      } catch (
        error
      ) {
        console.error(
          "ROFFLE FRONT PAGE VISIBILITY ERROR:",
          error
        );

        window.alert(
          error instanceof Error
            ? error.message
            : "Could not update front page visibility."
        );
      }
    };


  const handleToggleLike =
    async (
      post: Post,
    ) => {
      if (!session) {
        window.location.assign(
          "/login"
        );

        return;
      }

      try {
        const liked =
          await togglePostLike(
            String(
              post.id
            ),
            post.likedByMe
          );

        setLivePosts(
          (
            current
          ) =>
            current.map(
              (
                item
              ) =>
                item.id ===
                  post.id
                  ? {
                      ...item,

                      likedByMe:
                        liked,

                      likes:
                        Math.max(
                          0,
                          item.likes +
                            (
                              liked
                                ? 1
                                : -1
                            )
                        ),
                    }
                  : item
            )
        );

        refreshYouTubeGems();
      } catch (
        error
      ) {
        console.error(
          "ROFFLE LIKE ERROR:",
          error
        );
      }
    };


  const handleCommentCountChanged =
    (
      postId: string,
      count: number,
    ) => {
      setLivePosts(
        (
          current
        ) =>
          current.map(
            (
              post
            ) =>
              String(
                post.id
              ) === postId
                ? {
                    ...post,
                    comments:
                      count,
                  }
                : post
          )
      );

      refreshYouTubeGems();
    };


  const signOut =
    async () => {
      await supabase.auth.signOut();

      window.location.assign(
        "/"
      );
    };




  const filteredPosts =
    useMemo(
      () => {
        const now =
          Date.now();

        return livePosts.filter(
          (
            post
          ) => {
            const created =
              new Date(
                post.createdAt
              ).getTime();

            let matchesTime =
              true;

            if (
              timeFilter ===
              "today"
            ) {
              const startOfToday =
                new Date();

              startOfToday.setHours(
                0,
                0,
                0,
                0
              );

              matchesTime =
                created >=
                startOfToday.getTime();
            } else if (
              timeFilter ===
              "week"
            ) {
              matchesTime =
                created >=
                now -
                  7 *
                    24 *
                    60 *
                    60 *
                    1000;
            } else if (
              timeFilter ===
              "month"
            ) {
              matchesTime =
                created >=
                now -
                  30 *
                    24 *
                    60 *
                    60 *
                    1000;
            }

            let matchesContent =
              true;

            if (
              contentFilter ===
              "videos"
            ) {
              matchesContent =
                post.type ===
                  "video" ||
                post.type ===
                  "short";
            } else if (
              contentFilter ===
              "photos"
            ) {
              matchesContent =
                post.type ===
                  "image" ||
                post.type ===
                  "gallery";
            } else if (
              contentFilter ===
              "discussions"
            ) {
              matchesContent =
                post.type ===
                  "text";
            }

            const matchesCategory =
              categoryFilter ===
                "all" ||
              post.categoryId ===
                categoryFilter;

            const matchesTag =
              tagFilter ===
                "all" ||
              post.articleTags.some(
                (
                  articleTag
                ) =>
                  articleTag.id ===
                  tagFilter
              );

            return (
              matchesTime &&
              matchesContent &&
              matchesCategory &&
              matchesTag
            );
          }
        );
      },
      [
        livePosts,
        timeFilter,
        contentFilter,
        categoryFilter,
        tagFilter,
      ]
    );


  const activeFilterCount =
    (
      timeFilter !==
      "all"
        ? 1
        : 0
    ) +
    (
      contentFilter !==
      "all"
        ? 1
        : 0
    ) +
    (
      categoryFilter !==
      "all"
        ? 1
        : 0
    ) +
    (
      tagFilter !==
      "all"
        ? 1
        : 0
    );


  const pinnedFrontPagePosts =
    useMemo(
      () =>
        livePosts
          .filter(
            (
              post
            ) =>
              post.moderationStatus ===
                "approved" &&
              post.frontPageVisible &&
              post.frontPagePinned
          )
          .sort(
            (
              left,
              right
            ) =>
              new Date(
                right.frontPagePinnedAt ??
                right.createdAt
              ).getTime() -
              new Date(
                left.frontPagePinnedAt ??
                left.createdAt
              ).getTime()
          ),
      [
        livePosts,
      ]
    );


  const magazineSourcePosts =
    useMemo(
      () =>
        activeFilterCount ===
          0
          ? filteredPosts.filter(
              (
                post
              ) =>
                post.frontPageVisible &&
                !post.frontPagePinned
            )
          : filteredPosts,
      [
        activeFilterCount,
        filteredPosts,
      ]
    );


  const totalPages =
    Math.max(
      1,
      Math.ceil(
        magazineSourcePosts.length /
          POSTS_PER_PAGE
      )
    );


  const paginatedPosts =
    useMemo(
      () => {
        const start =
          (
            currentPage -
            1
          ) *
          POSTS_PER_PAGE;

        return magazineSourcePosts.slice(
          start,
          start +
            POSTS_PER_PAGE
        );
      },
      [
        magazineSourcePosts,
        currentPage,
      ]
    );


  const visiblePageNumbers =
    useMemo(
      () => {
        if (
          totalPages <=
          7
        ) {
          return Array.from(
            {
              length:
                totalPages,
            },
            (
              _,
              index
            ) =>
              index + 1
          );
        }

        const start =
          Math.max(
            1,
            Math.min(
              currentPage -
                2,
              totalPages -
                4
            )
          );

        return Array.from(
          {
            length: 5,
          },
          (
            _,
            index
          ) =>
            start +
            index
        );
      },
      [
        currentPage,
        totalPages,
      ]
    );


  useEffect(() => {
    if (
      currentPage >
      totalPages
    ) {
      setCurrentPage(
        totalPages
      );
    }
  }, [
    currentPage,
    totalPages,
  ]);


  useEffect(() => {
    setCurrentPage(
      1
    );
  }, [
    timeFilter,
    contentFilter,
    categoryFilter,
    tagFilter,
  ]);


  const goToPage =
    (
      page:
        number
    ) => {
      const nextPage =
        Math.min(
          totalPages,
          Math.max(
            1,
            page
          )
        );

      setCurrentPage(
        nextPage
      );

      window.setTimeout(
        () => {
          document
            .querySelector(
              ".feed-column"
            )
            ?.scrollIntoView(
              {
                behavior:
                  "smooth",

                block:
                  "start",
              }
            );
        },
        0
      );
    };


  const approvedRailPosts =
    useMemo(
      () =>
        livePosts.filter(
          (
            post
          ) =>
            post.moderationStatus ===
              "approved"
        ),
      [
        livePosts,
      ]
    );


  const categoryPostCounts =
    useMemo(
      () => {
        const counts =
          new Map<
            string,
            number
          >();

        for (
          const post
          of approvedRailPosts
        ) {
          if (
            !post.categoryId
          ) {
            continue;
          }

          counts.set(
            post.categoryId,
            (
              counts.get(
                post.categoryId
              ) ??
              0
            ) + 1
          );
        }

        return counts;
      },
      [
        approvedRailPosts,
      ]
    );


  const tagPostCounts =
    useMemo(
      () => {
        const counts =
          new Map<
            string,
            number
          >();

        for (
          const post
          of approvedRailPosts
        ) {
          for (
            const articleTag
            of post.articleTags
          ) {
            counts.set(
              articleTag.id,
              (
                counts.get(
                  articleTag.id
                ) ??
                0
              ) + 1
            );
          }
        }

        return counts;
      },
      [
        approvedRailPosts,
      ]
    );


  const railTags =
    useMemo(
      () =>
        [...filterTags].sort(
          (
            left,
            right
          ) =>
            (
              tagPostCounts.get(
                right.id
              ) ??
              0
            ) -
              (
                tagPostCounts.get(
                  left.id
                ) ??
                0
              ) ||
            left.sort_order -
              right.sort_order ||
            left.name.localeCompare(
              right.name
            )
        ),
      [
        filterTags,
        tagPostCounts,
      ]
    );


  const scrollToFeed =
    () => {
      window.setTimeout(
        () => {
          document
            .querySelector(
              ".feed-column"
            )
            ?.scrollIntoView(
              {
                behavior:
                  "smooth",

                block:
                  "start",
              }
            );
        },
        0
      );
    };


  const clearFilters =
    () => {
      setTimeFilter(
        "all"
      );

      setContentFilter(
        "all"
      );

      setCategoryFilter(
        "all"
      );

      setTagFilter(
        "all"
      );
    };




  return (
    <div className="roffle-app">
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
        activeSection="home"
        onPost={
          openQuickPost
        }
        onSignOut={() => {
          void signOut();
        }}
      />

      {/* ==================================================
          PAGE
          ================================================== */}

      <main className="page-shell">
        {/* ==================================================
            BLOG HIGHLIGHT
            ================================================== */}

        {highlightedBlogPost?.published &&
          highlightedBlogPost.is_highlighted && (
          <section
            className={`home-blog-highlight highlight-${highlightedBlogPost.accent_style}`}
          >
            <div className="home-blog-highlight-copy">
              <span className="home-blog-highlight-kicker">
                <BookOpen
                  size={14}
                />

                HIGHLIGHTED ARTICLE
              </span>

              <h1>
                {highlightedBlogPost.title}
              </h1>

              {highlightedBlogPost.excerpt && (
                <p>
                  {highlightedBlogPost.excerpt}
                </p>
              )}

              <a
                href={`/blog/${highlightedBlogPost.slug}`}
              >
                Read the blog post

                <ChevronRight
                  size={15}
                />
              </a>
            </div>
          </section>
        )}

        {/* ==================================================
            ADMIN-PINNED FRONT PAGE POSTS
            ================================================== */}

        {activeFilterCount ===
          0 &&
          pinnedFrontPagePosts.length >
            0 && (
          <section className="front-page-pinned-section">
            <div className="section-label">
              <Pin
                size={15}
              />

              Pinned to the front page
            </div>

            <div className="front-page-pinned-grid">
              {pinnedFrontPagePosts.map(
                (
                  post
                ) => (
                  <PostCard
                    featured
                    key={
                      post.id
                    }
                    post={
                      post
                    }
                    session={
                      session
                    }
                    onToggleLike={
                      handleToggleLike
                    }
                    onCommentCountChanged={
                      handleCommentCountChanged
                    }
                    onEdit={
                      (
                        selected
                      ) => {
                        setEditingPost(
                          selected.sourceRecord
                        );
                      }
                    }
                    onDelete={
                      (
                        selected
                      ) => {
                        void handleDeletePost(
                          selected
                        );
                      }
                    }
                    onToggleFrontPagePin={
                      handleToggleFrontPagePin
                    }
                    onToggleFrontPageVisibility={
                      handleToggleFrontPageVisibility
                    }
                    isStaff={
                      accessRole ===
                        "moderator" ||
                      accessRole ===
                        "admin"
                    }
                    isAdmin={
                      accessRole ===
                        "admin"
                    }
                  />
                )
              )}
            </div>
          </section>
        )}

        {/* ==================================================
            TABS + FILTER
            ================================================== */}

        <div className="feed-controls">
          <div className="feed-tabs">
            <button className="feed-tab active">
              Magazine
            </button>

            <button className="feed-tab">
              My Subscriptions
            </button>
          </div>

          <button
            className={`filter-trigger ${
              filterOpen ? "open" : ""
            }`}
            onClick={() =>
              setFilterOpen(
                !filterOpen
              )
            }
          >
            <SlidersHorizontal
              size={17}
            />

            Filter

            {activeFilterCount >
              0 && (
              <span className="filter-count">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {filterOpen && (
          <div className="filter-panel">
            <div className="filter-panel-top">
              <div>
                <strong>
                  Filter posts
                </strong>

                <span>
                  {filteredPosts.length} of{" "}
                  {livePosts.length} matching
                </span>
              </div>

              {activeFilterCount >
                0 && (
                <button
                  className="filter-clear"
                  type="button"
                  onClick={
                    clearFilters
                  }
                >
                  Clear
                </button>
              )}
            </div>

            <div className="filter-row">
              <span>
                Time
              </span>

              <button
                className={
                  timeFilter ===
                    "all"
                    ? "selected"
                    : ""
                }
                type="button"
                onClick={() => {
                  setTimeFilter(
                    "all"
                  );
                }}
              >
                All time
              </button>

              <button
                className={
                  timeFilter ===
                    "today"
                    ? "selected"
                    : ""
                }
                type="button"
                onClick={() => {
                  setTimeFilter(
                    "today"
                  );
                }}
              >
                Today
              </button>

              <button
                className={
                  timeFilter ===
                    "week"
                    ? "selected"
                    : ""
                }
                type="button"
                onClick={() => {
                  setTimeFilter(
                    "week"
                  );
                }}
              >
                Last week
              </button>

              <button
                className={
                  timeFilter ===
                    "month"
                    ? "selected"
                    : ""
                }
                type="button"
                onClick={() => {
                  setTimeFilter(
                    "month"
                  );
                }}
              >
                Last month
              </button>
            </div>

            <div className="filter-row">
              <span>
                Content
              </span>

              <button
                className={
                  contentFilter ===
                    "all"
                    ? "selected"
                    : ""
                }
                type="button"
                onClick={() => {
                  setContentFilter(
                    "all"
                  );
                }}
              >
                All
              </button>

              <button
                className={
                  contentFilter ===
                    "videos"
                    ? "selected"
                    : ""
                }
                type="button"
                onClick={() => {
                  setContentFilter(
                    "videos"
                  );
                }}
              >
                Videos
              </button>

              <button
                className={
                  contentFilter ===
                    "photos"
                    ? "selected"
                    : ""
                }
                type="button"
                onClick={() => {
                  setContentFilter(
                    "photos"
                  );
                }}
              >
                Photos
              </button>

              <button
                className={
                  contentFilter ===
                    "discussions"
                    ? "selected"
                    : ""
                }
                type="button"
                onClick={() => {
                  setContentFilter(
                    "discussions"
                  );
                }}
              >
                Discussions
              </button>
            </div>

            <div className="filter-row">
              <span>
                Category
              </span>

              <button
                className={
                  categoryFilter ===
                    "all"
                    ? "selected"
                    : ""
                }
                type="button"
                onClick={() => {
                  setCategoryFilter(
                    "all"
                  );
                }}
              >
                All
              </button>

              {filterCategories.map(
                (
                  category
                ) => (
                  <button
                    key={
                      category.id
                    }
                    className={
                      categoryFilter ===
                        category.id
                        ? "selected"
                        : ""
                    }
                    type="button"
                    onClick={() => {
                      setCategoryFilter(
                        category.id
                      );
                    }}
                  >
                    {category.name}
                  </button>
                )
              )}
            </div>

            <div className="filter-row">
              <span>
                Tags
              </span>

              <button
                className={
                  tagFilter ===
                    "all"
                    ? "selected"
                    : ""
                }
                type="button"
                onClick={() => {
                  setTagFilter(
                    "all"
                  );
                }}
              >
                All
              </button>

              {filterTags.map(
                (
                  articleTag
                ) => (
                  <button
                    key={
                      articleTag.id
                    }
                    className={
                      tagFilter ===
                        articleTag.id
                        ? "selected"
                        : ""
                    }
                    type="button"
                    onClick={() => {
                      setTagFilter(
                        articleTag.id
                      );
                    }}
                  >
                    #
                    {articleTag.name}
                  </button>
                )
              )}
            </div>
          </div>
        )}

        {/* ==================================================
            MAIN GRID
            ================================================== */}

        <div className="main-grid">
          {/* ==========================
              FEED
              ========================== */}

          <section className="feed-column">
            <div className="feed-status">
              <div>
                <span className="live-dot" />

                New posts
              </div>

              <span>
                {magazineSourcePosts.length} posts
                {" · "}
                Latest first
              </span>
            </div>

            {magazineSourcePosts.length ===
              0 ? (
              <div className="feed-empty-filter">
                <strong>
                  {activeFilterCount > 0
                    ? "Nothing matches that."
                    : "No more posts yet."}
                </strong>

                <span>
                  {activeFilterCount > 0
                    ? "ROFFLE looked. The nonsense is elsewhere."
                    : "The pinned stuff is above. More nonsense will arrive eventually."}
                </span>

                {activeFilterCount >
                  0 && (
                  <button
                    type="button"
                    onClick={
                      clearFilters
                    }
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <div className="magazine-grid">
                {paginatedPosts.map(
                  (
                    post
                  ) => (
                    <PostCard
                      key={
                        post.id
                      }
                      post={
                        post
                      }
                      session={
                        session
                      }
                      onToggleLike={
                        handleToggleLike
                      }
                      onCommentCountChanged={
                        handleCommentCountChanged
                      }
                      onEdit={
                        (
                          selected
                        ) => {
                          setEditingPost(
                            selected.sourceRecord
                          );
                        }
                      }
                      onDelete={
                        (
                          selected
                        ) => {
                          void handleDeletePost(
                            selected
                          );
                        }
                      }
                      onToggleFrontPagePin={
                        handleToggleFrontPagePin
                      }
                      onToggleFrontPageVisibility={
                        handleToggleFrontPageVisibility
                      }
                      isStaff={
                        accessRole ===
                          "moderator" ||
                        accessRole ===
                          "admin"
                      }
                      isAdmin={
                        accessRole ===
                          "admin"
                      }
                    />
                  )
                )}
              </div>
            )}

            {magazineSourcePosts.length >
              0 && (
              <div className="pagination-wrap">
                <div className="pagination-summary">
                  Showing{" "}
                  {(
                    (
                      currentPage -
                      1
                    ) *
                    POSTS_PER_PAGE
                  ) +
                    1}
                  {"–"}
                  {Math.min(
                    currentPage *
                      POSTS_PER_PAGE,
                    magazineSourcePosts.length
                  )}{" "}
                  of{" "}
                  {magazineSourcePosts.length}
                </div>

                <div className="pagination">
                  <button
                    type="button"
                    disabled={
                      currentPage ===
                      1
                    }
                    onClick={() => {
                      goToPage(
                        currentPage -
                          1
                      );
                    }}
                  >
                    Previous
                  </button>

                  {visiblePageNumbers[0] >
                    1 && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          goToPage(
                            1
                          );
                        }}
                      >
                        1
                      </button>

                      {visiblePageNumbers[0] >
                        2 && (
                        <span className="pagination-ellipsis">
                          …
                        </span>
                      )}
                    </>
                  )}

                  {visiblePageNumbers.map(
                    (
                      pageNumber
                    ) => (
                      <button
                        key={
                          pageNumber
                        }
                        type="button"
                        className={
                          currentPage ===
                            pageNumber
                            ? "page-current"
                            : ""
                        }
                        onClick={() => {
                          goToPage(
                            pageNumber
                          );
                        }}
                      >
                        {pageNumber}
                      </button>
                    )
                  )}

                  {visiblePageNumbers[
                    visiblePageNumbers.length -
                      1
                  ] <
                    totalPages && (
                    <>
                      {visiblePageNumbers[
                        visiblePageNumbers.length -
                          1
                      ] <
                        totalPages -
                          1 && (
                        <span className="pagination-ellipsis">
                          …
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          goToPage(
                            totalPages
                          );
                        }}
                      >
                        {totalPages}
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    disabled={
                      currentPage ===
                      totalPages
                    }
                    onClick={() => {
                      goToPage(
                        currentPage +
                          1
                      );
                    }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* ==========================
              RIGHT RAIL
              ========================== */}

          <aside className="right-rail">
            <RailModule
              title="YouTube Gems"
              icon={
                <Play size={17} />
              }
            >
              <div className="gem-list">
                {youtubeGems.length ===
                  0 ? (
                  <div className="gem-empty">
                    No YouTube gems yet.
                  </div>
                ) : (
                  youtubeGems.map(
                    (
                      gem
                    ) => (
                      <a
                        className="gem"
                        href={`#post-${gem.id}`}
                        key={gem.id}
                      >
                        <div className="gem-image">
                          <img
                            src={`https://i.ytimg.com/vi/${gem.youtubeId}/hqdefault.jpg`}
                            alt=""
                          />

                          <span>
                            <Play
                              size={14}
                              fill="currentColor"
                            />
                          </span>
                        </div>

                        <div>
                          <strong>
                            {gem.title}
                          </strong>

                          <small className="gem-engagement">
                            <span>
                              <Heart
                                size={11}
                              />
                              {gem.likeCount}
                            </span>

                            <span>
                              <MessageCircle
                                size={11}
                              />
                              {gem.commentCount}
                            </span>
                          </small>
                        </div>
                      </a>
                    )
                  )
                )}
              </div>
            </RailModule>

            <RailModule
              title="Categories"
              icon={
                <Hash size={17} />
              }
            >
              {filterCategories.length ===
                0 ? (
                <div className="rail-taxonomy-empty">
                  No categories yet.
                </div>
              ) : (
                <div className="category-list">
                  <button
                    className={
                      categoryFilter ===
                        "all"
                        ? "selected"
                        : ""
                    }
                    type="button"
                    onClick={() => {
                      setCategoryFilter(
                        "all"
                      );

                      scrollToFeed();
                    }}
                  >
                    <div>
                      <span className="category-icon">
                        <Hash
                          size={15}
                        />
                      </span>

                      <span>
                        All categories
                      </span>
                    </div>

                    <strong>
                      {approvedRailPosts.length}
                    </strong>
                  </button>

                  {(categoriesExpanded
                    ? filterCategories
                    : filterCategories.slice(
                        0,
                        5
                      )
                  ).map(
                    (
                      category
                    ) => {
                      const count =
                        categoryPostCounts.get(
                          category.id
                        ) ??
                        0;

                      return (
                        <button
                          key={
                            category.id
                          }
                          className={
                            categoryFilter ===
                              category.id
                              ? "selected"
                              : ""
                          }
                          type="button"
                          onClick={() => {
                            setCategoryFilter(
                              (
                                current
                              ) =>
                                current ===
                                  category.id
                                  ? "all"
                                  : category.id
                            );

                            scrollToFeed();
                          }}
                        >
                          <div>
                            <span className="category-icon">
                              {category.slug ===
                                "videos" ? (
                                <Video
                                  size={15}
                                />
                              ) : category.slug ===
                                  "images" ? (
                                <ImageIcon
                                  size={15}
                                />
                              ) : category.slug ===
                                  "funny" ||
                                category.slug ===
                                  "wtf" ? (
                                <Flame
                                  size={15}
                                />
                              ) : (
                                <Hash
                                  size={15}
                                />
                              )}
                            </span>

                            <span>
                              {category.name}
                            </span>
                          </div>

                          <strong>
                            {count}
                          </strong>
                        </button>
                      );
                    }
                  )}

                  {filterCategories.length >
                    5 && (
                    <button
                      className="category-more-toggle"
                      type="button"
                      onClick={() => {
                        setCategoriesExpanded(
                          (
                            current
                          ) =>
                            !current
                        );
                      }}
                    >
                      {categoriesExpanded
                        ? "LESS ‹"
                        : `MORE ›`}
                    </button>
                  )}
                </div>
              )}
            </RailModule>

            <RailModule
              title="Article Tags"
              icon={
                <Hash size={17} />
              }
            >
              {railTags.length ===
                0 ? (
                <div className="rail-taxonomy-empty">
                  No article tags yet.
                </div>
              ) : (
                <>
                  <div className="tag-list">
                    {railTags.map(
                      (
                        articleTag
                      ) => {
                        const count =
                          tagPostCounts.get(
                            articleTag.id
                          ) ??
                          0;

                        return (
                          <button
                            key={
                              articleTag.id
                            }
                            className={
                              tagFilter ===
                                articleTag.id
                                ? "selected"
                                : ""
                            }
                            type="button"
                            title={`${count} ${
                              count === 1
                                ? "post"
                                : "posts"
                            }`}
                            onClick={() => {
                              setTagFilter(
                                (
                                  current
                                ) =>
                                  current ===
                                    articleTag.id
                                    ? "all"
                                    : articleTag.id
                              );

                              scrollToFeed();
                            }}
                          >
                            <span>
                              #
                              {articleTag.name}
                            </span>

                            {count >
                              0 && (
                              <strong>
                                {count}
                              </strong>
                            )}
                          </button>
                        );
                      }
                    )}
                  </div>

                  {tagFilter !==
                    "all" && (
                    <button
                      className="rail-clear-tag"
                      type="button"
                      onClick={() => {
                        setTagFilter(
                          "all"
                        );

                        scrollToFeed();
                      }}
                    >
                      Clear tag
                    </button>
                  )}
                </>
              )}
            </RailModule>

            {!session && (
              <section className="join-card">
                <div className="join-orb">
                  R
                </div>

                <h3>
                  You're already here.
                </h3>

                <p>
                  Might as well make an
                  account.
                </p>

                <a href="/login">
                  Join ROFFLE
                </a>
              </section>
            )}
          </aside>
        </div>
      </main>

      <QuickPostDialog
        open={postDialogOpen}
        onClose={() => {
          setPostDialogOpen(
            false
          );
        }}
        onPosted={
          handlePostCreated
        }
      />

      <EditPostDialog
        open={
          Boolean(
            editingPost
          )
        }
        post={
          editingPost
        }
        onClose={() => {
          setEditingPost(
            null
          );
        }}
        onSaved={
          handlePostEdited
        }
      />

      {/* ==================================================
          FOOTER
          ================================================== */}

      <footer className="site-footer">
        <div className="footer-shell">
          <div className="footer-brand">
            <RoffleLogo />

            <p>
              wtf internet nonsense
            </p>
          </div>

          <div className="footer-links">
            <div>
              <strong>
                ROFFLE
              </strong>

              <a href="/">
                Home
              </a>

              <a href="/blog">
                Blog
              </a>

              <a href="/forum">
                Forums
              </a>
            </div>

            <div>
              <strong>
                ACCOUNT
              </strong>

              <a href="/login">
                Sign in
              </a>

              <a href="/login">
                Register
              </a>

              <a href="#help">
                Help
              </a>
            </div>

            <div>
              <strong>
                LEGAL
              </strong>

              <a href="#privacy">
                Privacy
              </a>

              <a href="#terms">
                Terms
              </a>

              <a href="#contact">
                Contact
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>
            © 2026 ROFFLE
          </span>

          <span>
            <Clock size={13} />
            The internet never closes. I work a lot... this sucks. tf are you even doing reading down here?
          </span>
        </div>
      </footer>
    </div>
  );
}

export default App;