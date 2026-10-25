import UploadedMedia from "./UploadedMedia";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CheckCircle2,
  Images,
  Save,
  UploadCloud,
  X,
} from "lucide-react";

import {
  fetchYouTubeMetadata,
  parseYouTubeUrl,
} from "../../lib/youtube";

import {
  updatePost,
} from "../../services/posts";

import {
  getActiveTaxonomy,
} from "../../services/taxonomy";

import type {
  GiphyGif,
} from "../../services/giphy";

import type {
  PostDisplaySize,
  PostRecord,
} from "../../types/post";

import type {
  PostCategory,
  PostTag,
} from "../../types/taxonomy";

import GiphyPicker from "./GiphyPicker";

import "./QuickPostDialog.css";
import "./EditPostDialog.css";


/* ==========================================================
   ROFFLE
   EDIT POST DIALOG
   ========================================================== */


type Props = {
  open: boolean;

  post:
    PostRecord | null;

  onClose:
    () => void;

  onSaved:
    (
      post:
        PostRecord
    ) => void;
};


function getInitialGif(
  post:
    PostRecord,
):
  GiphyGif | null {
  if (
    !post.gif_id ||
    !post.gif_url
  ) {
    return null;
  }

  return {
    id:
      post.gif_id,

    title:
      "Attached GIF",

    url:
      post.gif_url,

    previewUrl:
      post.gif_preview_url ??
      post.gif_url,
  };
}


export default function EditPostDialog({
  open,
  post,
  onClose,
  onSaved,
}: Props) {
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
    youtubeUrl,
    setYoutubeUrl,
  ] =
    useState("");

  const [
    replacementImage,
    setReplacementImage,
  ] =
    useState<File | null>(
      null
    );

  const [
    replacementPreview,
    setReplacementPreview,
  ] =
    useState<string | null>(
      null
    );

  const [
    categories,
    setCategories,
  ] =
    useState<PostCategory[]>(
      []
    );

  const [
    tags,
    setTags,
  ] =
    useState<PostTag[]>(
      []
    );

  const [
    categoryId,
    setCategoryId,
  ] =
    useState("");

  const [
    tagIds,
    setTagIds,
  ] =
    useState<string[]>(
      []
    );

  const [
    displaySize,
    setDisplaySize,
  ] =
    useState<PostDisplaySize>(
      "large"
    );

  const [
    selectedGif,
    setSelectedGif,
  ] =
    useState<GiphyGif | null>(
      null
    );

  const [
    gifOpen,
    setGifOpen,
  ] =
    useState(false);

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null
    );

  const [
    saved,
    setSaved,
  ] =
    useState(false);

  const [
    youtubeTitleLoading,
    setYoutubeTitleLoading,
  ] =
    useState(false);


  const parsedYouTube =
    useMemo(
      () =>
        post?.post_type ===
          "youtube"
          ? parseYouTubeUrl(
              youtubeUrl
            )
          : null,
      [
        post?.post_type,
        youtubeUrl,
      ]
    );


  useEffect(() => {
    if (
      !open ||
      !post
    ) {
      return;
    }

    setTitle(
      post.title ??
      ""
    );

    setBody(
      post.body ??
      ""
    );

    setYoutubeUrl(
      post.youtube_url ??
      ""
    );

    setCategoryId(
      post.category_id ??
      ""
    );

    setTagIds(
      (
        post.tags ??
        []
      ).map(
        (
          tag
        ) =>
          tag.id
      )
    );

    setDisplaySize(
      post.display_size ??
      "large"
    );

    setSelectedGif(
      getInitialGif(
        post
      )
    );

    setReplacementImage(
      null
    );

    setReplacementPreview(
      null
    );

    setGifOpen(
      false
    );

    setSaving(
      false
    );

    setSaved(
      false
    );

    setError(
      null
    );
  }, [
    open,
    post,
  ]);


  useEffect(() => {
    if (!open) {
      return;
    }

    let mounted = true;

    void getActiveTaxonomy()
      .then(
        (
          taxonomy
        ) => {
          if (!mounted) {
            return;
          }

          setCategories(
            taxonomy.categories
          );

          setTags(
            taxonomy.tags
          );

          setCategoryId(
            (
              current
            ) => {
              const stillActive =
                taxonomy.categories
                  .some(
                    (
                      category
                    ) =>
                      category.id ===
                      current
                  );

              if (
                stillActive
              ) {
                return current;
              }

              return (
                taxonomy.categories
                  .find(
                    (
                      category
                    ) =>
                      category.slug ===
                      "random"
                  )
                  ?.id ??
                taxonomy.categories[0]
                  ?.id ??
                ""
              );
            }
          );

          setTagIds(
            (
              current
            ) =>
              current.filter(
                (
                  selectedId
                ) =>
                  taxonomy.tags.some(
                    (
                      tag
                    ) =>
                      tag.id ===
                      selectedId
                  )
              )
          );
        }
      )
      .catch(
        (
          nextError
        ) => {
          setError(
            nextError
              instanceof Error
              ? nextError.message
              : "Could not load categories and tags."
          );
        }
      );

    return () => {
      mounted = false;
    };
  }, [
    open,
  ]);


  useEffect(() => {
    if (!open) {
      return;
    }

    const keyHandler =
      (
        event:
          KeyboardEvent
      ) => {
        if (
          event.key ===
          "Escape"
        ) {
          onClose();
        }
      };

    document.addEventListener(
      "keydown",
      keyHandler
    );

    const oldOverflow =
      document.body.style
        .overflow;

    document.body.style
      .overflow =
        "hidden";

    return () => {
      document.removeEventListener(
        "keydown",
        keyHandler
      );

      document.body.style
        .overflow =
          oldOverflow;
    };
  }, [
    open,
    onClose,
  ]);


  useEffect(() => {
    return () => {
      if (
        replacementPreview
      ) {
        URL.revokeObjectURL(
          replacementPreview
        );
      }
    };
  }, [
    replacementPreview,
  ]);


  if (
    !open ||
    !post
  ) {
    return null;
  }


  const chooseReplacementImage =
    (
      file:
        File | null
    ) => {
      if (
        replacementPreview
      ) {
        URL.revokeObjectURL(
          replacementPreview
        );
      }

      setReplacementImage(
        file
      );

      setReplacementPreview(
        file
          ? URL.createObjectURL(
              file
            )
          : null
      );
    };


  const toggleTag =
    (
      tagId:
        string
    ) => {
      setTagIds(
        (
          current
        ) => {
          if (
            current.includes(
              tagId
            )
          ) {
            return current.filter(
              (
                id
              ) =>
                id !==
                tagId
            );
          }

          if (
            current.length >=
            5
          ) {
            return current;
          }

          return [
            ...current,
            tagId,
          ];
        }
      );
    };


  const applyYouTubeTitle =
    async () => {
      if (!parsedYouTube) {
        return;
      }

      setYoutubeTitleLoading(
        true
      );

      setError(
        null
      );

      try {
        const metadata =
          await fetchYouTubeMetadata(
            parsedYouTube
              .canonicalUrl
          );

        setTitle(
          metadata.title.slice(
            0,
            180
          )
        );
      } catch (
        nextError
      ) {
        setError(
          nextError
            instanceof Error
            ? nextError.message
            : "Could not get the YouTube title."
        );
      } finally {
        setYoutubeTitleLoading(
          false
        );
      }
    };


  const submit =
    async () => {
      setSaving(
        true
      );

      setError(
        null
      );

      try {
        const updated =
          await updatePost(
            {
              postId:
                post.id,

              postType:
                post.post_type,
              mediaAssetId: post.media_asset_id,

              title,

              body,

              youtubeUrl,

              currentImageUrl:
                post.image_url,

              replacementImage,

              categoryId,

              tagIds,

              displaySize,

              gif:
                selectedGif,
            }
          );

        setSaved(
          true
        );

        onSaved(
          updated
        );

        window.setTimeout(
          () => {
            onClose();
          },
          400
        );
      } catch (
        nextError
      ) {
        console.error(
          "ROFFLE POST EDIT ERROR:",
          nextError
        );

        if (
          nextError
            instanceof Error
        ) {
          setError(
            nextError.message
          );
        } else if (
          nextError &&
          typeof nextError ===
            "object" &&
          "message" in
            nextError
        ) {
          setError(
            String(
              (
                nextError as {
                  message:
                    unknown;
                }
              ).message
            )
          );
        } else {
          setError(
            "ROFFLE could not update the post."
          );
        }
      } finally {
        setSaving(
          false
        );
      }
    };


  const canSave =
    Boolean(
      categoryId
    ) &&
    tagIds.length <=
      5 &&
    body.trim().length <=
      500 &&
    title.trim().length <=
      180 &&
    (
      post.post_type ===
        "youtube"
        ? Boolean(
            parsedYouTube
          )
        : post.post_type ===
            "text"
          ? Boolean(
              title.trim()
            ) &&
            Boolean(
              body.trim()
            )
          : Boolean(
              replacementImage ||
              post.image_url || post.media_asset_id
            )
    );


  return (
    <div
      className="quick-post-backdrop"
      role="presentation"
      onMouseDown={
        (
          event
        ) => {
          if (
            event.target ===
            event.currentTarget
          ) {
            onClose();
          }
        }
      }
    >
      <section
        className="quick-post-dialog edit-post-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-post-title"
      >
        <header className="quick-post-header">
          <div>
            <span className="quick-post-eyebrow">
              EDIT POST
            </span>

            <h2 id="edit-post-title">
              Fix what you did.
            </h2>
          </div>

          <button
            className="quick-post-close"
            type="button"
            onClick={
              onClose
            }
            aria-label="Close"
          >
            <X
              size={18}
            />
          </button>
        </header>

        <div className="edit-post-type">
          {post.post_type ===
            "youtube"
            ? "YouTube"
            : post.post_type ===
                "image"
              ? "Image"
              : post.post_type === "upload_video" ? "Uploaded video" : "Text"}
        </div>

        <div className="quick-post-body">
          {post.post_type ===
            "youtube" && (
            <>
              <label className="quick-post-field">
                <span>
                  YouTube URL
                </span>

                <input
                  type="url"
                  value={
                    youtubeUrl
                  }
                  onChange={
                    (
                      event
                    ) => {
                      setYoutubeUrl(
                        event.target
                          .value
                      );
                    }
                  }
                />
              </label>

              <label className="quick-post-field">
                <span>
                  Title
                  <small>
                    {title.length}/180
                  </small>
                </span>

                <input
                  type="text"
                  value={
                    title
                  }
                  maxLength={180}
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
                />

                <div className="edit-post-title-tools">
                  <button
                    type="button"
                    disabled={
                      !parsedYouTube ||
                      youtubeTitleLoading
                    }
                    onClick={() => {
                      void applyYouTubeTitle();
                    }}
                  >
                    {youtubeTitleLoading
                      ? "Getting title..."
                      : "Use YouTube title"}
                  </button>
                </div>
              </label>
            </>
          )}

          {post.post_type !==
            "image" && (
            <label className="quick-post-field">
              <span>
                {post.post_type ===
                  "text"
                  ? "Main content"
                  : "Commentary"}
                <small>
                  {body.length}/500
                </small>
              </span>

              <textarea
                value={
                  body
                }
                maxLength={500}
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
              />
            </label>
          )}

          {post.media_asset_id && <UploadedMedia postId={post.id} video={post.post_type === "upload_video"} title={post.title || "Uploaded media"} />}
          {!post.media_asset_id && post.post_type ===
            "image" && (
            <>
              <div className="edit-post-current-image">
                <img
                  src={
                    replacementPreview ??
                    post.image_url ??
                    ""
                  }
                  alt=""
                />
              </div>

              <label className="quick-post-upload edit-post-replace-image">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={
                    (
                      event
                    ) => {
                      chooseReplacementImage(
                        event.target
                          .files?.[0] ??
                        null
                      );
                    }
                  }
                />

                <div>
                  <UploadCloud
                    size={20}
                  />

                  <strong>
                    Replace image
                  </strong>

                  <span>
                    Optional
                  </span>
                </div>
              </label>

              <label className="quick-post-field">
                <span>
                  Title
                  <small>
                    {title.length}/180
                  </small>
                </span>

                <input
                  type="text"
                  value={
                    title
                  }
                  maxLength={180}
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
                />
              </label>

              <label className="quick-post-field">
                <span>
                  Caption / commentary
                  <small>
                    {body.length}/500
                  </small>
                </span>

                <textarea
                  value={
                    body
                  }
                  maxLength={500}
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
                />
              </label>
            </>
          )}

          <section className="quick-post-layout-section">
            <div className="quick-post-section-heading">
              <strong>
                Post size
              </strong>

              <span>
                Changes the card width only.
              </span>
            </div>

            <div className="quick-post-layout-options">
              {(
                [
                  {
                    value:
                      "small",
                    label:
                      "Small",
                    description:
                      "Compact box",
                  },
                  {
                    value:
                      "large",
                    label:
                      "Large",
                    description:
                      "Standard card",
                  },
                  {
                    value:
                      "wide",
                    label:
                      "Wide",
                    description:
                      "Full row",
                  },
                ] as Array<{
                  value:
                    PostDisplaySize;
                  label:
                    string;
                  description:
                    string;
                }>
              ).map(
                (
                  option
                ) => (
                  <button
                    type="button"
                    key={
                      option.value
                    }
                    className={
                      displaySize ===
                        option.value
                        ? "selected"
                        : ""
                    }
                    onClick={() => {
                      setDisplaySize(
                        option.value
                      );
                    }}
                  >
                    <strong>
                      {option.label}
                    </strong>

                    <span>
                      {option.description}
                    </span>
                  </button>
                )
              )}
            </div>
          </section>

          <section className="quick-post-taxonomy-section">
            <div className="quick-post-section-heading">
              <strong>
                Category & tags
              </strong>

              <span>
                One category. Up to five tags.
              </span>
            </div>

            <label className="quick-post-field quick-post-category-field">
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

            <div className="quick-post-tags-field">
              <div className="quick-post-tags-heading">
                <strong>
                  Article tags
                </strong>

                <span>
                  {tagIds.length}/5 selected
                </span>
              </div>

              <div className="quick-post-tag-options">
                {tags.map(
                  (
                    tag
                  ) => {
                    const selected =
                      tagIds.includes(
                        tag.id
                      );

                    return (
                      <button
                        key={
                          tag.id
                        }
                        type="button"
                        className={
                          selected
                            ? "selected"
                            : ""
                        }
                        disabled={
                          !selected &&
                          tagIds.length >=
                            5
                        }
                        onClick={() => {
                          toggleTag(
                            tag.id
                          );
                        }}
                      >
                        #
                        {tag.name}
                      </button>
                    );
                  }
                )}
              </div>
            </div>
          </section>

          <section className="quick-post-gif-section">
            <div className="quick-post-gif-heading">
              <div>
                <Images
                  size={16}
                />

                <div>
                  <strong>
                    GIF
                  </strong>

                  <span>
                    Keep it, replace it, or remove it.
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setGifOpen(
                    (
                      current
                    ) =>
                      !current
                  );
                }}
              >
                {gifOpen
                  ? "Close search"
                  : selectedGif
                    ? "Change GIF"
                    : "Add GIF"}
              </button>
            </div>

            {selectedGif && (
              <div className="quick-post-selected-gif">
                <img
                  src={
                    selectedGif.url
                  }
                  alt={
                    selectedGif.title
                  }
                />

                <button
                  type="button"
                  onClick={() => {
                    setSelectedGif(
                      null
                    );
                  }}
                >
                  <X
                    size={14}
                  />
                  Remove GIF
                </button>
              </div>
            )}

            {gifOpen && (
              <GiphyPicker
                selected={
                  selectedGif
                }
                onSelect={
                  (
                    gif
                  ) => {
                    setSelectedGif(
                      gif
                    );

                    setGifOpen(
                      false
                    );
                  }
                }
              />
            )}
          </section>

          {error && (
            <div className="quick-post-error">
              {error}
            </div>
          )}

          {saved && (
            <div className="quick-post-success">
              <CheckCircle2
                size={16}
              />
              Saved.
            </div>
          )}
        </div>

        <footer className="quick-post-footer">
          <button
            className="quick-post-cancel"
            type="button"
            onClick={
              onClose
            }
            disabled={
              saving
            }
          >
            Cancel
          </button>

          <button
            className="quick-post-submit"
            type="button"
            disabled={
              saving ||
              !canSave
            }
            onClick={() => {
              void submit();
            }}
          >
            <Save
              size={15}
            />

            {saving
              ? "Saving..."
              : "Save changes"}
          </button>
        </footer>
      </section>
    </div>
  );
}
