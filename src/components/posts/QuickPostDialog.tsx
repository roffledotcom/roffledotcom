import R2UploadDialog from "./R2UploadDialog";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CheckCircle2,
  Image as ImageIcon,
  Images,
  Send,
  Type,
  UploadCloud,
  Video,
  X,
} from "lucide-react";

import {
  fetchYouTubeMetadata,
  parseYouTubeUrl,
} from "../../lib/youtube";

import {
  createQuickPost,
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
  QuickPostType,
} from "../../types/post";

import type {
  PostCategory,
  PostTag,
} from "../../types/taxonomy";

import GiphyPicker from "./GiphyPicker";

import "./QuickPostDialog.css";


/* ==========================================================
   ROFFLE
   QUICK POST DIALOG
   YouTube + Text + Image + Optional GIPHY Attachment
   ========================================================== */


type Props = {
  open: boolean;

  onClose: () => void;

  onPosted: (
    post: PostRecord,
  ) => void;
};


export default function QuickPostDialog({
  open,
  onClose,
  onPosted,
}: Props) {
  const [r2Open, setR2Open] = useState(false);
  const [
    postType,
    setPostType,
  ] =
    useState<QuickPostType>(
      "youtube"
    );

  const [
    displaySize,
    setDisplaySize,
  ] =
    useState<PostDisplaySize>(
      "large"
    );

  const [
    title,
    setTitle,
  ] =
    useState("");

  const [
    youtubeUrl,
    setYoutubeUrl,
  ] =
    useState("");

  const [
    body,
    setBody,
  ] =
    useState("");

  const [
    image,
    setImage,
  ] =
    useState<File | null>(
      null
    );

  const [
    imagePreview,
    setImagePreview,
  ] =
    useState<string | null>(
      null
    );

  const [
    gifOpen,
    setGifOpen,
  ] =
    useState(false);

  const [
    selectedGif,
    setSelectedGif,
  ] =
    useState<GiphyGif | null>(
      null
    );

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
    postedMessage,
    setPostedMessage,
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
    availableTags,
    setAvailableTags,
  ] =
    useState<PostTag[]>(
      []
    );

  const [
    selectedCategoryId,
    setSelectedCategoryId,
  ] =
    useState("");

  const [
    selectedTagIds,
    setSelectedTagIds,
  ] =
    useState<string[]>(
      []
    );

  const [
    taxonomyLoading,
    setTaxonomyLoading,
  ] =
    useState(false);

  const [
    taxonomyError,
    setTaxonomyError,
  ] =
    useState<string | null>(
      null
    );

  const [
    youtubeTitleMode,
    setYoutubeTitleMode,
  ] =
    useState<
      "auto"
      | "user"
    >(
      "auto"
    );

  const [
    youtubeTitleLoading,
    setYoutubeTitleLoading,
  ] =
    useState(false);

  const [
    youtubeTitleError,
    setYoutubeTitleError,
  ] =
    useState<string | null>(
      null
    );


  const parsedYouTube =
    useMemo(
      () =>
        parseYouTubeUrl(
          youtubeUrl
        ),
      [youtubeUrl]
    );


  useEffect(() => {
    if (!open) {
      return;
    }

    let mounted = true;

    setTaxonomyLoading(
      true
    );

    setTaxonomyError(
      null
    );

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

          setAvailableTags(
            taxonomy.tags
          );

          setSelectedCategoryId(
            (
              current
            ) =>
              current ||
              taxonomy.categories
                .find(
                  (
                    category
                  ) =>
                    category.slug ===
                    "random"
                )
                ?.id ||
              taxonomy.categories[0]
                ?.id ||
              ""
          );
        }
      )
      .catch(
        (
          nextError
        ) => {
          if (!mounted) {
            return;
          }

          setTaxonomyError(
            nextError
              instanceof Error
              ? nextError.message
              : "Could not load categories and tags."
          );
        }
      )
      .finally(
        () => {
          if (mounted) {
            setTaxonomyLoading(
              false
            );
          }
        }
      );

    return () => {
      mounted = false;
    };
  }, [
    open,
  ]);


  useEffect(() => {
    if (
      !open ||
      postType !==
        "youtube" ||
      !parsedYouTube ||
      youtubeTitleMode !==
        "auto"
    ) {
      setYoutubeTitleLoading(
        false
      );

      return;
    }

    const controller =
      new AbortController();

    const timer =
      window.setTimeout(
        () => {
          setYoutubeTitleLoading(
            true
          );

          setYoutubeTitleError(
            null
          );

          void fetchYouTubeMetadata(
            parsedYouTube
              .canonicalUrl,
            controller.signal
          )
            .then(
              (
                metadata
              ) => {
                if (
                  controller.signal
                    .aborted
                ) {
                  return;
                }

                setTitle(
                  metadata.title
                    .slice(
                      0,
                      180
                    )
                );
              }
            )
            .catch(
              (
                nextError
              ) => {
                if (
                  controller.signal
                    .aborted
                ) {
                  return;
                }

                console.warn(
                  "ROFFLE YOUTUBE TITLE ERROR:",
                  nextError
                );

                setYoutubeTitleError(
                  "Could not fetch the YouTube title. You can type one manually."
                );
              }
            )
            .finally(
              () => {
                if (
                  !controller.signal
                    .aborted
                ) {
                  setYoutubeTitleLoading(
                    false
                  );
                }
              }
            );
        },
        350
      );

    return () => {
      window.clearTimeout(
        timer
      );

      controller.abort();
    };
  }, [
    open,
    postType,
    parsedYouTube
      ?.canonicalUrl,
    youtubeTitleMode,
  ]);


  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown =
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
      onKeyDown
    );

    const previousOverflow =
      document.body.style
        .overflow;

    document.body.style
      .overflow =
        "hidden";

    return () => {
      document.removeEventListener(
        "keydown",
        onKeyDown
      );

      document.body.style
        .overflow =
          previousOverflow;
    };
  }, [
    open,
    onClose,
  ]);


  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(
          imagePreview
        );
      }
    };
  }, [imagePreview]);


  if (!open) {
    return null;
  }


  const resetForm = () => {
    setPostType(
      "youtube"
    );

    setDisplaySize(
      "large"
    );

    setTitle("");
    setYoutubeUrl("");
    setBody("");

    setYoutubeTitleMode(
      "auto"
    );

    setYoutubeTitleLoading(
      false
    );

    setYoutubeTitleError(
      null
    );

    setSelectedCategoryId(
      categories.find(
        (
          category
        ) =>
          category.slug ===
          "random"
      )?.id ??
      categories[0]?.id ??
      ""
    );

    setSelectedTagIds(
      []
    );

    if (imagePreview) {
      URL.revokeObjectURL(
        imagePreview
      );
    }

    setImage(null);
    setImagePreview(null);

    setGifOpen(false);
    setSelectedGif(null);

    setSaving(false);
    setError(null);
    setPostedMessage(null);
  };


  const closeDialog = () => {
    resetForm();
    onClose();
  };


  const changePostType =
    (
      next:
        QuickPostType
    ) => {
      setPostType(
        next
      );

      setError(null);
      setPostedMessage(null);
    };


  const selectImage =
    (
      file:
        File | null
    ) => {
      if (imagePreview) {
        URL.revokeObjectURL(
          imagePreview
        );
      }

      setImage(file);

      setImagePreview(
        file
          ? URL.createObjectURL(
              file
            )
          : null
      );
    };


  const toggleTag =
    (
      tagId: string,
    ) => {
      setSelectedTagIds(
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


  const submit =
    async () => {
      setSaving(true);
      setError(null);

      try {
        let created:
          PostRecord;

        if (
          postType ===
          "youtube"
        ) {
          created =
            await createQuickPost(
              {
                postType:
                  "youtube",

                title,

                body,

                youtubeUrl,

                categoryId:
                  selectedCategoryId,

                tagIds:
                  selectedTagIds,

                displaySize,

                gif:
                  selectedGif,
              }
            );
        } else if (
          postType ===
          "text"
        ) {
          created =
            await createQuickPost(
              {
                postType:
                  "text",

                title,

                body,

                categoryId:
                  selectedCategoryId,

                tagIds:
                  selectedTagIds,

                displaySize,

                gif:
                  selectedGif,
              }
            );
        } else {
          if (
            !image &&
            !selectedGif
          ) {
            throw new Error(
              "Pick an image or choose a GIF from GIPHY."
            );
          }

          const usingGifAsMain =
            !image &&
            Boolean(
              selectedGif
            );

          created =
            await createQuickPost(
              {
                postType:
                  "image",

                title,

                body,

                image,

                mainGif:
                  usingGifAsMain
                    ? selectedGif
                    : null,

                categoryId:
                  selectedCategoryId,

                tagIds:
                  selectedTagIds,

                displaySize,

                gif:
                  usingGifAsMain
                    ? null
                    : selectedGif,
              }
            );
        }

        setPostedMessage(
          created.moderation_status ===
            "approved"
            ? "Posted."
            : "Submitted for approval."
        );

        onPosted(
          created
        );

        window.setTimeout(
          () => {
            closeDialog();
          },
          450
        );
      } catch (
        nextError
      ) {
        console.error(
          "ROFFLE POST CREATE ERROR:",
          nextError
        );

        let message =
          "ROFFLE could not create the post.";

        if (
          nextError
            instanceof Error
        ) {
          message =
            nextError.message;
        } else if (
          nextError &&
          typeof nextError ===
            "object" &&
          "message" in
            nextError
        ) {
          const errorObject =
            nextError as {
              message?: unknown;
              details?: unknown;
              hint?: unknown;
              code?: unknown;
            };

          const parts = [
            errorObject.message,
            errorObject.details,
            errorObject.hint,
          ]
            .filter(
              (
                value
              ) =>
                typeof value ===
                  "string" &&
                value.trim()
                  .length > 0
            )
            .map(
              String
            );

          message =
            parts.join(
              " — "
            ) ||
            "ROFFLE could not create the post.";
        }

        setError(
          message
        );

        setSaving(false);
      }
    };


  const canSubmit =
    Boolean(
      selectedCategoryId
    ) &&
    !taxonomyLoading &&
    (
      postType ===
        "youtube"
        ? Boolean(
            parsedYouTube
          ) &&
          body.trim()
            .length <=
            500
        : postType ===
            "text"
          ? Boolean(
              title.trim()
            ) &&
            title.trim()
              .length <=
              180 &&
            Boolean(
              body.trim()
            ) &&
            body.trim()
              .length <=
              500
          : Boolean(
              image ||
              selectedGif
            ) &&
            body.trim()
              .length <=
              500
    );


  if (r2Open) return <R2UploadDialog onClose={() => setR2Open(false)} onPosted={(post) => { setR2Open(false); onPosted(post); onClose(); }} />;

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
            closeDialog();
          }
        }
      }
    >
      <section
        className="quick-post-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-post-title"
      >
        <header className="quick-post-header">
          <div>
            <span className="quick-post-eyebrow">
              QUICK POST
            </span>

            <h2 id="quick-post-title">
              Throw something on ROFFLE
            </h2>
          </div>

          <button
            className="quick-post-close"
            type="button"
            onClick={
              closeDialog
            }
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </header>

        <div className="quick-post-tabs">
          <button type="button" onClick={() => setR2Open(true)}>Upload MP4 / WebM / WebP</button>
          <button
            type="button"
            className={
              postType ===
              "youtube"
                ? "active"
                : ""
            }
            onClick={() => {
              changePostType(
                "youtube"
              );
            }}
          >
            <Video size={16} />
            YouTube
          </button>

          <button
            type="button"
            className={
              postType ===
              "text"
                ? "active"
                : ""
            }
            onClick={() => {
              changePostType(
                "text"
              );
            }}
          >
            <Type size={16} />
            Text
          </button>

          <button
            type="button"
            className={
              postType ===
              "image"
                ? "active"
                : ""
            }
            onClick={() => {
              changePostType(
                "image"
              );
            }}
          >
            <ImageIcon size={16} />
            Image
          </button>
        </div>

        <div className="quick-post-body">
          {postType ===
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
                        event
                          .target
                          .value
                      );

                      if (
                        youtubeTitleMode ===
                        "auto"
                      ) {
                        setTitle("");
                      }

                      setYoutubeTitleError(
                        null
                      );
                    }
                  }
                  placeholder="https://youtube.com/shorts/..."
                  autoFocus
                />
              </label>

              <label className="quick-post-field">
                <span>
                  Title

                  <small>
                    {youtubeTitleLoading
                      ? "fetching from YouTube..."
                      : youtubeTitleMode ===
                          "auto" &&
                        title
                        ? `from YouTube · ${title.length}/180`
                        : `editable · ${title.length}/180`}
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
                        event
                          .target
                          .value
                      );

                      setYoutubeTitleMode(
                        "user"
                      );
                    }
                  }
                  placeholder={
                    youtubeTitleLoading
                      ? "Getting the YouTube title..."
                      : "YouTube title appears here automatically."
                  }
                />

                <div className="quick-post-youtube-title-tools">
                  {youtubeTitleMode ===
                    "user" &&
                    parsedYouTube && (
                    <button
                      type="button"
                      onClick={() => {
                        setYoutubeTitleMode(
                          "auto"
                        );

                        setTitle("");
                      }}
                    >
                      Use YouTube title
                    </button>
                  )}

                  {youtubeTitleError && (
                    <span>
                      {youtubeTitleError}
                    </span>
                  )}
                </div>
              </label>

              <label className="quick-post-field">
                <span>
                  Commentary
                  <small>
                    optional · {body.length}/500
                  </small>
                </span>

                <textarea
                  value={body}
                  maxLength={500}
                  onChange={
                    (
                      event
                    ) =>
                      setBody(
                        event
                          .target
                          .value
                      )
                  }
                  placeholder="Add context, a one-liner, or explain why we're watching this."
                />
              </label>

              {youtubeUrl &&
                !parsedYouTube && (
                  <div className="quick-post-inline-error">
                    That URL does not look like a YouTube video or Short.
                  </div>
                )}

              {parsedYouTube && (
                <div className="quick-post-youtube-preview">
                  <iframe
                    src={
                      parsedYouTube
                        .embedUrl
                    }
                    title="YouTube preview"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />

                  <div>
                    <strong>
                      {parsedYouTube
                        .videoType ===
                      "short"
                        ? "YouTube Short"
                        : "YouTube video"}
                    </strong>

                    <span>
                      Ready to post.
                    </span>
                  </div>
                </div>
              )}
            </>
          )}

          {postType ===
            "text" && (
            <>
              <label className="quick-post-field">
                <span>
                  Title
                  <small>
                    {title.length}/180
                  </small>
                </span>

                <input
                  type="text"
                  value={title}
                  maxLength={180}
                  onChange={
                    (
                      event
                    ) =>
                      setTitle(
                        event
                          .target
                          .value
                      )
                  }
                  placeholder="Headline the nonsense..."
                  autoFocus
                />
              </label>

              <label className="quick-post-field">
                <span>
                  Main content
                  <small>
                    {body.length}/500
                  </small>
                </span>

                <textarea
                  value={body}
                  maxLength={500}
                  onChange={
                    (
                      event
                    ) =>
                      setBody(
                        event
                          .target
                          .value
                      )
                  }
                  placeholder="Now explain yourself..."
                />
              </label>

              <div className="quick-post-text-note">
                Happening on ROFFLE uses the title over the post's background image.
              </div>
            </>
          )}

          {postType ===
            "image" && (
            <>
              <label className="quick-post-upload">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={
                    (
                      event
                    ) => {
                      selectImage(
                        event
                          .target
                          .files?.[0] ??
                          null
                      );
                    }
                  }
                />

                {imagePreview ? (
                  <img
                    src={
                      imagePreview
                    }
                    alt="Selected upload preview"
                  />
                ) : (
                  <div>
                    <UploadCloud size={27} />

                    <strong>
                      Pick an image
                    </strong>

                    <span>
                      JPG, PNG, WEBP, or GIF · 10 MB max
                    </span>

                    <small className="quick-post-image-giphy-hint">
                      Or skip the upload and choose a GIPHY below.
                    </small>
                  </div>
                )}
              </label>

              <label className="quick-post-field">
                <span>
                  Title
                  <small>
                    optional · {title.length}/180
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
                    ) =>
                      setTitle(
                        event
                          .target
                          .value
                      )
                  }
                  placeholder="What are we looking at?"
                />
              </label>

              <label className="quick-post-field">
                <span>
                  Caption / commentary
                  <small>
                    optional · {body.length}/500
                  </small>
                </span>

                <textarea
                  value={body}
                  maxLength={500}
                  onChange={
                    (
                      event
                    ) =>
                      setBody(
                        event
                          .target
                          .value
                      )
                  }
                  placeholder="Context, if this deserves any."
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
                Controls card width, not media size.
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

            {taxonomyLoading ? (
              <div className="quick-post-taxonomy-message">
                Loading categories and tags...
              </div>
            ) : taxonomyError ? (
              <div className="quick-post-inline-error">
                {taxonomyError}
              </div>
            ) : (
              <>
                <label className="quick-post-field quick-post-category-field">
                  <span>
                    Category
                    <small>
                      required
                    </small>
                  </span>

                  <select
                    value={
                      selectedCategoryId
                    }
                    onChange={
                      (
                        event
                      ) => {
                        setSelectedCategoryId(
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
                      {selectedTagIds.length}/5 selected
                    </span>
                  </div>

                  <div className="quick-post-tag-options">
                    {availableTags.map(
                      (
                        tag
                      ) => {
                        const selected =
                          selectedTagIds.includes(
                            tag.id
                          );

                        const unavailable =
                          !selected &&
                          selectedTagIds.length >=
                            5;

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
                              unavailable
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
              </>
            )}
          </section>

          <section className="quick-post-gif-section">
            <div className="quick-post-gif-heading">
              <div>
                <Images size={16} />

                <div>
                  <strong>
                    {postType ===
                      "image" &&
                    !image
                      ? "USE GIPHY AS THE MAIN POST"
                      : "SEARCH GIPHY because you need help"}
                  </strong>

                  <span>
                    {postType ===
                      "image" &&
                    !image
                      ? "Pick one and it becomes the actual image post."
                      : "I mean, it's optional. You choose to do this."}
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
                  <X size={14} />
                  {postType ===
                    "image" &&
                  !image
                    ? "Remove main GIF"
                    : "Remove GIF"}
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

          {postedMessage && (
            <div className="quick-post-success">
              <CheckCircle2 size={16} />
              {postedMessage}
            </div>
          )}
        </div>

        <footer className="quick-post-footer">
          <button
            className="quick-post-cancel"
            type="button"
            onClick={
              closeDialog
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
            onClick={() => {
              void submit();
            }}
            disabled={
              saving ||
              !canSubmit
            }
          >
            <Send size={15} />

            {saving
              ? "Posting..."
              : "Post to ROFFLE"}
          </button>
        </footer>
      </section>
    </div>
  );
}
