-- ROFFLE: fresh Supabase application database setup
-- Target project: xkkkfviifvxfrzvehogc ONLY. Run the entire file in its SQL Editor.
-- No old accounts, posts, or uploaded files are imported.
-- Refuses to run if any Roffle table already exists.
BEGIN;
SET LOCAL search_path = public, extensions;
SET LOCAL check_function_bodies = off;

DO $guard$ BEGIN IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename = ANY(ARRAY['blog_posts','comment_reports','forum_categories','forum_replies','forum_threads','post_categories','post_comments','post_likes','post_tags','posts','profiles','tags','user_roles'])) THEN RAISE EXCEPTION 'Roffle tables already exist. Stop: use the empty new Roffle project; do not rerun this setup.'; END IF; END $guard$;

CREATE TABLE public."blog_posts" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "author_id" uuid NOT NULL,
  "title" text NOT NULL,
  "slug" text NOT NULL,
  "excerpt" text,
  "body" text NOT NULL,
  "hero_image_url" text,
  "accent_style" text DEFAULT 'orange'::text NOT NULL,
  "published" boolean DEFAULT false NOT NULL,
  "is_highlighted" boolean DEFAULT false NOT NULL,
  "published_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public."comment_reports" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "comment_id" uuid NOT NULL,
  "reported_by" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public."forum_categories" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "slug" text NOT NULL,
  "description" text,
  "sort_order" integer DEFAULT 100 NOT NULL,
  "active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public."forum_replies" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "thread_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "body" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "gif_id" text,
  "gif_url" text,
  "gif_preview_url" text
);

CREATE TABLE public."forum_threads" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "category_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "title" text NOT NULL,
  "body" text NOT NULL,
  "view_count" integer DEFAULT 0 NOT NULL,
  "reply_count" integer DEFAULT 0 NOT NULL,
  "is_pinned" boolean DEFAULT false NOT NULL,
  "is_locked" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "last_activity_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public."post_categories" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "slug" text NOT NULL,
  "active" boolean DEFAULT true NOT NULL,
  "sort_order" integer DEFAULT 100 NOT NULL,
  "created_by" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public."post_comments" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "post_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "body" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "gif_id" text,
  "gif_url" text,
  "gif_preview_url" text
);

CREATE TABLE public."post_likes" (
  "post_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public."post_tags" (
  "post_id" uuid NOT NULL,
  "tag_id" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public."posts" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "title" text,
  "youtube_url" text,
  "youtube_id" text,
  "video_type" text,
  "published" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "post_type" text DEFAULT 'youtube'::text NOT NULL,
  "body" text,
  "image_url" text,
  "moderation_status" text DEFAULT 'pending'::text NOT NULL,
  "submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
  "moderated_at" timestamp with time zone,
  "moderated_by" uuid,
  "moderation_note" text,
  "gif_id" text,
  "gif_url" text,
  "gif_preview_url" text,
  "category_id" uuid,
  "front_page_pinned" boolean DEFAULT false NOT NULL,
  "front_page_pinned_at" timestamp with time zone,
  "front_page_pinned_by" uuid,
  "front_page_visible" boolean DEFAULT true NOT NULL,
  "display_size" text DEFAULT 'large'::text NOT NULL
);

CREATE TABLE public."profiles" (
  "id" uuid NOT NULL,
  "display_name" text DEFAULT 'ROFFLE User'::text NOT NULL,
  "avatar_url" text,
  "provider" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "username" text
);

CREATE TABLE public."tags" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "slug" text NOT NULL,
  "active" boolean DEFAULT true NOT NULL,
  "sort_order" integer DEFAULT 100 NOT NULL,
  "created_by" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public."user_roles" (
  "user_id" uuid NOT NULL,
  "role" text DEFAULT 'user'::text NOT NULL,
  "account_status" text DEFAULT 'active'::text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public."post_comments" ADD CONSTRAINT "post_comments_content_check" CHECK ((((body IS NOT NULL) AND ((char_length(TRIM(BOTH FROM body)) >= 1) AND (char_length(TRIM(BOTH FROM body)) <= 500))) OR ((gif_id IS NOT NULL) AND (gif_url IS NOT NULL))));

ALTER TABLE public."forum_replies" ADD CONSTRAINT "forum_replies_content_check" CHECK ((((body IS NOT NULL) AND (char_length(TRIM(BOTH FROM body)) > 0)) OR (gif_url IS NOT NULL)));

ALTER TABLE public."post_comments" ADD CONSTRAINT "post_comments_gif_check" CHECK ((((gif_id IS NULL) AND (gif_url IS NULL) AND (gif_preview_url IS NULL)) OR ((gif_id IS NOT NULL) AND (char_length(TRIM(BOTH FROM gif_id)) > 0) AND (gif_url IS NOT NULL) AND (char_length(TRIM(BOTH FROM gif_url)) > 0))));

ALTER TABLE public."posts" ADD CONSTRAINT "posts_content_check" CHECK ((((post_type = 'youtube'::text) AND (youtube_url IS NOT NULL) AND (youtube_id IS NOT NULL) AND (video_type = ANY (ARRAY['short'::text, 'video'::text]))) OR ((post_type = 'text'::text) AND (body IS NOT NULL) AND ((char_length(TRIM(BOTH FROM body)) >= 1) AND (char_length(TRIM(BOTH FROM body)) <= 500))) OR ((post_type = 'image'::text) AND (image_url IS NOT NULL))));

ALTER TABLE public."forum_replies" ADD CONSTRAINT "forum_replies_body_length_check" CHECK (((body IS NULL) OR ((char_length(TRIM(BOTH FROM body)) >= 1) AND (char_length(TRIM(BOTH FROM body)) <= 5000))));

ALTER TABLE public."posts" ADD CONSTRAINT "posts_title_check" CHECK (((char_length(title) >= 1) AND (char_length(title) <= 180)));

ALTER TABLE public."blog_posts" ADD CONSTRAINT "blog_posts_body_check" CHECK (((char_length(TRIM(BOTH FROM body)) >= 1) AND (char_length(TRIM(BOTH FROM body)) <= 20000)));

ALTER TABLE public."forum_threads" ADD CONSTRAINT "forum_threads_body_check" CHECK (((char_length(TRIM(BOTH FROM body)) >= 1) AND (char_length(TRIM(BOTH FROM body)) <= 5000)));

ALTER TABLE public."post_categories" ADD CONSTRAINT "post_categories_name_check" CHECK (((char_length(TRIM(BOTH FROM name)) >= 1) AND (char_length(TRIM(BOTH FROM name)) <= 48)));

ALTER TABLE public."tags" ADD CONSTRAINT "tags_name_check" CHECK (((char_length(TRIM(BOTH FROM name)) >= 1) AND (char_length(TRIM(BOTH FROM name)) <= 48)));

ALTER TABLE public."forum_categories" ADD CONSTRAINT "forum_categories_name_check" CHECK (((char_length(TRIM(BOTH FROM name)) >= 1) AND (char_length(TRIM(BOTH FROM name)) <= 60)));

ALTER TABLE public."forum_threads" ADD CONSTRAINT "forum_threads_title_check" CHECK (((char_length(TRIM(BOTH FROM title)) >= 1) AND (char_length(TRIM(BOTH FROM title)) <= 140)));

ALTER TABLE public."blog_posts" ADD CONSTRAINT "blog_posts_title_check" CHECK (((char_length(TRIM(BOTH FROM title)) >= 1) AND (char_length(TRIM(BOTH FROM title)) <= 180)));

ALTER TABLE public."posts" ADD CONSTRAINT "posts_youtube_id_check" CHECK (((char_length(youtube_id) >= 6) AND (char_length(youtube_id) <= 20)));

ALTER TABLE public."blog_posts" ADD CONSTRAINT "blog_posts_excerpt_check" CHECK (((excerpt IS NULL) OR (char_length(TRIM(BOTH FROM excerpt)) <= 500)));

ALTER TABLE public."blog_posts" ADD CONSTRAINT "blog_posts_highlight_check" CHECK (((is_highlighted = false) OR (published = true)));

ALTER TABLE public."profiles" ADD CONSTRAINT "profiles_username_format_check" CHECK (((username IS NULL) OR (username ~ '^[A-Za-z0-9_]{3,24}$'::text)));

ALTER TABLE public."blog_posts" ADD CONSTRAINT "blog_posts_accent_check" CHECK ((accent_style = ANY (ARRAY['orange'::text, 'blue'::text])));

ALTER TABLE public."user_roles" ADD CONSTRAINT "user_roles_account_status_check" CHECK ((account_status = ANY (ARRAY['active'::text, 'suspended'::text, 'banned'::text])));

ALTER TABLE public."posts" ADD CONSTRAINT "posts_display_size_check" CHECK ((display_size = ANY (ARRAY['small'::text, 'large'::text, 'wide'::text])));

ALTER TABLE public."posts" ADD CONSTRAINT "posts_moderation_status_check" CHECK ((moderation_status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])));

ALTER TABLE public."posts" ADD CONSTRAINT "posts_post_type_check" CHECK ((post_type = ANY (ARRAY['youtube'::text, 'text'::text, 'image'::text])));

ALTER TABLE public."forum_threads" ADD CONSTRAINT "forum_threads_reply_count_check" CHECK ((reply_count >= 0));

ALTER TABLE public."user_roles" ADD CONSTRAINT "user_roles_role_check" CHECK ((role = ANY (ARRAY['user'::text, 'moderator'::text, 'admin'::text])));

ALTER TABLE public."blog_posts" ADD CONSTRAINT "blog_posts_slug_check" CHECK ((slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'::text));

ALTER TABLE public."forum_categories" ADD CONSTRAINT "forum_categories_slug_check" CHECK ((slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'::text));

ALTER TABLE public."posts" ADD CONSTRAINT "posts_video_type_check" CHECK ((video_type = ANY (ARRAY['short'::text, 'video'::text])));

ALTER TABLE public."forum_threads" ADD CONSTRAINT "forum_threads_view_count_check" CHECK ((view_count >= 0));

ALTER TABLE public."blog_posts" ADD CONSTRAINT "blog_posts_pkey" PRIMARY KEY (id);

ALTER TABLE public."forum_categories" ADD CONSTRAINT "forum_categories_pkey" PRIMARY KEY (id);

ALTER TABLE public."forum_replies" ADD CONSTRAINT "forum_replies_pkey" PRIMARY KEY (id);

ALTER TABLE public."forum_threads" ADD CONSTRAINT "forum_threads_pkey" PRIMARY KEY (id);

ALTER TABLE public."post_categories" ADD CONSTRAINT "post_categories_pkey" PRIMARY KEY (id);

ALTER TABLE public."post_comments" ADD CONSTRAINT "post_comments_pkey" PRIMARY KEY (id);

ALTER TABLE public."posts" ADD CONSTRAINT "posts_pkey" PRIMARY KEY (id);

ALTER TABLE public."profiles" ADD CONSTRAINT "profiles_pkey" PRIMARY KEY (id);

ALTER TABLE public."tags" ADD CONSTRAINT "tags_pkey" PRIMARY KEY (id);

ALTER TABLE public."post_tags" ADD CONSTRAINT "post_tags_pkey" PRIMARY KEY (post_id, tag_id);

ALTER TABLE public."post_likes" ADD CONSTRAINT "post_likes_pkey" PRIMARY KEY (post_id, user_id);

ALTER TABLE public."user_roles" ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY (user_id);

ALTER TABLE public."blog_posts" ADD CONSTRAINT "blog_posts_slug_key" UNIQUE (slug);

ALTER TABLE public."forum_categories" ADD CONSTRAINT "forum_categories_slug_key" UNIQUE (slug);

ALTER TABLE public."post_categories" ADD CONSTRAINT "post_categories_slug_key" UNIQUE (slug);

ALTER TABLE public."tags" ADD CONSTRAINT "tags_slug_key" UNIQUE (slug);

ALTER TABLE public."comment_reports" ADD CONSTRAINT "comment_reports_pkey" PRIMARY KEY (id);

ALTER TABLE public."comment_reports" ADD CONSTRAINT "comment_reports_comment_id_reported_by_key" UNIQUE (comment_id, reported_by);

ALTER TABLE public."blog_posts" ADD CONSTRAINT "blog_posts_author_id_fkey" FOREIGN KEY (author_id) REFERENCES auth.users(id) ON DELETE RESTRICT;

ALTER TABLE public."forum_threads" ADD CONSTRAINT "forum_threads_category_id_fkey" FOREIGN KEY (category_id) REFERENCES forum_categories(id) ON DELETE RESTRICT;

ALTER TABLE public."posts" ADD CONSTRAINT "posts_category_id_fkey" FOREIGN KEY (category_id) REFERENCES post_categories(id) ON DELETE SET NULL;

ALTER TABLE public."post_categories" ADD CONSTRAINT "post_categories_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public."tags" ADD CONSTRAINT "tags_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public."posts" ADD CONSTRAINT "posts_front_page_pinned_by_fkey" FOREIGN KEY (front_page_pinned_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public."profiles" ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public."posts" ADD CONSTRAINT "posts_moderated_by_fkey" FOREIGN KEY (moderated_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public."post_comments" ADD CONSTRAINT "post_comments_post_id_fkey" FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE;

ALTER TABLE public."post_likes" ADD CONSTRAINT "post_likes_post_id_fkey" FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE;

ALTER TABLE public."post_tags" ADD CONSTRAINT "post_tags_post_id_fkey" FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE;

ALTER TABLE public."post_tags" ADD CONSTRAINT "post_tags_tag_id_fkey" FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE;

ALTER TABLE public."forum_replies" ADD CONSTRAINT "forum_replies_thread_id_fkey" FOREIGN KEY (thread_id) REFERENCES forum_threads(id) ON DELETE CASCADE;

ALTER TABLE public."forum_replies" ADD CONSTRAINT "forum_replies_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public."forum_threads" ADD CONSTRAINT "forum_threads_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public."post_comments" ADD CONSTRAINT "post_comments_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public."post_likes" ADD CONSTRAINT "post_likes_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public."user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public."posts" ADD CONSTRAINT "posts_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE public."comment_reports" ADD CONSTRAINT "comment_reports_comment_id_fkey" FOREIGN KEY (comment_id) REFERENCES post_comments(id) ON DELETE CASCADE;

ALTER TABLE public."comment_reports" ADD CONSTRAINT "comment_reports_reported_by_fkey" FOREIGN KEY (reported_by) REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX blog_posts_published_idx ON public.blog_posts USING btree (published, published_at DESC);

CREATE INDEX forum_replies_thread_created_idx ON public.forum_replies USING btree (thread_id, created_at);

CREATE INDEX forum_replies_user_idx ON public.forum_replies USING btree (user_id);

CREATE INDEX forum_threads_activity_idx ON public.forum_threads USING btree (is_pinned DESC, last_activity_at DESC);

CREATE INDEX forum_threads_category_activity_idx ON public.forum_threads USING btree (category_id, is_pinned DESC, last_activity_at DESC);

CREATE INDEX forum_threads_user_idx ON public.forum_threads USING btree (user_id);

CREATE INDEX post_comments_post_id_created_idx ON public.post_comments USING btree (post_id, created_at);

CREATE INDEX post_comments_user_id_idx ON public.post_comments USING btree (user_id);

CREATE INDEX post_likes_post_id_idx ON public.post_likes USING btree (post_id);

CREATE INDEX post_tags_tag_id_idx ON public.post_tags USING btree (tag_id);

CREATE INDEX posts_category_id_idx ON public.posts USING btree (category_id);

CREATE INDEX posts_created_at_idx ON public.posts USING btree (created_at DESC);

CREATE INDEX posts_front_page_pinned_idx ON public.posts USING btree (front_page_pinned, front_page_pinned_at DESC) WHERE (front_page_pinned = true);

CREATE INDEX posts_front_page_visible_idx ON public.posts USING btree (front_page_visible, created_at DESC) WHERE (front_page_visible = true);

CREATE INDEX posts_moderation_status_idx ON public.posts USING btree (moderation_status, created_at);

CREATE INDEX posts_post_type_idx ON public.posts USING btree (post_type);

CREATE INDEX posts_user_id_idx ON public.posts USING btree (user_id);

CREATE UNIQUE INDEX blog_posts_one_highlight_idx ON public.blog_posts USING btree ((1)) WHERE ((published = true) AND (is_highlighted = true));

CREATE UNIQUE INDEX forum_categories_name_ci_unique ON public.forum_categories USING btree (lower(name));

CREATE UNIQUE INDEX post_categories_name_ci_unique ON public.post_categories USING btree (lower(name));

CREATE UNIQUE INDEX profiles_username_lower_unique_idx ON public.profiles USING btree (lower(username)) WHERE (username IS NOT NULL);

CREATE UNIQUE INDEX tags_name_ci_unique ON public.tags USING btree (lower(name));

CREATE INDEX comment_reports_comment_id_idx ON public.comment_reports USING btree (comment_id, created_at);

CREATE OR REPLACE FUNCTION public.admin_create_taxonomy(item_kind text, item_name text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  cleaned_name text;
  base_slug text;
  candidate_slug text;
  created_id uuid;
begin
  if not public.is_staff()
  then
    raise exception
      'Staff access required.';
  end if;

  cleaned_name :=
    trim(item_name);

  if
    cleaned_name is null
    or char_length(
      cleaned_name
    ) not between
      1 and 48
  then
    raise exception
      'Name must be between 1 and 48 characters.';
  end if;

  base_slug :=
    lower(
      regexp_replace(
        regexp_replace(
          cleaned_name,
          '[^a-zA-Z0-9]+',
          '-',
          'g'
        ),
        '(^-+|-+$)',
        '',
        'g'
      )
    );

  if
    base_slug = ''
  then
    base_slug :=
      'item';
  end if;

  candidate_slug :=
    base_slug;

  if item_kind =
    'category'
  then
    if exists (
      select 1
      from public.post_categories
      where
        lower(name) =
          lower(cleaned_name)
    )
    then
      raise exception
        'That category already exists.';
    end if;

    while exists (
      select 1
      from public.post_categories
      where
        slug =
          candidate_slug
    )
    loop
      candidate_slug :=
        base_slug
        || '-'
        || substr(
          replace(
            gen_random_uuid()::text,
            '-',
            ''
          ),
          1,
          6
        );
    end loop;

    insert into
      public.post_categories (
        name,
        slug,
        active,
        created_by
      )
    values (
      cleaned_name,
      candidate_slug,
      true,
      auth.uid()
    )
    returning id
    into created_id;

  elsif item_kind =
    'tag'
  then
    if exists (
      select 1
      from public.tags
      where
        lower(name) =
          lower(cleaned_name)
    )
    then
      raise exception
        'That tag already exists.';
    end if;

    while exists (
      select 1
      from public.tags
      where
        slug =
          candidate_slug
    )
    loop
      candidate_slug :=
        base_slug
        || '-'
        || substr(
          replace(
            gen_random_uuid()::text,
            '-',
            ''
          ),
          1,
          6
        );
    end loop;

    insert into
      public.tags (
        name,
        slug,
        active,
        created_by
      )
    values (
      cleaned_name,
      candidate_slug,
      true,
      auth.uid()
    )
    returning id
    into created_id;

  else
    raise exception
      'Unknown taxonomy type.';
  end if;

  return created_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.admin_dashboard_stats()
 RETURNS TABLE(total_users bigint, total_posts bigint, pending_posts bigint, approved_posts bigint, rejected_posts bigint)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not public.is_staff()
  then
    raise exception
      'Staff access required.';
  end if;

  return query
  select
    (
      select count(*)
      from auth.users
    )::bigint,

    (
      select count(*)
      from public.posts
    )::bigint,

    (
      select count(*)
      from public.posts
      where
        moderation_status =
        'pending'
    )::bigint,

    (
      select count(*)
      from public.posts
      where
        moderation_status =
        'approved'
    )::bigint,

    (
      select count(*)
      from public.posts
      where
        moderation_status =
        'rejected'
    )::bigint;
end;
$function$;

CREATE OR REPLACE FUNCTION public.admin_delete_blog_post(target_post uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not
    public.is_active_roffle_admin()
  then
    raise exception
      'Admin access required.';
  end if;

  delete from
    public.blog_posts
  where
    id =
      target_post;

  if not found
  then
    raise exception
      'Blog post not found.';
  end if;
end;
$function$;

CREATE OR REPLACE FUNCTION public.admin_delete_rejected_post(target_post uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not public.is_staff()
  then
    raise exception
      'Staff access required.';
  end if;

  delete from public.posts
  where
    id =
      target_post
    and moderation_status =
      'rejected';

  if not found
  then
    raise exception
      'Rejected post not found.';
  end if;
end;
$function$;

CREATE OR REPLACE FUNCTION public.admin_flagged_comments()
 RETURNS TABLE(comment_id uuid, post_id uuid, comment_body text, comment_gif_url text, comment_user_id uuid, author_username text, author_display_name text, report_count bigint, first_reported_at timestamp with time zone, last_reported_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not public.is_staff()
  then
    raise exception
      'Staff access required.';
  end if;

  return query
  select
    pc.id
      as comment_id,

    pc.post_id,

    pc.body::text
      as comment_body,

    pc.gif_url::text
      as comment_gif_url,

    pc.user_id
      as comment_user_id,

    p.username::text
      as author_username,

    p.display_name::text
      as author_display_name,

    count(
      cr.id
    )::bigint
      as report_count,

    min(
      cr.created_at
    )
      as first_reported_at,

    max(
      cr.created_at
    )
      as last_reported_at

  from public.comment_reports cr

  join public.post_comments pc
    on pc.id =
      cr.comment_id

  join public.profiles p
    on p.id =
      pc.user_id

  group by
    pc.id,
    pc.post_id,
    pc.body,
    pc.gif_url,
    pc.user_id,
    p.username,
    p.display_name

  order by
    report_count desc,
    last_reported_at desc;
end;
$function$;

CREATE OR REPLACE FUNCTION public.admin_list_users()
 RETURNS TABLE(user_id uuid, email text, email_confirmed_at timestamp with time zone, provider text, created_at timestamp with time zone, username text, display_name text, role text, account_status text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not public.is_admin()
  then
    raise exception
      'Admin access required.';
  end if;

  return query
  select
    au.id,
    au.email::text,
    au.email_confirmed_at,
    (
      au.raw_app_meta_data
        ->> 'provider'
    )::text,
    au.created_at,
    p.username::text,
    p.display_name::text,
    ur.role::text,
    ur.account_status::text
  from auth.users au
  join public.profiles p
    on p.id = au.id
  join public.user_roles ur
    on ur.user_id = au.id
  order by
    au.created_at desc;
end;
$function$;

CREATE OR REPLACE FUNCTION public.admin_save_blog_post(target_post uuid, post_title text, post_slug text, post_excerpt text, post_body text, post_hero_image_url text, post_accent_style text, post_published boolean, post_highlighted boolean)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  clean_title text;
  clean_slug text;
  clean_excerpt text;
  clean_body text;
  clean_hero_image_url text;
  clean_accent text;
  clean_highlighted boolean;
  saved_id uuid;
begin
  if not
    public.is_active_roffle_admin()
  then
    raise exception
      'Admin access required.';
  end if;

  clean_title :=
    trim(
      coalesce(
        post_title,
        ''
      )
    );

  clean_slug :=
    lower(
      trim(
        coalesce(
          post_slug,
          ''
        )
      )
    );

  clean_excerpt :=
    nullif(
      trim(
        coalesce(
          post_excerpt,
          ''
        )
      ),
      ''
    );

  clean_body :=
    trim(
      coalesce(
        post_body,
        ''
      )
    );

  clean_hero_image_url :=
    nullif(
      trim(
        coalesce(
          post_hero_image_url,
          ''
        )
      ),
      ''
    );

  clean_accent :=
    lower(
      trim(
        coalesce(
          post_accent_style,
          'orange'
        )
      )
    );

  clean_highlighted :=
    coalesce(
      post_published,
      false
    )
    and coalesce(
      post_highlighted,
      false
    );

  if
    char_length(
      clean_title
    ) not between
      1 and 180
  then
    raise exception
      'Blog title must be 1 to 180 characters.';
  end if;

  if
    clean_slug !~
      '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  then
    raise exception
      'Blog slug may contain lowercase letters, numbers, and hyphens.';
  end if;

  if
    clean_excerpt is not null
    and char_length(
      clean_excerpt
    ) > 500
  then
    raise exception
      'Blog excerpt is limited to 500 characters.';
  end if;

  if
    char_length(
      clean_body
    ) not between
      1 and 20000
  then
    raise exception
      'Blog body must be 1 to 20000 characters.';
  end if;

  if
    clean_accent not in (
      'orange',
      'blue'
    )
  then
    raise exception
      'Invalid highlight color.';
  end if;

  if
    clean_hero_image_url is not null
    and clean_hero_image_url !~
      '^https?://'
  then
    raise exception
      'Hero image must be an http or https URL.';
  end if;

  if clean_highlighted
  then
    update
      public.blog_posts
    set
      is_highlighted =
        false,

      updated_at =
        now()
    where
      is_highlighted =
        true
      and (
        target_post is null
        or id <>
          target_post
      );
  end if;

  if target_post is null
  then
    insert into
      public.blog_posts (
        author_id,
        title,
        slug,
        excerpt,
        body,
        hero_image_url,
        accent_style,
        published,
        is_highlighted,
        published_at
      )
    values (
      auth.uid(),
      clean_title,
      clean_slug,
      clean_excerpt,
      clean_body,
      clean_hero_image_url,
      clean_accent,
      coalesce(
        post_published,
        false
      ),
      clean_highlighted,
      case
        when coalesce(
          post_published,
          false
        )
          then now()
        else null
      end
    )
    returning
      id
    into
      saved_id;
  else
    update
      public.blog_posts
    set
      title =
        clean_title,

      slug =
        clean_slug,

      excerpt =
        clean_excerpt,

      body =
        clean_body,

      hero_image_url =
        clean_hero_image_url,

      accent_style =
        clean_accent,

      published =
        coalesce(
          post_published,
          false
        ),

      is_highlighted =
        clean_highlighted,

      published_at =
        case
          when coalesce(
            post_published,
            false
          )
            then coalesce(
              published_at,
              now()
            )
          else null
        end,

      updated_at =
        now()

    where
      id =
        target_post

    returning
      id
    into
      saved_id;

    if saved_id is null
    then
      raise exception
        'Blog post not found.';
    end if;
  end if;

  return
    saved_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.admin_set_account_status(target_user uuid, new_status text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not public.is_admin()
  then
    raise exception
      'Admin access required.';
  end if;

  if
    new_status not in (
      'active',
      'suspended',
      'banned'
    )
  then
    raise exception
      'Invalid account status.';
  end if;

  if
    target_user =
      auth.uid()
    and new_status <>
      'active'
  then
    raise exception
      'You cannot suspend or ban your own account from the ROFFLE admin UI.';
  end if;

  update public.user_roles
  set
    account_status =
      new_status
  where
    user_id =
      target_user;

  if not found
  then
    raise exception
      'User not found.';
  end if;
end;
$function$;

CREATE OR REPLACE FUNCTION public.admin_set_front_page_pin(target_post uuid, pinned boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  current_status text;
  current_visible boolean;
begin
  if not
    public.is_active_roffle_admin()
  then
    raise exception
      'Admin access required.';
  end if;

  select
    p.moderation_status,
    p.front_page_visible
  into
    current_status,
    current_visible
  from
    public.posts p
  where
    p.id =
      target_post;

  if current_status is null
  then
    raise exception
      'Post not found.';
  end if;

  if
    pinned =
      true
    and current_status <>
      'approved'
  then
    raise exception
      'Only approved posts can be pinned to the front page.';
  end if;

  if
    pinned =
      true
    and current_visible =
      false
  then
    raise exception
      'Show the post on the front page before pinning it.';
  end if;

  update
    public.posts
  set
    front_page_pinned =
      pinned,

    front_page_pinned_at =
      case
        when pinned
          then now()
        else null
      end,

    front_page_pinned_by =
      case
        when pinned
          then auth.uid()
        else null
      end,

    updated_at =
      now()

  where
    id =
      target_post;
end;
$function$;

CREATE OR REPLACE FUNCTION public.admin_set_front_page_visibility(target_post uuid, visible boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not
    public.is_active_roffle_admin()
  then
    raise exception
      'Admin access required.';
  end if;

  if not exists (
    select
      1
    from
      public.posts p
    where
      p.id =
        target_post
  )
  then
    raise exception
      'Post not found.';
  end if;

  update
    public.posts
  set
    front_page_visible =
      visible,

    front_page_pinned =
      case
        when visible
          then front_page_pinned
        else false
      end,

    front_page_pinned_at =
      case
        when visible
          then front_page_pinned_at
        else null
      end,

    front_page_pinned_by =
      case
        when visible
          then front_page_pinned_by
        else null
      end,

    updated_at =
      now()

  where
    id =
      target_post;
end;
$function$;

CREATE OR REPLACE FUNCTION public.admin_set_user_role(target_user uuid, new_role text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not public.is_admin()
  then
    raise exception
      'Admin access required.';
  end if;

  if
    new_role not in (
      'user',
      'moderator',
      'admin'
    )
  then
    raise exception
      'Invalid role.';
  end if;

  if
    target_user =
      auth.uid()
    and new_role <>
      'admin'
  then
    raise exception
      'You cannot remove your own admin role from the ROFFLE admin UI.';
  end if;

  update public.user_roles
  set
    role =
      new_role
  where
    user_id =
      target_user;

  if not found
  then
    raise exception
      'User not found.';
  end if;
end;
$function$;

CREATE OR REPLACE FUNCTION public.admin_update_taxonomy(item_kind text, item_id uuid, new_name text, new_active boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  cleaned_name text;
begin
  if not public.is_staff()
  then
    raise exception
      'Staff access required.';
  end if;

  cleaned_name :=
    trim(new_name);

  if
    cleaned_name is null
    or char_length(
      cleaned_name
    ) not between
      1 and 48
  then
    raise exception
      'Name must be between 1 and 48 characters.';
  end if;

  if item_kind =
    'category'
  then
    update
      public.post_categories
    set
      name =
        cleaned_name,
      active =
        new_active,
      updated_at =
        now()
    where
      id =
        item_id;

  elsif item_kind =
    'tag'
  then
    update
      public.tags
    set
      name =
        cleaned_name,
      active =
        new_active,
      updated_at =
        now()
    where
      id =
        item_id;

  else
    raise exception
      'Unknown taxonomy type.';
  end if;
end;
$function$;

CREATE OR REPLACE FUNCTION public.apply_post_moderation_defaults()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  resolved_role text;
  resolved_status text;
  resolved_provider text;
  confirmed_at timestamptz;
begin
  select
    role,
    account_status
  into
    resolved_role,
    resolved_status
  from public.user_roles
  where
    user_id =
      new.user_id;

  if
    resolved_status is null
    or resolved_status <> 'active'
  then
    raise exception
      'ROFFLE account is not active.';
  end if;

  select
    raw_app_meta_data ->> 'provider',
    email_confirmed_at
  into
    resolved_provider,
    confirmed_at
  from auth.users
  where
    id =
      new.user_id;

  if
    resolved_provider = 'email'
    and confirmed_at is null
  then
    raise exception
      'Confirm your email before posting.';
  end if;

  new.submitted_at :=
    now();

  if
    resolved_role in (
      'moderator',
      'admin'
    )
  then
    new.moderation_status :=
      'approved';

    new.published :=
      true;

    new.moderated_at :=
      now();

    new.moderated_by :=
      new.user_id;

    new.moderation_note :=
      null;
  else
    new.moderation_status :=
      'pending';

    new.published :=
      false;

    new.moderated_at :=
      null;

    new.moderated_by :=
      null;

    new.moderation_note :=
      null;
  end if;

  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.create_forum_reply(target_thread uuid, reply_body text, reply_gif_id text, reply_gif_url text, reply_gif_preview_url text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  caller_id uuid;
  clean_body text;
  clean_gif_id text;
  clean_gif_url text;
  clean_gif_preview_url text;
  new_reply_id uuid;
  thread_locked boolean;
begin
  caller_id :=
    public.require_active_forum_user();

  clean_body :=
    nullif(
      trim(
        coalesce(
          reply_body,
          ''
        )
      ),
      ''
    );

  clean_gif_id :=
    nullif(
      trim(
        coalesce(
          reply_gif_id,
          ''
        )
      ),
      ''
    );

  clean_gif_url :=
    nullif(
      trim(
        coalesce(
          reply_gif_url,
          ''
        )
      ),
      ''
    );

  clean_gif_preview_url :=
    nullif(
      trim(
        coalesce(
          reply_gif_preview_url,
          ''
        )
      ),
      ''
    );

  if
    clean_body is null
    and clean_gif_url is null
  then
    raise exception
      'Write a reply or choose a GIF.';
  end if;

  if
    clean_body is not null
    and char_length(
      clean_body
    ) > 5000
  then
    raise exception
      'Forum replies are limited to 5000 characters.';
  end if;

  if
    clean_gif_url is not null
    and clean_gif_url !~ '^https://'
  then
    raise exception
      'Invalid GIF URL.';
  end if;

  select
    t.is_locked
  into
    thread_locked
  from
    public.forum_threads t
  where
    t.id =
      target_thread;

  if thread_locked is null
  then
    raise exception
      'Thread not found.';
  end if;

  if
    thread_locked = true
    and not
      public.is_staff()
  then
    raise exception
      'This thread is locked.';
  end if;

  insert into
    public.forum_replies (
      thread_id,
      user_id,
      body,
      gif_id,
      gif_url,
      gif_preview_url
    )
  values (
    target_thread,
    caller_id,
    clean_body,
    clean_gif_id,
    clean_gif_url,
    clean_gif_preview_url
  )
  returning
    id
  into
    new_reply_id;

  return
    new_reply_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.create_forum_thread(target_category uuid, thread_title text, thread_body text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  caller_id uuid;
  new_thread_id uuid;
  clean_title text;
  clean_body text;
begin
  caller_id :=
    public.require_active_forum_user();

  clean_title :=
    trim(
      thread_title
    );

  clean_body :=
    trim(
      thread_body
    );

  if
    char_length(
      clean_title
    ) not between
      1 and 140
  then
    raise exception
      'Thread title must be 1 to 140 characters.';
  end if;

  if
    char_length(
      clean_body
    ) not between
      1 and 5000
  then
    raise exception
      'Forum posts must be 1 to 5000 characters.';
  end if;

  if not exists (
    select
      1
    from
      public.forum_categories c
    where
      c.id =
        target_category
      and c.active =
        true
  )
  then
    raise exception
      'Choose an active forum category.';
  end if;

  insert into
    public.forum_threads (
      category_id,
      user_id,
      title,
      body
    )
  values (
    target_category,
    caller_id,
    clean_title,
    clean_body
  )
  returning
    id
  into
    new_thread_id;

  return
    new_thread_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.delete_forum_reply(target_reply uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  caller_id uuid;
  owner_id uuid;
begin
  caller_id :=
    public.require_active_forum_user();

  select
    r.user_id
  into
    owner_id
  from
    public.forum_replies r
  where
    r.id =
      target_reply;

  if owner_id is null
  then
    raise exception
      'Reply not found.';
  end if;

  if
    owner_id <>
      caller_id
    and not
      public.is_staff()
  then
    raise exception
      'You cannot delete this reply.';
  end if;

  delete from
    public.forum_replies
  where
    id =
      target_reply;
end;
$function$;

CREATE OR REPLACE FUNCTION public.delete_forum_thread(target_thread uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  caller_id uuid;
  owner_id uuid;
begin
  caller_id :=
    public.require_active_forum_user();

  select
    t.user_id
  into
    owner_id
  from
    public.forum_threads t
  where
    t.id =
      target_thread;

  if owner_id is null
  then
    raise exception
      'Thread not found.';
  end if;

  if
    owner_id <>
      caller_id
    and not
      public.is_staff()
  then
    raise exception
      'You cannot delete this thread.';
  end if;

  delete from
    public.forum_threads
  where
    id =
      target_thread;
end;
$function$;

CREATE OR REPLACE FUNCTION public.delete_post(target_post uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  caller_id uuid;
  owner_id uuid;
begin
  caller_id :=
    auth.uid();

  if caller_id is null
  then
    raise exception
      'Sign in to delete a post.';
  end if;


  select
    p.user_id
  into
    owner_id
  from public.posts p
  where
    p.id =
      target_post;


  if owner_id is null
  then
    raise exception
      'Post not found.';
  end if;


  if
    owner_id <>
      caller_id
    and not
      public.is_staff()
  then
    raise exception
      'You cannot delete this post.';
  end if;


  delete from public.posts
  where
    id =
      target_post;
end;
$function$;

CREATE OR REPLACE FUNCTION public.edit_post(target_post uuid, new_title text, new_body text, new_youtube_url text, new_youtube_id text, new_video_type text, new_image_url text, new_category_id uuid, new_tag_ids uuid[], new_gif_id text, new_gif_url text, new_gif_preview_url text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  caller_id uuid;
  owner_id uuid;
  existing_type text;
  caller_is_staff boolean;
  normalized_tag_count integer;
  valid_tag_count integer;
begin
  caller_id :=
    auth.uid();

  if caller_id is null
  then
    raise exception
      'Sign in to edit a post.';
  end if;


  select
    p.user_id,
    p.post_type
  into
    owner_id,
    existing_type
  from public.posts p
  where
    p.id =
      target_post;


  if owner_id is null
  then
    raise exception
      'Post not found.';
  end if;


  if owner_id <>
    caller_id
  then
    raise exception
      'Only the original author can edit this post.';
  end if;


  if not exists (
    select 1
    from public.user_roles ur
    where
      ur.user_id =
        caller_id
      and ur.account_status =
        'active'
  )
  then
    raise exception
      'ROFFLE account is not active.';
  end if;


  caller_is_staff :=
    public.is_staff();


  if not exists (
    select 1
    from public.post_categories pc
    where
      pc.id =
        new_category_id
      and pc.active =
        true
  )
  then
    raise exception
      'Choose an active category.';
  end if;


  select
    count(
      distinct value
    )
  into
    normalized_tag_count
  from unnest(
    coalesce(
      new_tag_ids,
      array[]::uuid[]
    )
  ) as selected(value);


  if normalized_tag_count >
    5
  then
    raise exception
      'Choose no more than five tags.';
  end if;


  select
    count(*)
  into
    valid_tag_count
  from public.tags t
  where
    t.active =
      true
    and t.id in (
      select distinct value
      from unnest(
        coalesce(
          new_tag_ids,
          array[]::uuid[]
        )
      ) as selected(value)
    );


  if valid_tag_count <>
    normalized_tag_count
  then
    raise exception
      'One or more selected tags are unavailable.';
  end if;


  if
    existing_type =
      'youtube'
  then
    if
      new_youtube_url is null
      or new_youtube_id is null
      or new_video_type not in (
        'short',
        'video'
      )
    then
      raise exception
        'A valid YouTube video is required.';
    end if;

  elsif
    existing_type =
      'text'
  then
    if
      new_title is null
      or char_length(
        trim(
          new_title
        )
      ) not between
        1 and 180
      or new_body is null
      or char_length(
        trim(
          new_body
        )
      ) not between
        1 and 500
    then
      raise exception
        'Text posts need a title and content.';
    end if;

  elsif
    existing_type =
      'image'
  then
    if new_image_url is null
    then
      raise exception
        'Image posts need an image.';
    end if;

  else
    raise exception
      'Unsupported post type.';
  end if;


  if
    new_title is not null
    and char_length(
      trim(
        new_title
      )
    ) >
      180
  then
    raise exception
      'Titles are limited to 180 characters.';
  end if;


  if
    new_body is not null
    and char_length(
      trim(
        new_body
      )
    ) >
      500
  then
    raise exception
      'Post text is limited to 500 characters.';
  end if;


  if
    (
      new_gif_id is null
      and
      (
        new_gif_url is not null
        or new_gif_preview_url is not null
      )
    )
    or
    (
      new_gif_id is not null
      and new_gif_url is null
    )
  then
    raise exception
      'Invalid GIF attachment.';
  end if;


  update public.posts
  set
    title =
      nullif(
        trim(
          new_title
        ),
        ''
      ),

    body =
      nullif(
        trim(
          new_body
        ),
        ''
      ),

    youtube_url =
      case
        when existing_type =
          'youtube'
          then new_youtube_url
        else null
      end,

    youtube_id =
      case
        when existing_type =
          'youtube'
          then new_youtube_id
        else null
      end,

    video_type =
      case
        when existing_type =
          'youtube'
          then new_video_type
        else null
      end,

    image_url =
      case
        when existing_type =
          'image'
          then new_image_url
        else null
      end,

    category_id =
      new_category_id,

    gif_id =
      new_gif_id,

    gif_url =
      new_gif_url,

    gif_preview_url =
      new_gif_preview_url,

    moderation_status =
      case
        when caller_is_staff
          then 'approved'
        else 'pending'
      end,

    published =
      caller_is_staff,

    submitted_at =
      now(),

    moderated_at =
      case
        when caller_is_staff
          then now()
        else null
      end,

    moderated_by =
      case
        when caller_is_staff
          then caller_id
        else null
      end,

    moderation_note =
      case
        when caller_is_staff
          then 'Edited by staff author.'
        else null
      end,

    updated_at =
      now()

  where
    id =
      target_post;


  delete from
    public.post_tags
  where
    post_id =
      target_post;


  insert into
    public.post_tags (
      post_id,
      tag_id
    )
  select
    target_post,
    selected.value
  from (
    select distinct value
    from unnest(
      coalesce(
        new_tag_ids,
        array[]::uuid[]
      )
    ) as values_list(value)
  ) as selected;
end;
$function$;

CREATE OR REPLACE FUNCTION public.flag_comment(target_comment uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  comment_owner uuid;
  inserted_count integer;
begin
  if auth.uid() is null
  then
    raise exception
      'Sign in to report a comment.';
  end if;

  if not exists (
    select 1
    from public.user_roles ur
    where
      ur.user_id =
        auth.uid()
      and ur.account_status =
        'active'
  )
  then
    raise exception
      'ROFFLE account is not active.';
  end if;

  select
    pc.user_id
  into
    comment_owner
  from public.post_comments pc
  where
    pc.id =
      target_comment;

  if comment_owner is null
  then
    raise exception
      'Comment not found.';
  end if;

  if comment_owner =
    auth.uid()
  then
    raise exception
      'You cannot report your own comment.';
  end if;

  insert into public.comment_reports (
    comment_id,
    reported_by
  )
  values (
    target_comment,
    auth.uid()
  )
  on conflict (
    comment_id,
    reported_by
  )
  do nothing;

  get diagnostics
    inserted_count =
      row_count;

  return
    inserted_count > 0;
end;
$function$;

CREATE OR REPLACE FUNCTION public.get_youtube_gems(result_limit integer DEFAULT 3)
 RETURNS TABLE(post_id uuid, title text, youtube_id text, like_count bigint, comment_count bigint, engagement_score bigint)
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
  with like_counts as (
    select
      pl.post_id,
      count(*)::bigint
        as like_count
    from public.post_likes pl
    group by
      pl.post_id
  ),

  comment_counts as (
    select
      pc.post_id,
      count(*)::bigint
        as comment_count
    from public.post_comments pc
    group by
      pc.post_id
  )

  select
    p.id
      as post_id,

    coalesce(
      nullif(
        trim(p.title),
        ''
      ),
      case
        when p.video_type =
          'short'
          then 'YouTube Short'
        else 'YouTube video'
      end
    )::text
      as title,

    p.youtube_id::text,

    coalesce(
      lc.like_count,
      0
    )::bigint
      as like_count,

    coalesce(
      cc.comment_count,
      0
    )::bigint
      as comment_count,

    (
      coalesce(
        lc.like_count,
        0
      )
      +
      coalesce(
        cc.comment_count,
        0
      )
    )::bigint
      as engagement_score

  from public.posts p

  left join like_counts lc
    on lc.post_id =
      p.id

  left join comment_counts cc
    on cc.post_id =
      p.id

  where
    p.post_type =
      'youtube'
    and p.youtube_id
      is not null
    and p.moderation_status =
      'approved'
    and p.published =
      true

  order by
    engagement_score desc,
    like_count desc,
    comment_count desc,
    p.created_at desc

  limit least(
    greatest(
      coalesce(
        result_limit,
        3
      ),
      1
    ),
    10
  );
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  resolved_name text;
  resolved_avatar text;
  resolved_provider text;
  resolved_username text;
begin
  resolved_username :=
    nullif(
      trim(
        new.raw_user_meta_data
          ->> 'username'
      ),
      ''
    );

  resolved_name :=
    coalesce(
      nullif(
        trim(
          new.raw_user_meta_data
            ->> 'display_name'
        ),
        ''
      ),
      nullif(
        trim(
          new.raw_user_meta_data
            ->> 'full_name'
        ),
        ''
      ),
      nullif(
        trim(
          new.raw_user_meta_data
            ->> 'name'
        ),
        ''
      ),
      resolved_username,
      split_part(
        coalesce(
          new.email,
          'ROFFLE User'
        ),
        '@',
        1
      ),
      'ROFFLE User'
    );

  resolved_avatar :=
    coalesce(
      new.raw_user_meta_data
        ->> 'avatar_url',
      new.raw_user_meta_data
        ->> 'picture'
    );

  resolved_provider :=
    new.raw_app_meta_data
      ->> 'provider';

  insert into public.profiles (
    id,
    username,
    display_name,
    avatar_url,
    provider
  )
  values (
    new.id,
    resolved_username,
    resolved_name,
    resolved_avatar,
    resolved_provider
  )
  on conflict (id)
  do update
  set
    username =
      coalesce(
        excluded.username,
        public.profiles.username
      ),

    display_name =
      excluded.display_name,

    avatar_url =
      coalesce(
        excluded.avatar_url,
        public.profiles.avatar_url
      ),

    provider =
      coalesce(
        excluded.provider,
        public.profiles.provider
      ),

    updated_at =
      now();

  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user_role()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  insert into public.user_roles (
    user_id,
    role,
    account_status
  )
  values (
    new.id,
    'user',
    'active'
  )
  on conflict (user_id)
  do nothing;

  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.increment_forum_thread_view(target_thread uuid)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
  update
    public.forum_threads
  set
    view_count =
      view_count +
      1
  where
    id =
      target_thread;
$function$;

CREATE OR REPLACE FUNCTION public.is_active_roffle_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select exists (
    select
      1
    from
      public.user_roles ur
    where
      ur.user_id =
        auth.uid()
      and ur.role =
        'admin'
      and ur.account_status =
        'active'
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select exists (
    select 1
    from public.user_roles
    where
      user_id = auth.uid()
      and role = 'admin'
      and account_status =
        'active'
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_staff()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select exists (
    select 1
    from public.user_roles
    where
      user_id = auth.uid()
      and role in (
        'moderator',
        'admin'
      )
      and account_status =
        'active'
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_username_available(candidate text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select
    candidate is not null
    and trim(candidate)
      ~ '^[A-Za-z0-9_]{3,24}$'
    and not exists (
      select 1
      from public.profiles
      where
        lower(username) =
        lower(
          trim(candidate)
        )
    );
$function$;

CREATE OR REPLACE FUNCTION public.moderate_post(target_post uuid, decision text, note text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not public.is_staff()
  then
    raise exception
      'Moderator access required.';
  end if;

  if
    decision not in (
      'approved',
      'rejected'
    )
  then
    raise exception
      'Invalid moderation decision.';
  end if;

  update public.posts
  set
    moderation_status =
      decision,

    published =
      (
        decision =
        'approved'
      ),

    moderated_at =
      now(),

    moderated_by =
      auth.uid(),

    moderation_note =
      nullif(
        trim(note),
        ''
      )
  where
    id =
      target_post;

  if not found
  then
    raise exception
      'Post not found.';
  end if;
end;
$function$;

CREATE OR REPLACE FUNCTION public.require_active_forum_user()
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  caller_id uuid;
begin
  caller_id :=
    auth.uid();

  if caller_id is null
  then
    raise exception
      'Sign in to use the Forum.';
  end if;

  if not exists (
    select
      1
    from
      public.user_roles ur
    where
      ur.user_id =
        caller_id
      and ur.account_status =
        'active'
  )
  then
    raise exception
      'Your ROFFLE account is not active.';
  end if;

  return
    caller_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.set_forum_thread_controls(target_thread uuid, pinned boolean, locked boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not
    public.is_staff()
  then
    raise exception
      'Staff access required.';
  end if;

  update
    public.forum_threads
  set
    is_pinned =
      pinned,

    is_locked =
      locked,

    updated_at =
      now()

  where
    id =
      target_thread;

  if not found
  then
    raise exception
      'Thread not found.';
  end if;
end;
$function$;

CREATE OR REPLACE FUNCTION public.set_post_display_size(target_post uuid, new_display_size text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  caller_id uuid;
  owner_id uuid;
  clean_size text;
begin
  caller_id :=
    auth.uid();

  if caller_id is null
  then
    raise exception
      'Sign in to change post layout.';
  end if;

  clean_size :=
    lower(
      trim(
        coalesce(
          new_display_size,
          ''
        )
      )
    );

  if clean_size not in (
    'small',
    'large',
    'wide'
  )
  then
    raise exception
      'Post size must be small, large, or wide.';
  end if;

  select
    p.user_id
  into
    owner_id
  from
    public.posts p
  where
    p.id =
      target_post;

  if owner_id is null
  then
    raise exception
      'Post not found.';
  end if;

  if
    owner_id <>
      caller_id
    and not
      public.is_staff()
  then
    raise exception
      'You cannot change this post layout.';
  end if;

  update
    public.posts
  set
    display_size =
      clean_size,

    updated_at =
      now()

  where
    id =
      target_post;
end;
$function$;

CREATE OR REPLACE FUNCTION public.set_post_tags(target_post uuid, tag_ids uuid[])
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  caller_id uuid;
  normalized_count integer;
  valid_count integer;
begin
  caller_id :=
    auth.uid();

  if caller_id is null
  then
    raise exception
      'Sign in to tag a post.';
  end if;

  if not exists (
    select 1
    from public.posts p
    where
      p.id =
        target_post
      and
      (
        p.user_id =
          caller_id
        or
        public.is_staff()
      )
  )
  then
    raise exception
      'You cannot edit tags on this post.';
  end if;

  select
    count(
      distinct value
    )
  into
    normalized_count
  from unnest(
    coalesce(
      tag_ids,
      array[]::uuid[]
    )
  ) as selected(value);

  if normalized_count >
    5
  then
    raise exception
      'Choose no more than five tags.';
  end if;

  select
    count(*)
  into
    valid_count
  from public.tags t
  where
    t.active =
      true
    and t.id in (
      select distinct value
      from unnest(
        coalesce(
          tag_ids,
          array[]::uuid[]
        )
      ) as selected(value)
    );

  if valid_count <>
    normalized_count
  then
    raise exception
      'One or more selected tags are unavailable.';
  end if;

  delete from
    public.post_tags
  where
    post_id =
      target_post;

  insert into
    public.post_tags (
      post_id,
      tag_id
    )
  select
    target_post,
    selected.value
  from (
    select distinct value
    from unnest(
      coalesce(
        tag_ids,
        array[]::uuid[]
      )
    ) as values_list(value)
  ) as selected;
end;
$function$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.sync_forum_thread_reply_stats()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  affected_thread uuid;
begin
  affected_thread :=
    coalesce(
      new.thread_id,
      old.thread_id
    );

  update
    public.forum_threads t
  set
    reply_count =
      (
        select
          count(*)::integer
        from
          public.forum_replies r
        where
          r.thread_id =
            affected_thread
      ),

    last_activity_at =
      greatest(
        t.created_at,
        coalesce(
          (
            select
              max(
                r.created_at
              )
            from
              public.forum_replies r
            where
              r.thread_id =
                affected_thread
          ),
          t.created_at
        )
      ),

    updated_at =
      now()

  where
    t.id =
      affected_thread;

  return
    coalesce(
      new,
      old
    );
end;
$function$;

CREATE OR REPLACE FUNCTION public.validate_post_category()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin
  if
    tg_op =
      'INSERT'
  then
    if
      new.category_id is not null
      and not exists (
        select 1
        from public.post_categories pc
        where
          pc.id =
            new.category_id
          and pc.active =
            true
      )
    then
      raise exception
        'Choose an active category.';
    end if;

  elsif
    new.category_id is distinct from
      old.category_id
  then
    if
      new.category_id is not null
      and not exists (
        select 1
        from public.post_categories pc
        where
          pc.id =
            new.category_id
          and pc.active =
            true
      )
    then
      raise exception
        'Choose an active category.';
    end if;
  end if;

  return new;
end;
$function$;

ALTER TABLE public."blog_posts" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public."blog_posts" FROM anon, authenticated, service_role;

ALTER TABLE public."comment_reports" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public."comment_reports" FROM anon, authenticated, service_role;

ALTER TABLE public."forum_categories" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public."forum_categories" FROM anon, authenticated, service_role;

ALTER TABLE public."forum_replies" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public."forum_replies" FROM anon, authenticated, service_role;

ALTER TABLE public."forum_threads" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public."forum_threads" FROM anon, authenticated, service_role;

ALTER TABLE public."post_categories" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public."post_categories" FROM anon, authenticated, service_role;

ALTER TABLE public."post_comments" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public."post_comments" FROM anon, authenticated, service_role;

ALTER TABLE public."post_likes" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public."post_likes" FROM anon, authenticated, service_role;

ALTER TABLE public."post_tags" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public."post_tags" FROM anon, authenticated, service_role;

ALTER TABLE public."posts" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public."posts" FROM anon, authenticated, service_role;

ALTER TABLE public."profiles" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public."profiles" FROM anon, authenticated, service_role;

ALTER TABLE public."tags" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public."tags" FROM anon, authenticated, service_role;

ALTER TABLE public."user_roles" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public."user_roles" FROM anon, authenticated, service_role;

GRANT REFERENCES ON TABLE public."blog_posts" TO "anon";

GRANT SELECT ON TABLE public."blog_posts" TO "anon";

GRANT TRIGGER ON TABLE public."blog_posts" TO "anon";

GRANT TRUNCATE ON TABLE public."blog_posts" TO "anon";

GRANT REFERENCES ON TABLE public."forum_categories" TO "anon";

GRANT SELECT ON TABLE public."forum_categories" TO "anon";

GRANT TRIGGER ON TABLE public."forum_categories" TO "anon";

GRANT TRUNCATE ON TABLE public."forum_categories" TO "anon";

GRANT REFERENCES ON TABLE public."forum_replies" TO "anon";

GRANT SELECT ON TABLE public."forum_replies" TO "anon";

GRANT TRIGGER ON TABLE public."forum_replies" TO "anon";

GRANT TRUNCATE ON TABLE public."forum_replies" TO "anon";

GRANT REFERENCES ON TABLE public."forum_threads" TO "anon";

GRANT SELECT ON TABLE public."forum_threads" TO "anon";

GRANT TRIGGER ON TABLE public."forum_threads" TO "anon";

GRANT TRUNCATE ON TABLE public."forum_threads" TO "anon";

GRANT REFERENCES ON TABLE public."post_categories" TO "anon";

GRANT SELECT ON TABLE public."post_categories" TO "anon";

GRANT TRIGGER ON TABLE public."post_categories" TO "anon";

GRANT TRUNCATE ON TABLE public."post_categories" TO "anon";

GRANT DELETE ON TABLE public."post_comments" TO "anon";

GRANT INSERT ON TABLE public."post_comments" TO "anon";

GRANT REFERENCES ON TABLE public."post_comments" TO "anon";

GRANT SELECT ON TABLE public."post_comments" TO "anon";

GRANT TRIGGER ON TABLE public."post_comments" TO "anon";

GRANT TRUNCATE ON TABLE public."post_comments" TO "anon";

GRANT UPDATE ON TABLE public."post_comments" TO "anon";

GRANT DELETE ON TABLE public."post_likes" TO "anon";

GRANT INSERT ON TABLE public."post_likes" TO "anon";

GRANT REFERENCES ON TABLE public."post_likes" TO "anon";

GRANT SELECT ON TABLE public."post_likes" TO "anon";

GRANT TRIGGER ON TABLE public."post_likes" TO "anon";

GRANT TRUNCATE ON TABLE public."post_likes" TO "anon";

GRANT UPDATE ON TABLE public."post_likes" TO "anon";

GRANT REFERENCES ON TABLE public."post_tags" TO "anon";

GRANT SELECT ON TABLE public."post_tags" TO "anon";

GRANT TRIGGER ON TABLE public."post_tags" TO "anon";

GRANT TRUNCATE ON TABLE public."post_tags" TO "anon";

GRANT DELETE ON TABLE public."posts" TO "anon";

GRANT INSERT ON TABLE public."posts" TO "anon";

GRANT REFERENCES ON TABLE public."posts" TO "anon";

GRANT SELECT ON TABLE public."posts" TO "anon";

GRANT TRIGGER ON TABLE public."posts" TO "anon";

GRANT TRUNCATE ON TABLE public."posts" TO "anon";

GRANT UPDATE ON TABLE public."posts" TO "anon";

GRANT DELETE ON TABLE public."profiles" TO "anon";

GRANT INSERT ON TABLE public."profiles" TO "anon";

GRANT REFERENCES ON TABLE public."profiles" TO "anon";

GRANT SELECT ON TABLE public."profiles" TO "anon";

GRANT TRIGGER ON TABLE public."profiles" TO "anon";

GRANT TRUNCATE ON TABLE public."profiles" TO "anon";

GRANT UPDATE ON TABLE public."profiles" TO "anon";

GRANT REFERENCES ON TABLE public."tags" TO "anon";

GRANT SELECT ON TABLE public."tags" TO "anon";

GRANT TRIGGER ON TABLE public."tags" TO "anon";

GRANT TRUNCATE ON TABLE public."tags" TO "anon";

GRANT REFERENCES ON TABLE public."user_roles" TO "anon";

GRANT SELECT ON TABLE public."user_roles" TO "anon";

GRANT TRIGGER ON TABLE public."user_roles" TO "anon";

GRANT TRUNCATE ON TABLE public."user_roles" TO "anon";

GRANT REFERENCES ON TABLE public."blog_posts" TO "authenticated";

GRANT SELECT ON TABLE public."blog_posts" TO "authenticated";

GRANT TRIGGER ON TABLE public."blog_posts" TO "authenticated";

GRANT TRUNCATE ON TABLE public."blog_posts" TO "authenticated";

GRANT REFERENCES ON TABLE public."forum_categories" TO "authenticated";

GRANT SELECT ON TABLE public."forum_categories" TO "authenticated";

GRANT TRIGGER ON TABLE public."forum_categories" TO "authenticated";

GRANT TRUNCATE ON TABLE public."forum_categories" TO "authenticated";

GRANT REFERENCES ON TABLE public."forum_replies" TO "authenticated";

GRANT SELECT ON TABLE public."forum_replies" TO "authenticated";

GRANT TRIGGER ON TABLE public."forum_replies" TO "authenticated";

GRANT TRUNCATE ON TABLE public."forum_replies" TO "authenticated";

GRANT REFERENCES ON TABLE public."forum_threads" TO "authenticated";

GRANT SELECT ON TABLE public."forum_threads" TO "authenticated";

GRANT TRIGGER ON TABLE public."forum_threads" TO "authenticated";

GRANT TRUNCATE ON TABLE public."forum_threads" TO "authenticated";

GRANT REFERENCES ON TABLE public."post_categories" TO "authenticated";

GRANT SELECT ON TABLE public."post_categories" TO "authenticated";

GRANT TRIGGER ON TABLE public."post_categories" TO "authenticated";

GRANT TRUNCATE ON TABLE public."post_categories" TO "authenticated";

GRANT DELETE ON TABLE public."post_comments" TO "authenticated";

GRANT INSERT ON TABLE public."post_comments" TO "authenticated";

GRANT REFERENCES ON TABLE public."post_comments" TO "authenticated";

GRANT SELECT ON TABLE public."post_comments" TO "authenticated";

GRANT TRIGGER ON TABLE public."post_comments" TO "authenticated";

GRANT TRUNCATE ON TABLE public."post_comments" TO "authenticated";

GRANT UPDATE ON TABLE public."post_comments" TO "authenticated";

GRANT DELETE ON TABLE public."post_likes" TO "authenticated";

GRANT INSERT ON TABLE public."post_likes" TO "authenticated";

GRANT REFERENCES ON TABLE public."post_likes" TO "authenticated";

GRANT SELECT ON TABLE public."post_likes" TO "authenticated";

GRANT TRIGGER ON TABLE public."post_likes" TO "authenticated";

GRANT TRUNCATE ON TABLE public."post_likes" TO "authenticated";

GRANT UPDATE ON TABLE public."post_likes" TO "authenticated";

GRANT REFERENCES ON TABLE public."post_tags" TO "authenticated";

GRANT SELECT ON TABLE public."post_tags" TO "authenticated";

GRANT TRIGGER ON TABLE public."post_tags" TO "authenticated";

GRANT TRUNCATE ON TABLE public."post_tags" TO "authenticated";

GRANT DELETE ON TABLE public."posts" TO "authenticated";

GRANT INSERT ON TABLE public."posts" TO "authenticated";

GRANT REFERENCES ON TABLE public."posts" TO "authenticated";

GRANT SELECT ON TABLE public."posts" TO "authenticated";

GRANT TRIGGER ON TABLE public."posts" TO "authenticated";

GRANT TRUNCATE ON TABLE public."posts" TO "authenticated";

GRANT UPDATE ON TABLE public."posts" TO "authenticated";

GRANT DELETE ON TABLE public."profiles" TO "authenticated";

GRANT INSERT ON TABLE public."profiles" TO "authenticated";

GRANT REFERENCES ON TABLE public."profiles" TO "authenticated";

GRANT SELECT ON TABLE public."profiles" TO "authenticated";

GRANT TRIGGER ON TABLE public."profiles" TO "authenticated";

GRANT TRUNCATE ON TABLE public."profiles" TO "authenticated";

GRANT UPDATE ON TABLE public."profiles" TO "authenticated";

GRANT REFERENCES ON TABLE public."tags" TO "authenticated";

GRANT SELECT ON TABLE public."tags" TO "authenticated";

GRANT TRIGGER ON TABLE public."tags" TO "authenticated";

GRANT TRUNCATE ON TABLE public."tags" TO "authenticated";

GRANT REFERENCES ON TABLE public."user_roles" TO "authenticated";

GRANT SELECT ON TABLE public."user_roles" TO "authenticated";

GRANT TRIGGER ON TABLE public."user_roles" TO "authenticated";

GRANT TRUNCATE ON TABLE public."user_roles" TO "authenticated";

GRANT DELETE ON TABLE public."blog_posts" TO "service_role";

GRANT INSERT ON TABLE public."blog_posts" TO "service_role";

GRANT REFERENCES ON TABLE public."blog_posts" TO "service_role";

GRANT SELECT ON TABLE public."blog_posts" TO "service_role";

GRANT TRIGGER ON TABLE public."blog_posts" TO "service_role";

GRANT TRUNCATE ON TABLE public."blog_posts" TO "service_role";

GRANT UPDATE ON TABLE public."blog_posts" TO "service_role";

GRANT DELETE ON TABLE public."forum_categories" TO "service_role";

GRANT INSERT ON TABLE public."forum_categories" TO "service_role";

GRANT REFERENCES ON TABLE public."forum_categories" TO "service_role";

GRANT SELECT ON TABLE public."forum_categories" TO "service_role";

GRANT TRIGGER ON TABLE public."forum_categories" TO "service_role";

GRANT TRUNCATE ON TABLE public."forum_categories" TO "service_role";

GRANT UPDATE ON TABLE public."forum_categories" TO "service_role";

GRANT DELETE ON TABLE public."forum_replies" TO "service_role";

GRANT INSERT ON TABLE public."forum_replies" TO "service_role";

GRANT REFERENCES ON TABLE public."forum_replies" TO "service_role";

GRANT SELECT ON TABLE public."forum_replies" TO "service_role";

GRANT TRIGGER ON TABLE public."forum_replies" TO "service_role";

GRANT TRUNCATE ON TABLE public."forum_replies" TO "service_role";

GRANT UPDATE ON TABLE public."forum_replies" TO "service_role";

GRANT DELETE ON TABLE public."forum_threads" TO "service_role";

GRANT INSERT ON TABLE public."forum_threads" TO "service_role";

GRANT REFERENCES ON TABLE public."forum_threads" TO "service_role";

GRANT SELECT ON TABLE public."forum_threads" TO "service_role";

GRANT TRIGGER ON TABLE public."forum_threads" TO "service_role";

GRANT TRUNCATE ON TABLE public."forum_threads" TO "service_role";

GRANT UPDATE ON TABLE public."forum_threads" TO "service_role";

GRANT DELETE ON TABLE public."post_categories" TO "service_role";

GRANT INSERT ON TABLE public."post_categories" TO "service_role";

GRANT REFERENCES ON TABLE public."post_categories" TO "service_role";

GRANT SELECT ON TABLE public."post_categories" TO "service_role";

GRANT TRIGGER ON TABLE public."post_categories" TO "service_role";

GRANT TRUNCATE ON TABLE public."post_categories" TO "service_role";

GRANT UPDATE ON TABLE public."post_categories" TO "service_role";

GRANT DELETE ON TABLE public."post_comments" TO "service_role";

GRANT INSERT ON TABLE public."post_comments" TO "service_role";

GRANT REFERENCES ON TABLE public."post_comments" TO "service_role";

GRANT SELECT ON TABLE public."post_comments" TO "service_role";

GRANT TRIGGER ON TABLE public."post_comments" TO "service_role";

GRANT TRUNCATE ON TABLE public."post_comments" TO "service_role";

GRANT UPDATE ON TABLE public."post_comments" TO "service_role";

GRANT DELETE ON TABLE public."post_likes" TO "service_role";

GRANT INSERT ON TABLE public."post_likes" TO "service_role";

GRANT REFERENCES ON TABLE public."post_likes" TO "service_role";

GRANT SELECT ON TABLE public."post_likes" TO "service_role";

GRANT TRIGGER ON TABLE public."post_likes" TO "service_role";

GRANT TRUNCATE ON TABLE public."post_likes" TO "service_role";

GRANT UPDATE ON TABLE public."post_likes" TO "service_role";

GRANT DELETE ON TABLE public."post_tags" TO "service_role";

GRANT INSERT ON TABLE public."post_tags" TO "service_role";

GRANT REFERENCES ON TABLE public."post_tags" TO "service_role";

GRANT SELECT ON TABLE public."post_tags" TO "service_role";

GRANT TRIGGER ON TABLE public."post_tags" TO "service_role";

GRANT TRUNCATE ON TABLE public."post_tags" TO "service_role";

GRANT UPDATE ON TABLE public."post_tags" TO "service_role";

GRANT DELETE ON TABLE public."posts" TO "service_role";

GRANT INSERT ON TABLE public."posts" TO "service_role";

GRANT REFERENCES ON TABLE public."posts" TO "service_role";

GRANT SELECT ON TABLE public."posts" TO "service_role";

GRANT TRIGGER ON TABLE public."posts" TO "service_role";

GRANT TRUNCATE ON TABLE public."posts" TO "service_role";

GRANT UPDATE ON TABLE public."posts" TO "service_role";

GRANT DELETE ON TABLE public."profiles" TO "service_role";

GRANT INSERT ON TABLE public."profiles" TO "service_role";

GRANT REFERENCES ON TABLE public."profiles" TO "service_role";

GRANT SELECT ON TABLE public."profiles" TO "service_role";

GRANT TRIGGER ON TABLE public."profiles" TO "service_role";

GRANT TRUNCATE ON TABLE public."profiles" TO "service_role";

GRANT UPDATE ON TABLE public."profiles" TO "service_role";

GRANT DELETE ON TABLE public."tags" TO "service_role";

GRANT INSERT ON TABLE public."tags" TO "service_role";

GRANT REFERENCES ON TABLE public."tags" TO "service_role";

GRANT SELECT ON TABLE public."tags" TO "service_role";

GRANT TRIGGER ON TABLE public."tags" TO "service_role";

GRANT TRUNCATE ON TABLE public."tags" TO "service_role";

GRANT UPDATE ON TABLE public."tags" TO "service_role";

GRANT DELETE ON TABLE public."user_roles" TO "service_role";

GRANT INSERT ON TABLE public."user_roles" TO "service_role";

GRANT REFERENCES ON TABLE public."user_roles" TO "service_role";

GRANT SELECT ON TABLE public."user_roles" TO "service_role";

GRANT TRIGGER ON TABLE public."user_roles" TO "service_role";

GRANT TRUNCATE ON TABLE public."user_roles" TO "service_role";

GRANT UPDATE ON TABLE public."user_roles" TO "service_role";

GRANT DELETE ON TABLE public."comment_reports" TO "service_role";

GRANT INSERT ON TABLE public."comment_reports" TO "service_role";

GRANT REFERENCES ON TABLE public."comment_reports" TO "service_role";

GRANT SELECT ON TABLE public."comment_reports" TO "service_role";

GRANT TRIGGER ON TABLE public."comment_reports" TO "service_role";

GRANT TRUNCATE ON TABLE public."comment_reports" TO "service_role";

GRANT UPDATE ON TABLE public."comment_reports" TO "service_role";

GRANT REFERENCES ("accent_style") ON TABLE public."blog_posts" TO "anon";

GRANT SELECT ("accent_style") ON TABLE public."blog_posts" TO "anon";

GRANT REFERENCES ("author_id") ON TABLE public."blog_posts" TO "anon";

GRANT SELECT ("author_id") ON TABLE public."blog_posts" TO "anon";

GRANT REFERENCES ("body") ON TABLE public."blog_posts" TO "anon";

GRANT SELECT ("body") ON TABLE public."blog_posts" TO "anon";

GRANT REFERENCES ("created_at") ON TABLE public."blog_posts" TO "anon";

GRANT SELECT ("created_at") ON TABLE public."blog_posts" TO "anon";

GRANT REFERENCES ("excerpt") ON TABLE public."blog_posts" TO "anon";

GRANT SELECT ("excerpt") ON TABLE public."blog_posts" TO "anon";

GRANT REFERENCES ("hero_image_url") ON TABLE public."blog_posts" TO "anon";

GRANT SELECT ("hero_image_url") ON TABLE public."blog_posts" TO "anon";

GRANT REFERENCES ("id") ON TABLE public."blog_posts" TO "anon";

GRANT SELECT ("id") ON TABLE public."blog_posts" TO "anon";

GRANT REFERENCES ("is_highlighted") ON TABLE public."blog_posts" TO "anon";

GRANT SELECT ("is_highlighted") ON TABLE public."blog_posts" TO "anon";

GRANT REFERENCES ("published_at") ON TABLE public."blog_posts" TO "anon";

GRANT SELECT ("published_at") ON TABLE public."blog_posts" TO "anon";

GRANT REFERENCES ("published") ON TABLE public."blog_posts" TO "anon";

GRANT SELECT ("published") ON TABLE public."blog_posts" TO "anon";

GRANT REFERENCES ("slug") ON TABLE public."blog_posts" TO "anon";

GRANT SELECT ("slug") ON TABLE public."blog_posts" TO "anon";

GRANT REFERENCES ("title") ON TABLE public."blog_posts" TO "anon";

GRANT SELECT ("title") ON TABLE public."blog_posts" TO "anon";

GRANT REFERENCES ("updated_at") ON TABLE public."blog_posts" TO "anon";

GRANT SELECT ("updated_at") ON TABLE public."blog_posts" TO "anon";

GRANT REFERENCES ("active") ON TABLE public."forum_categories" TO "anon";

GRANT SELECT ("active") ON TABLE public."forum_categories" TO "anon";

GRANT REFERENCES ("created_at") ON TABLE public."forum_categories" TO "anon";

GRANT SELECT ("created_at") ON TABLE public."forum_categories" TO "anon";

GRANT REFERENCES ("description") ON TABLE public."forum_categories" TO "anon";

GRANT SELECT ("description") ON TABLE public."forum_categories" TO "anon";

GRANT REFERENCES ("id") ON TABLE public."forum_categories" TO "anon";

GRANT SELECT ("id") ON TABLE public."forum_categories" TO "anon";

GRANT REFERENCES ("name") ON TABLE public."forum_categories" TO "anon";

GRANT SELECT ("name") ON TABLE public."forum_categories" TO "anon";

GRANT REFERENCES ("slug") ON TABLE public."forum_categories" TO "anon";

GRANT SELECT ("slug") ON TABLE public."forum_categories" TO "anon";

GRANT REFERENCES ("sort_order") ON TABLE public."forum_categories" TO "anon";

GRANT SELECT ("sort_order") ON TABLE public."forum_categories" TO "anon";

GRANT REFERENCES ("updated_at") ON TABLE public."forum_categories" TO "anon";

GRANT SELECT ("updated_at") ON TABLE public."forum_categories" TO "anon";

GRANT REFERENCES ("body") ON TABLE public."forum_replies" TO "anon";

GRANT SELECT ("body") ON TABLE public."forum_replies" TO "anon";

GRANT REFERENCES ("created_at") ON TABLE public."forum_replies" TO "anon";

GRANT SELECT ("created_at") ON TABLE public."forum_replies" TO "anon";

GRANT REFERENCES ("gif_id") ON TABLE public."forum_replies" TO "anon";

GRANT SELECT ("gif_id") ON TABLE public."forum_replies" TO "anon";

GRANT REFERENCES ("gif_preview_url") ON TABLE public."forum_replies" TO "anon";

GRANT SELECT ("gif_preview_url") ON TABLE public."forum_replies" TO "anon";

GRANT REFERENCES ("gif_url") ON TABLE public."forum_replies" TO "anon";

GRANT SELECT ("gif_url") ON TABLE public."forum_replies" TO "anon";

GRANT REFERENCES ("id") ON TABLE public."forum_replies" TO "anon";

GRANT SELECT ("id") ON TABLE public."forum_replies" TO "anon";

GRANT REFERENCES ("thread_id") ON TABLE public."forum_replies" TO "anon";

GRANT SELECT ("thread_id") ON TABLE public."forum_replies" TO "anon";

GRANT REFERENCES ("updated_at") ON TABLE public."forum_replies" TO "anon";

GRANT SELECT ("updated_at") ON TABLE public."forum_replies" TO "anon";

GRANT REFERENCES ("user_id") ON TABLE public."forum_replies" TO "anon";

GRANT SELECT ("user_id") ON TABLE public."forum_replies" TO "anon";

GRANT REFERENCES ("body") ON TABLE public."forum_threads" TO "anon";

GRANT SELECT ("body") ON TABLE public."forum_threads" TO "anon";

GRANT REFERENCES ("category_id") ON TABLE public."forum_threads" TO "anon";

GRANT SELECT ("category_id") ON TABLE public."forum_threads" TO "anon";

GRANT REFERENCES ("created_at") ON TABLE public."forum_threads" TO "anon";

GRANT SELECT ("created_at") ON TABLE public."forum_threads" TO "anon";

GRANT REFERENCES ("id") ON TABLE public."forum_threads" TO "anon";

GRANT SELECT ("id") ON TABLE public."forum_threads" TO "anon";

GRANT REFERENCES ("is_locked") ON TABLE public."forum_threads" TO "anon";

GRANT SELECT ("is_locked") ON TABLE public."forum_threads" TO "anon";

GRANT REFERENCES ("is_pinned") ON TABLE public."forum_threads" TO "anon";

GRANT SELECT ("is_pinned") ON TABLE public."forum_threads" TO "anon";

GRANT REFERENCES ("last_activity_at") ON TABLE public."forum_threads" TO "anon";

GRANT SELECT ("last_activity_at") ON TABLE public."forum_threads" TO "anon";

GRANT REFERENCES ("reply_count") ON TABLE public."forum_threads" TO "anon";

GRANT SELECT ("reply_count") ON TABLE public."forum_threads" TO "anon";

GRANT REFERENCES ("title") ON TABLE public."forum_threads" TO "anon";

GRANT SELECT ("title") ON TABLE public."forum_threads" TO "anon";

GRANT REFERENCES ("updated_at") ON TABLE public."forum_threads" TO "anon";

GRANT SELECT ("updated_at") ON TABLE public."forum_threads" TO "anon";

GRANT REFERENCES ("user_id") ON TABLE public."forum_threads" TO "anon";

GRANT SELECT ("user_id") ON TABLE public."forum_threads" TO "anon";

GRANT REFERENCES ("view_count") ON TABLE public."forum_threads" TO "anon";

GRANT SELECT ("view_count") ON TABLE public."forum_threads" TO "anon";

GRANT REFERENCES ("active") ON TABLE public."post_categories" TO "anon";

GRANT SELECT ("active") ON TABLE public."post_categories" TO "anon";

GRANT REFERENCES ("created_at") ON TABLE public."post_categories" TO "anon";

GRANT SELECT ("created_at") ON TABLE public."post_categories" TO "anon";

GRANT REFERENCES ("created_by") ON TABLE public."post_categories" TO "anon";

GRANT SELECT ("created_by") ON TABLE public."post_categories" TO "anon";

GRANT REFERENCES ("id") ON TABLE public."post_categories" TO "anon";

GRANT SELECT ("id") ON TABLE public."post_categories" TO "anon";

GRANT REFERENCES ("name") ON TABLE public."post_categories" TO "anon";

GRANT SELECT ("name") ON TABLE public."post_categories" TO "anon";

GRANT REFERENCES ("slug") ON TABLE public."post_categories" TO "anon";

GRANT SELECT ("slug") ON TABLE public."post_categories" TO "anon";

GRANT REFERENCES ("sort_order") ON TABLE public."post_categories" TO "anon";

GRANT SELECT ("sort_order") ON TABLE public."post_categories" TO "anon";

GRANT REFERENCES ("updated_at") ON TABLE public."post_categories" TO "anon";

GRANT SELECT ("updated_at") ON TABLE public."post_categories" TO "anon";

GRANT INSERT ("body") ON TABLE public."post_comments" TO "anon";

GRANT REFERENCES ("body") ON TABLE public."post_comments" TO "anon";

GRANT SELECT ("body") ON TABLE public."post_comments" TO "anon";

GRANT UPDATE ("body") ON TABLE public."post_comments" TO "anon";

GRANT INSERT ("created_at") ON TABLE public."post_comments" TO "anon";

GRANT REFERENCES ("created_at") ON TABLE public."post_comments" TO "anon";

GRANT SELECT ("created_at") ON TABLE public."post_comments" TO "anon";

GRANT UPDATE ("created_at") ON TABLE public."post_comments" TO "anon";

GRANT INSERT ("gif_id") ON TABLE public."post_comments" TO "anon";

GRANT REFERENCES ("gif_id") ON TABLE public."post_comments" TO "anon";

GRANT SELECT ("gif_id") ON TABLE public."post_comments" TO "anon";

GRANT UPDATE ("gif_id") ON TABLE public."post_comments" TO "anon";

GRANT INSERT ("gif_preview_url") ON TABLE public."post_comments" TO "anon";

GRANT REFERENCES ("gif_preview_url") ON TABLE public."post_comments" TO "anon";

GRANT SELECT ("gif_preview_url") ON TABLE public."post_comments" TO "anon";

GRANT UPDATE ("gif_preview_url") ON TABLE public."post_comments" TO "anon";

GRANT INSERT ("gif_url") ON TABLE public."post_comments" TO "anon";

GRANT REFERENCES ("gif_url") ON TABLE public."post_comments" TO "anon";

GRANT SELECT ("gif_url") ON TABLE public."post_comments" TO "anon";

GRANT UPDATE ("gif_url") ON TABLE public."post_comments" TO "anon";

GRANT INSERT ("id") ON TABLE public."post_comments" TO "anon";

GRANT REFERENCES ("id") ON TABLE public."post_comments" TO "anon";

GRANT SELECT ("id") ON TABLE public."post_comments" TO "anon";

GRANT UPDATE ("id") ON TABLE public."post_comments" TO "anon";

GRANT INSERT ("post_id") ON TABLE public."post_comments" TO "anon";

GRANT REFERENCES ("post_id") ON TABLE public."post_comments" TO "anon";

GRANT SELECT ("post_id") ON TABLE public."post_comments" TO "anon";

GRANT UPDATE ("post_id") ON TABLE public."post_comments" TO "anon";

GRANT INSERT ("user_id") ON TABLE public."post_comments" TO "anon";

GRANT REFERENCES ("user_id") ON TABLE public."post_comments" TO "anon";

GRANT SELECT ("user_id") ON TABLE public."post_comments" TO "anon";

GRANT UPDATE ("user_id") ON TABLE public."post_comments" TO "anon";

GRANT INSERT ("created_at") ON TABLE public."post_likes" TO "anon";

GRANT REFERENCES ("created_at") ON TABLE public."post_likes" TO "anon";

GRANT SELECT ("created_at") ON TABLE public."post_likes" TO "anon";

GRANT UPDATE ("created_at") ON TABLE public."post_likes" TO "anon";

GRANT INSERT ("post_id") ON TABLE public."post_likes" TO "anon";

GRANT REFERENCES ("post_id") ON TABLE public."post_likes" TO "anon";

GRANT SELECT ("post_id") ON TABLE public."post_likes" TO "anon";

GRANT UPDATE ("post_id") ON TABLE public."post_likes" TO "anon";

GRANT INSERT ("user_id") ON TABLE public."post_likes" TO "anon";

GRANT REFERENCES ("user_id") ON TABLE public."post_likes" TO "anon";

GRANT SELECT ("user_id") ON TABLE public."post_likes" TO "anon";

GRANT UPDATE ("user_id") ON TABLE public."post_likes" TO "anon";

GRANT REFERENCES ("created_at") ON TABLE public."post_tags" TO "anon";

GRANT SELECT ("created_at") ON TABLE public."post_tags" TO "anon";

GRANT REFERENCES ("post_id") ON TABLE public."post_tags" TO "anon";

GRANT SELECT ("post_id") ON TABLE public."post_tags" TO "anon";

GRANT REFERENCES ("tag_id") ON TABLE public."post_tags" TO "anon";

GRANT SELECT ("tag_id") ON TABLE public."post_tags" TO "anon";

GRANT INSERT ("body") ON TABLE public."posts" TO "anon";

GRANT REFERENCES ("body") ON TABLE public."posts" TO "anon";

GRANT SELECT ("body") ON TABLE public."posts" TO "anon";

GRANT UPDATE ("body") ON TABLE public."posts" TO "anon";

GRANT INSERT ("category_id") ON TABLE public."posts" TO "anon";

GRANT REFERENCES ("category_id") ON TABLE public."posts" TO "anon";

GRANT SELECT ("category_id") ON TABLE public."posts" TO "anon";

GRANT UPDATE ("category_id") ON TABLE public."posts" TO "anon";

GRANT INSERT ("created_at") ON TABLE public."posts" TO "anon";

GRANT REFERENCES ("created_at") ON TABLE public."posts" TO "anon";

GRANT SELECT ("created_at") ON TABLE public."posts" TO "anon";

GRANT UPDATE ("created_at") ON TABLE public."posts" TO "anon";

GRANT INSERT ("display_size") ON TABLE public."posts" TO "anon";

GRANT REFERENCES ("display_size") ON TABLE public."posts" TO "anon";

GRANT SELECT ("display_size") ON TABLE public."posts" TO "anon";

GRANT UPDATE ("display_size") ON TABLE public."posts" TO "anon";

GRANT INSERT ("front_page_pinned_at") ON TABLE public."posts" TO "anon";

GRANT REFERENCES ("front_page_pinned_at") ON TABLE public."posts" TO "anon";

GRANT SELECT ("front_page_pinned_at") ON TABLE public."posts" TO "anon";

GRANT UPDATE ("front_page_pinned_at") ON TABLE public."posts" TO "anon";

GRANT INSERT ("front_page_pinned_by") ON TABLE public."posts" TO "anon";

GRANT REFERENCES ("front_page_pinned_by") ON TABLE public."posts" TO "anon";

GRANT SELECT ("front_page_pinned_by") ON TABLE public."posts" TO "anon";

GRANT UPDATE ("front_page_pinned_by") ON TABLE public."posts" TO "anon";

GRANT INSERT ("front_page_pinned") ON TABLE public."posts" TO "anon";

GRANT REFERENCES ("front_page_pinned") ON TABLE public."posts" TO "anon";

GRANT SELECT ("front_page_pinned") ON TABLE public."posts" TO "anon";

GRANT UPDATE ("front_page_pinned") ON TABLE public."posts" TO "anon";

GRANT INSERT ("front_page_visible") ON TABLE public."posts" TO "anon";

GRANT REFERENCES ("front_page_visible") ON TABLE public."posts" TO "anon";

GRANT SELECT ("front_page_visible") ON TABLE public."posts" TO "anon";

GRANT UPDATE ("front_page_visible") ON TABLE public."posts" TO "anon";

GRANT INSERT ("gif_id") ON TABLE public."posts" TO "anon";

GRANT REFERENCES ("gif_id") ON TABLE public."posts" TO "anon";

GRANT SELECT ("gif_id") ON TABLE public."posts" TO "anon";

GRANT UPDATE ("gif_id") ON TABLE public."posts" TO "anon";

GRANT INSERT ("gif_preview_url") ON TABLE public."posts" TO "anon";

GRANT REFERENCES ("gif_preview_url") ON TABLE public."posts" TO "anon";

GRANT SELECT ("gif_preview_url") ON TABLE public."posts" TO "anon";

GRANT UPDATE ("gif_preview_url") ON TABLE public."posts" TO "anon";

GRANT INSERT ("gif_url") ON TABLE public."posts" TO "anon";

GRANT REFERENCES ("gif_url") ON TABLE public."posts" TO "anon";

GRANT SELECT ("gif_url") ON TABLE public."posts" TO "anon";

GRANT UPDATE ("gif_url") ON TABLE public."posts" TO "anon";

GRANT INSERT ("id") ON TABLE public."posts" TO "anon";

GRANT REFERENCES ("id") ON TABLE public."posts" TO "anon";

GRANT SELECT ("id") ON TABLE public."posts" TO "anon";

GRANT UPDATE ("id") ON TABLE public."posts" TO "anon";

GRANT INSERT ("image_url") ON TABLE public."posts" TO "anon";

GRANT REFERENCES ("image_url") ON TABLE public."posts" TO "anon";

GRANT SELECT ("image_url") ON TABLE public."posts" TO "anon";

GRANT UPDATE ("image_url") ON TABLE public."posts" TO "anon";

GRANT INSERT ("moderated_at") ON TABLE public."posts" TO "anon";

GRANT REFERENCES ("moderated_at") ON TABLE public."posts" TO "anon";

GRANT SELECT ("moderated_at") ON TABLE public."posts" TO "anon";

GRANT UPDATE ("moderated_at") ON TABLE public."posts" TO "anon";

GRANT INSERT ("moderated_by") ON TABLE public."posts" TO "anon";

GRANT REFERENCES ("moderated_by") ON TABLE public."posts" TO "anon";

GRANT SELECT ("moderated_by") ON TABLE public."posts" TO "anon";

GRANT UPDATE ("moderated_by") ON TABLE public."posts" TO "anon";

GRANT INSERT ("moderation_note") ON TABLE public."posts" TO "anon";

GRANT REFERENCES ("moderation_note") ON TABLE public."posts" TO "anon";

GRANT SELECT ("moderation_note") ON TABLE public."posts" TO "anon";

GRANT UPDATE ("moderation_note") ON TABLE public."posts" TO "anon";

GRANT INSERT ("moderation_status") ON TABLE public."posts" TO "anon";

GRANT REFERENCES ("moderation_status") ON TABLE public."posts" TO "anon";

GRANT SELECT ("moderation_status") ON TABLE public."posts" TO "anon";

GRANT UPDATE ("moderation_status") ON TABLE public."posts" TO "anon";

GRANT INSERT ("post_type") ON TABLE public."posts" TO "anon";

GRANT REFERENCES ("post_type") ON TABLE public."posts" TO "anon";

GRANT SELECT ("post_type") ON TABLE public."posts" TO "anon";

GRANT UPDATE ("post_type") ON TABLE public."posts" TO "anon";

GRANT INSERT ("published") ON TABLE public."posts" TO "anon";

GRANT REFERENCES ("published") ON TABLE public."posts" TO "anon";

GRANT SELECT ("published") ON TABLE public."posts" TO "anon";

GRANT UPDATE ("published") ON TABLE public."posts" TO "anon";

GRANT INSERT ("submitted_at") ON TABLE public."posts" TO "anon";

GRANT REFERENCES ("submitted_at") ON TABLE public."posts" TO "anon";

GRANT SELECT ("submitted_at") ON TABLE public."posts" TO "anon";

GRANT UPDATE ("submitted_at") ON TABLE public."posts" TO "anon";

GRANT INSERT ("title") ON TABLE public."posts" TO "anon";

GRANT REFERENCES ("title") ON TABLE public."posts" TO "anon";

GRANT SELECT ("title") ON TABLE public."posts" TO "anon";

GRANT UPDATE ("title") ON TABLE public."posts" TO "anon";

GRANT INSERT ("updated_at") ON TABLE public."posts" TO "anon";

GRANT REFERENCES ("updated_at") ON TABLE public."posts" TO "anon";

GRANT SELECT ("updated_at") ON TABLE public."posts" TO "anon";

GRANT UPDATE ("updated_at") ON TABLE public."posts" TO "anon";

GRANT INSERT ("user_id") ON TABLE public."posts" TO "anon";

GRANT REFERENCES ("user_id") ON TABLE public."posts" TO "anon";

GRANT SELECT ("user_id") ON TABLE public."posts" TO "anon";

GRANT UPDATE ("user_id") ON TABLE public."posts" TO "anon";

GRANT INSERT ("video_type") ON TABLE public."posts" TO "anon";

GRANT REFERENCES ("video_type") ON TABLE public."posts" TO "anon";

GRANT SELECT ("video_type") ON TABLE public."posts" TO "anon";

GRANT UPDATE ("video_type") ON TABLE public."posts" TO "anon";

GRANT INSERT ("youtube_id") ON TABLE public."posts" TO "anon";

GRANT REFERENCES ("youtube_id") ON TABLE public."posts" TO "anon";

GRANT SELECT ("youtube_id") ON TABLE public."posts" TO "anon";

GRANT UPDATE ("youtube_id") ON TABLE public."posts" TO "anon";

GRANT INSERT ("youtube_url") ON TABLE public."posts" TO "anon";

GRANT REFERENCES ("youtube_url") ON TABLE public."posts" TO "anon";

GRANT SELECT ("youtube_url") ON TABLE public."posts" TO "anon";

GRANT UPDATE ("youtube_url") ON TABLE public."posts" TO "anon";

GRANT INSERT ("avatar_url") ON TABLE public."profiles" TO "anon";

GRANT REFERENCES ("avatar_url") ON TABLE public."profiles" TO "anon";

GRANT SELECT ("avatar_url") ON TABLE public."profiles" TO "anon";

GRANT UPDATE ("avatar_url") ON TABLE public."profiles" TO "anon";

GRANT INSERT ("created_at") ON TABLE public."profiles" TO "anon";

GRANT REFERENCES ("created_at") ON TABLE public."profiles" TO "anon";

GRANT SELECT ("created_at") ON TABLE public."profiles" TO "anon";

GRANT UPDATE ("created_at") ON TABLE public."profiles" TO "anon";

GRANT INSERT ("display_name") ON TABLE public."profiles" TO "anon";

GRANT REFERENCES ("display_name") ON TABLE public."profiles" TO "anon";

GRANT SELECT ("display_name") ON TABLE public."profiles" TO "anon";

GRANT UPDATE ("display_name") ON TABLE public."profiles" TO "anon";

GRANT INSERT ("id") ON TABLE public."profiles" TO "anon";

GRANT REFERENCES ("id") ON TABLE public."profiles" TO "anon";

GRANT SELECT ("id") ON TABLE public."profiles" TO "anon";

GRANT UPDATE ("id") ON TABLE public."profiles" TO "anon";

GRANT INSERT ("provider") ON TABLE public."profiles" TO "anon";

GRANT REFERENCES ("provider") ON TABLE public."profiles" TO "anon";

GRANT SELECT ("provider") ON TABLE public."profiles" TO "anon";

GRANT UPDATE ("provider") ON TABLE public."profiles" TO "anon";

GRANT INSERT ("updated_at") ON TABLE public."profiles" TO "anon";

GRANT REFERENCES ("updated_at") ON TABLE public."profiles" TO "anon";

GRANT SELECT ("updated_at") ON TABLE public."profiles" TO "anon";

GRANT UPDATE ("updated_at") ON TABLE public."profiles" TO "anon";

GRANT INSERT ("username") ON TABLE public."profiles" TO "anon";

GRANT REFERENCES ("username") ON TABLE public."profiles" TO "anon";

GRANT SELECT ("username") ON TABLE public."profiles" TO "anon";

GRANT UPDATE ("username") ON TABLE public."profiles" TO "anon";

GRANT REFERENCES ("active") ON TABLE public."tags" TO "anon";

GRANT SELECT ("active") ON TABLE public."tags" TO "anon";

GRANT REFERENCES ("created_at") ON TABLE public."tags" TO "anon";

GRANT SELECT ("created_at") ON TABLE public."tags" TO "anon";

GRANT REFERENCES ("created_by") ON TABLE public."tags" TO "anon";

GRANT SELECT ("created_by") ON TABLE public."tags" TO "anon";

GRANT REFERENCES ("id") ON TABLE public."tags" TO "anon";

GRANT SELECT ("id") ON TABLE public."tags" TO "anon";

GRANT REFERENCES ("name") ON TABLE public."tags" TO "anon";

GRANT SELECT ("name") ON TABLE public."tags" TO "anon";

GRANT REFERENCES ("slug") ON TABLE public."tags" TO "anon";

GRANT SELECT ("slug") ON TABLE public."tags" TO "anon";

GRANT REFERENCES ("sort_order") ON TABLE public."tags" TO "anon";

GRANT SELECT ("sort_order") ON TABLE public."tags" TO "anon";

GRANT REFERENCES ("updated_at") ON TABLE public."tags" TO "anon";

GRANT SELECT ("updated_at") ON TABLE public."tags" TO "anon";

GRANT REFERENCES ("account_status") ON TABLE public."user_roles" TO "anon";

GRANT SELECT ("account_status") ON TABLE public."user_roles" TO "anon";

GRANT REFERENCES ("created_at") ON TABLE public."user_roles" TO "anon";

GRANT SELECT ("created_at") ON TABLE public."user_roles" TO "anon";

GRANT REFERENCES ("role") ON TABLE public."user_roles" TO "anon";

GRANT SELECT ("role") ON TABLE public."user_roles" TO "anon";

GRANT REFERENCES ("updated_at") ON TABLE public."user_roles" TO "anon";

GRANT SELECT ("updated_at") ON TABLE public."user_roles" TO "anon";

GRANT REFERENCES ("user_id") ON TABLE public."user_roles" TO "anon";

GRANT SELECT ("user_id") ON TABLE public."user_roles" TO "anon";

GRANT REFERENCES ("accent_style") ON TABLE public."blog_posts" TO "authenticated";

GRANT SELECT ("accent_style") ON TABLE public."blog_posts" TO "authenticated";

GRANT REFERENCES ("author_id") ON TABLE public."blog_posts" TO "authenticated";

GRANT SELECT ("author_id") ON TABLE public."blog_posts" TO "authenticated";

GRANT REFERENCES ("body") ON TABLE public."blog_posts" TO "authenticated";

GRANT SELECT ("body") ON TABLE public."blog_posts" TO "authenticated";

GRANT REFERENCES ("created_at") ON TABLE public."blog_posts" TO "authenticated";

GRANT SELECT ("created_at") ON TABLE public."blog_posts" TO "authenticated";

GRANT REFERENCES ("excerpt") ON TABLE public."blog_posts" TO "authenticated";

GRANT SELECT ("excerpt") ON TABLE public."blog_posts" TO "authenticated";

GRANT REFERENCES ("hero_image_url") ON TABLE public."blog_posts" TO "authenticated";

GRANT SELECT ("hero_image_url") ON TABLE public."blog_posts" TO "authenticated";

GRANT REFERENCES ("id") ON TABLE public."blog_posts" TO "authenticated";

GRANT SELECT ("id") ON TABLE public."blog_posts" TO "authenticated";

GRANT REFERENCES ("is_highlighted") ON TABLE public."blog_posts" TO "authenticated";

GRANT SELECT ("is_highlighted") ON TABLE public."blog_posts" TO "authenticated";

GRANT REFERENCES ("published_at") ON TABLE public."blog_posts" TO "authenticated";

GRANT SELECT ("published_at") ON TABLE public."blog_posts" TO "authenticated";

GRANT REFERENCES ("published") ON TABLE public."blog_posts" TO "authenticated";

GRANT SELECT ("published") ON TABLE public."blog_posts" TO "authenticated";

GRANT REFERENCES ("slug") ON TABLE public."blog_posts" TO "authenticated";

GRANT SELECT ("slug") ON TABLE public."blog_posts" TO "authenticated";

GRANT REFERENCES ("title") ON TABLE public."blog_posts" TO "authenticated";

GRANT SELECT ("title") ON TABLE public."blog_posts" TO "authenticated";

GRANT REFERENCES ("updated_at") ON TABLE public."blog_posts" TO "authenticated";

GRANT SELECT ("updated_at") ON TABLE public."blog_posts" TO "authenticated";

GRANT REFERENCES ("active") ON TABLE public."forum_categories" TO "authenticated";

GRANT SELECT ("active") ON TABLE public."forum_categories" TO "authenticated";

GRANT REFERENCES ("created_at") ON TABLE public."forum_categories" TO "authenticated";

GRANT SELECT ("created_at") ON TABLE public."forum_categories" TO "authenticated";

GRANT REFERENCES ("description") ON TABLE public."forum_categories" TO "authenticated";

GRANT SELECT ("description") ON TABLE public."forum_categories" TO "authenticated";

GRANT REFERENCES ("id") ON TABLE public."forum_categories" TO "authenticated";

GRANT SELECT ("id") ON TABLE public."forum_categories" TO "authenticated";

GRANT REFERENCES ("name") ON TABLE public."forum_categories" TO "authenticated";

GRANT SELECT ("name") ON TABLE public."forum_categories" TO "authenticated";

GRANT REFERENCES ("slug") ON TABLE public."forum_categories" TO "authenticated";

GRANT SELECT ("slug") ON TABLE public."forum_categories" TO "authenticated";

GRANT REFERENCES ("sort_order") ON TABLE public."forum_categories" TO "authenticated";

GRANT SELECT ("sort_order") ON TABLE public."forum_categories" TO "authenticated";

GRANT REFERENCES ("updated_at") ON TABLE public."forum_categories" TO "authenticated";

GRANT SELECT ("updated_at") ON TABLE public."forum_categories" TO "authenticated";

GRANT REFERENCES ("body") ON TABLE public."forum_replies" TO "authenticated";

GRANT SELECT ("body") ON TABLE public."forum_replies" TO "authenticated";

GRANT REFERENCES ("created_at") ON TABLE public."forum_replies" TO "authenticated";

GRANT SELECT ("created_at") ON TABLE public."forum_replies" TO "authenticated";

GRANT REFERENCES ("gif_id") ON TABLE public."forum_replies" TO "authenticated";

GRANT SELECT ("gif_id") ON TABLE public."forum_replies" TO "authenticated";

GRANT REFERENCES ("gif_preview_url") ON TABLE public."forum_replies" TO "authenticated";

GRANT SELECT ("gif_preview_url") ON TABLE public."forum_replies" TO "authenticated";

GRANT REFERENCES ("gif_url") ON TABLE public."forum_replies" TO "authenticated";

GRANT SELECT ("gif_url") ON TABLE public."forum_replies" TO "authenticated";

GRANT REFERENCES ("id") ON TABLE public."forum_replies" TO "authenticated";

GRANT SELECT ("id") ON TABLE public."forum_replies" TO "authenticated";

GRANT REFERENCES ("thread_id") ON TABLE public."forum_replies" TO "authenticated";

GRANT SELECT ("thread_id") ON TABLE public."forum_replies" TO "authenticated";

GRANT REFERENCES ("updated_at") ON TABLE public."forum_replies" TO "authenticated";

GRANT SELECT ("updated_at") ON TABLE public."forum_replies" TO "authenticated";

GRANT REFERENCES ("user_id") ON TABLE public."forum_replies" TO "authenticated";

GRANT SELECT ("user_id") ON TABLE public."forum_replies" TO "authenticated";

GRANT REFERENCES ("body") ON TABLE public."forum_threads" TO "authenticated";

GRANT SELECT ("body") ON TABLE public."forum_threads" TO "authenticated";

GRANT REFERENCES ("category_id") ON TABLE public."forum_threads" TO "authenticated";

GRANT SELECT ("category_id") ON TABLE public."forum_threads" TO "authenticated";

GRANT REFERENCES ("created_at") ON TABLE public."forum_threads" TO "authenticated";

GRANT SELECT ("created_at") ON TABLE public."forum_threads" TO "authenticated";

GRANT REFERENCES ("id") ON TABLE public."forum_threads" TO "authenticated";

GRANT SELECT ("id") ON TABLE public."forum_threads" TO "authenticated";

GRANT REFERENCES ("is_locked") ON TABLE public."forum_threads" TO "authenticated";

GRANT SELECT ("is_locked") ON TABLE public."forum_threads" TO "authenticated";

GRANT REFERENCES ("is_pinned") ON TABLE public."forum_threads" TO "authenticated";

GRANT SELECT ("is_pinned") ON TABLE public."forum_threads" TO "authenticated";

GRANT REFERENCES ("last_activity_at") ON TABLE public."forum_threads" TO "authenticated";

GRANT SELECT ("last_activity_at") ON TABLE public."forum_threads" TO "authenticated";

GRANT REFERENCES ("reply_count") ON TABLE public."forum_threads" TO "authenticated";

GRANT SELECT ("reply_count") ON TABLE public."forum_threads" TO "authenticated";

GRANT REFERENCES ("title") ON TABLE public."forum_threads" TO "authenticated";

GRANT SELECT ("title") ON TABLE public."forum_threads" TO "authenticated";

GRANT REFERENCES ("updated_at") ON TABLE public."forum_threads" TO "authenticated";

GRANT SELECT ("updated_at") ON TABLE public."forum_threads" TO "authenticated";

GRANT REFERENCES ("user_id") ON TABLE public."forum_threads" TO "authenticated";

GRANT SELECT ("user_id") ON TABLE public."forum_threads" TO "authenticated";

GRANT REFERENCES ("view_count") ON TABLE public."forum_threads" TO "authenticated";

GRANT SELECT ("view_count") ON TABLE public."forum_threads" TO "authenticated";

GRANT REFERENCES ("active") ON TABLE public."post_categories" TO "authenticated";

GRANT SELECT ("active") ON TABLE public."post_categories" TO "authenticated";

GRANT REFERENCES ("created_at") ON TABLE public."post_categories" TO "authenticated";

GRANT SELECT ("created_at") ON TABLE public."post_categories" TO "authenticated";

GRANT REFERENCES ("created_by") ON TABLE public."post_categories" TO "authenticated";

GRANT SELECT ("created_by") ON TABLE public."post_categories" TO "authenticated";

GRANT REFERENCES ("id") ON TABLE public."post_categories" TO "authenticated";

GRANT SELECT ("id") ON TABLE public."post_categories" TO "authenticated";

GRANT REFERENCES ("name") ON TABLE public."post_categories" TO "authenticated";

GRANT SELECT ("name") ON TABLE public."post_categories" TO "authenticated";

GRANT REFERENCES ("slug") ON TABLE public."post_categories" TO "authenticated";

GRANT SELECT ("slug") ON TABLE public."post_categories" TO "authenticated";

GRANT REFERENCES ("sort_order") ON TABLE public."post_categories" TO "authenticated";

GRANT SELECT ("sort_order") ON TABLE public."post_categories" TO "authenticated";

GRANT REFERENCES ("updated_at") ON TABLE public."post_categories" TO "authenticated";

GRANT SELECT ("updated_at") ON TABLE public."post_categories" TO "authenticated";

GRANT INSERT ("body") ON TABLE public."post_comments" TO "authenticated";

GRANT REFERENCES ("body") ON TABLE public."post_comments" TO "authenticated";

GRANT SELECT ("body") ON TABLE public."post_comments" TO "authenticated";

GRANT UPDATE ("body") ON TABLE public."post_comments" TO "authenticated";

GRANT INSERT ("created_at") ON TABLE public."post_comments" TO "authenticated";

GRANT REFERENCES ("created_at") ON TABLE public."post_comments" TO "authenticated";

GRANT SELECT ("created_at") ON TABLE public."post_comments" TO "authenticated";

GRANT UPDATE ("created_at") ON TABLE public."post_comments" TO "authenticated";

GRANT INSERT ("gif_id") ON TABLE public."post_comments" TO "authenticated";

GRANT REFERENCES ("gif_id") ON TABLE public."post_comments" TO "authenticated";

GRANT SELECT ("gif_id") ON TABLE public."post_comments" TO "authenticated";

GRANT UPDATE ("gif_id") ON TABLE public."post_comments" TO "authenticated";

GRANT INSERT ("gif_preview_url") ON TABLE public."post_comments" TO "authenticated";

GRANT REFERENCES ("gif_preview_url") ON TABLE public."post_comments" TO "authenticated";

GRANT SELECT ("gif_preview_url") ON TABLE public."post_comments" TO "authenticated";

GRANT UPDATE ("gif_preview_url") ON TABLE public."post_comments" TO "authenticated";

GRANT INSERT ("gif_url") ON TABLE public."post_comments" TO "authenticated";

GRANT REFERENCES ("gif_url") ON TABLE public."post_comments" TO "authenticated";

GRANT SELECT ("gif_url") ON TABLE public."post_comments" TO "authenticated";

GRANT UPDATE ("gif_url") ON TABLE public."post_comments" TO "authenticated";

GRANT INSERT ("id") ON TABLE public."post_comments" TO "authenticated";

GRANT REFERENCES ("id") ON TABLE public."post_comments" TO "authenticated";

GRANT SELECT ("id") ON TABLE public."post_comments" TO "authenticated";

GRANT UPDATE ("id") ON TABLE public."post_comments" TO "authenticated";

GRANT INSERT ("post_id") ON TABLE public."post_comments" TO "authenticated";

GRANT REFERENCES ("post_id") ON TABLE public."post_comments" TO "authenticated";

GRANT SELECT ("post_id") ON TABLE public."post_comments" TO "authenticated";

GRANT UPDATE ("post_id") ON TABLE public."post_comments" TO "authenticated";

GRANT INSERT ("user_id") ON TABLE public."post_comments" TO "authenticated";

GRANT REFERENCES ("user_id") ON TABLE public."post_comments" TO "authenticated";

GRANT SELECT ("user_id") ON TABLE public."post_comments" TO "authenticated";

GRANT UPDATE ("user_id") ON TABLE public."post_comments" TO "authenticated";

GRANT INSERT ("created_at") ON TABLE public."post_likes" TO "authenticated";

GRANT REFERENCES ("created_at") ON TABLE public."post_likes" TO "authenticated";

GRANT SELECT ("created_at") ON TABLE public."post_likes" TO "authenticated";

GRANT UPDATE ("created_at") ON TABLE public."post_likes" TO "authenticated";

GRANT INSERT ("post_id") ON TABLE public."post_likes" TO "authenticated";

GRANT REFERENCES ("post_id") ON TABLE public."post_likes" TO "authenticated";

GRANT SELECT ("post_id") ON TABLE public."post_likes" TO "authenticated";

GRANT UPDATE ("post_id") ON TABLE public."post_likes" TO "authenticated";

GRANT INSERT ("user_id") ON TABLE public."post_likes" TO "authenticated";

GRANT REFERENCES ("user_id") ON TABLE public."post_likes" TO "authenticated";

GRANT SELECT ("user_id") ON TABLE public."post_likes" TO "authenticated";

GRANT UPDATE ("user_id") ON TABLE public."post_likes" TO "authenticated";

GRANT REFERENCES ("created_at") ON TABLE public."post_tags" TO "authenticated";

GRANT SELECT ("created_at") ON TABLE public."post_tags" TO "authenticated";

GRANT REFERENCES ("post_id") ON TABLE public."post_tags" TO "authenticated";

GRANT SELECT ("post_id") ON TABLE public."post_tags" TO "authenticated";

GRANT REFERENCES ("tag_id") ON TABLE public."post_tags" TO "authenticated";

GRANT SELECT ("tag_id") ON TABLE public."post_tags" TO "authenticated";

GRANT INSERT ("body") ON TABLE public."posts" TO "authenticated";

GRANT REFERENCES ("body") ON TABLE public."posts" TO "authenticated";

GRANT SELECT ("body") ON TABLE public."posts" TO "authenticated";

GRANT UPDATE ("body") ON TABLE public."posts" TO "authenticated";

GRANT INSERT ("category_id") ON TABLE public."posts" TO "authenticated";

GRANT REFERENCES ("category_id") ON TABLE public."posts" TO "authenticated";

GRANT SELECT ("category_id") ON TABLE public."posts" TO "authenticated";

GRANT UPDATE ("category_id") ON TABLE public."posts" TO "authenticated";

GRANT INSERT ("created_at") ON TABLE public."posts" TO "authenticated";

GRANT REFERENCES ("created_at") ON TABLE public."posts" TO "authenticated";

GRANT SELECT ("created_at") ON TABLE public."posts" TO "authenticated";

GRANT UPDATE ("created_at") ON TABLE public."posts" TO "authenticated";

GRANT INSERT ("display_size") ON TABLE public."posts" TO "authenticated";

GRANT REFERENCES ("display_size") ON TABLE public."posts" TO "authenticated";

GRANT SELECT ("display_size") ON TABLE public."posts" TO "authenticated";

GRANT UPDATE ("display_size") ON TABLE public."posts" TO "authenticated";

GRANT INSERT ("front_page_pinned_at") ON TABLE public."posts" TO "authenticated";

GRANT REFERENCES ("front_page_pinned_at") ON TABLE public."posts" TO "authenticated";

GRANT SELECT ("front_page_pinned_at") ON TABLE public."posts" TO "authenticated";

GRANT UPDATE ("front_page_pinned_at") ON TABLE public."posts" TO "authenticated";

GRANT INSERT ("front_page_pinned_by") ON TABLE public."posts" TO "authenticated";

GRANT REFERENCES ("front_page_pinned_by") ON TABLE public."posts" TO "authenticated";

GRANT SELECT ("front_page_pinned_by") ON TABLE public."posts" TO "authenticated";

GRANT UPDATE ("front_page_pinned_by") ON TABLE public."posts" TO "authenticated";

GRANT INSERT ("front_page_pinned") ON TABLE public."posts" TO "authenticated";

GRANT REFERENCES ("front_page_pinned") ON TABLE public."posts" TO "authenticated";

GRANT SELECT ("front_page_pinned") ON TABLE public."posts" TO "authenticated";

GRANT UPDATE ("front_page_pinned") ON TABLE public."posts" TO "authenticated";

GRANT INSERT ("front_page_visible") ON TABLE public."posts" TO "authenticated";

GRANT REFERENCES ("front_page_visible") ON TABLE public."posts" TO "authenticated";

GRANT SELECT ("front_page_visible") ON TABLE public."posts" TO "authenticated";

GRANT UPDATE ("front_page_visible") ON TABLE public."posts" TO "authenticated";

GRANT INSERT ("gif_id") ON TABLE public."posts" TO "authenticated";

GRANT REFERENCES ("gif_id") ON TABLE public."posts" TO "authenticated";

GRANT SELECT ("gif_id") ON TABLE public."posts" TO "authenticated";

GRANT UPDATE ("gif_id") ON TABLE public."posts" TO "authenticated";

GRANT INSERT ("gif_preview_url") ON TABLE public."posts" TO "authenticated";

GRANT REFERENCES ("gif_preview_url") ON TABLE public."posts" TO "authenticated";

GRANT SELECT ("gif_preview_url") ON TABLE public."posts" TO "authenticated";

GRANT UPDATE ("gif_preview_url") ON TABLE public."posts" TO "authenticated";

GRANT INSERT ("gif_url") ON TABLE public."posts" TO "authenticated";

GRANT REFERENCES ("gif_url") ON TABLE public."posts" TO "authenticated";

GRANT SELECT ("gif_url") ON TABLE public."posts" TO "authenticated";

GRANT UPDATE ("gif_url") ON TABLE public."posts" TO "authenticated";

GRANT INSERT ("id") ON TABLE public."posts" TO "authenticated";

GRANT REFERENCES ("id") ON TABLE public."posts" TO "authenticated";

GRANT SELECT ("id") ON TABLE public."posts" TO "authenticated";

GRANT UPDATE ("id") ON TABLE public."posts" TO "authenticated";

GRANT INSERT ("image_url") ON TABLE public."posts" TO "authenticated";

GRANT REFERENCES ("image_url") ON TABLE public."posts" TO "authenticated";

GRANT SELECT ("image_url") ON TABLE public."posts" TO "authenticated";

GRANT UPDATE ("image_url") ON TABLE public."posts" TO "authenticated";

GRANT INSERT ("moderated_at") ON TABLE public."posts" TO "authenticated";

GRANT REFERENCES ("moderated_at") ON TABLE public."posts" TO "authenticated";

GRANT SELECT ("moderated_at") ON TABLE public."posts" TO "authenticated";

GRANT UPDATE ("moderated_at") ON TABLE public."posts" TO "authenticated";

GRANT INSERT ("moderated_by") ON TABLE public."posts" TO "authenticated";

GRANT REFERENCES ("moderated_by") ON TABLE public."posts" TO "authenticated";

GRANT SELECT ("moderated_by") ON TABLE public."posts" TO "authenticated";

GRANT UPDATE ("moderated_by") ON TABLE public."posts" TO "authenticated";

GRANT INSERT ("moderation_note") ON TABLE public."posts" TO "authenticated";

GRANT REFERENCES ("moderation_note") ON TABLE public."posts" TO "authenticated";

GRANT SELECT ("moderation_note") ON TABLE public."posts" TO "authenticated";

GRANT UPDATE ("moderation_note") ON TABLE public."posts" TO "authenticated";

GRANT INSERT ("moderation_status") ON TABLE public."posts" TO "authenticated";

GRANT REFERENCES ("moderation_status") ON TABLE public."posts" TO "authenticated";

GRANT SELECT ("moderation_status") ON TABLE public."posts" TO "authenticated";

GRANT UPDATE ("moderation_status") ON TABLE public."posts" TO "authenticated";

GRANT INSERT ("post_type") ON TABLE public."posts" TO "authenticated";

GRANT REFERENCES ("post_type") ON TABLE public."posts" TO "authenticated";

GRANT SELECT ("post_type") ON TABLE public."posts" TO "authenticated";

GRANT UPDATE ("post_type") ON TABLE public."posts" TO "authenticated";

GRANT INSERT ("published") ON TABLE public."posts" TO "authenticated";

GRANT REFERENCES ("published") ON TABLE public."posts" TO "authenticated";

GRANT SELECT ("published") ON TABLE public."posts" TO "authenticated";

GRANT UPDATE ("published") ON TABLE public."posts" TO "authenticated";

GRANT INSERT ("submitted_at") ON TABLE public."posts" TO "authenticated";

GRANT REFERENCES ("submitted_at") ON TABLE public."posts" TO "authenticated";

GRANT SELECT ("submitted_at") ON TABLE public."posts" TO "authenticated";

GRANT UPDATE ("submitted_at") ON TABLE public."posts" TO "authenticated";

GRANT INSERT ("title") ON TABLE public."posts" TO "authenticated";

GRANT REFERENCES ("title") ON TABLE public."posts" TO "authenticated";

GRANT SELECT ("title") ON TABLE public."posts" TO "authenticated";

GRANT UPDATE ("title") ON TABLE public."posts" TO "authenticated";

GRANT INSERT ("updated_at") ON TABLE public."posts" TO "authenticated";

GRANT REFERENCES ("updated_at") ON TABLE public."posts" TO "authenticated";

GRANT SELECT ("updated_at") ON TABLE public."posts" TO "authenticated";

GRANT UPDATE ("updated_at") ON TABLE public."posts" TO "authenticated";

GRANT INSERT ("user_id") ON TABLE public."posts" TO "authenticated";

GRANT REFERENCES ("user_id") ON TABLE public."posts" TO "authenticated";

GRANT SELECT ("user_id") ON TABLE public."posts" TO "authenticated";

GRANT UPDATE ("user_id") ON TABLE public."posts" TO "authenticated";

GRANT INSERT ("video_type") ON TABLE public."posts" TO "authenticated";

GRANT REFERENCES ("video_type") ON TABLE public."posts" TO "authenticated";

GRANT SELECT ("video_type") ON TABLE public."posts" TO "authenticated";

GRANT UPDATE ("video_type") ON TABLE public."posts" TO "authenticated";

GRANT INSERT ("youtube_id") ON TABLE public."posts" TO "authenticated";

GRANT REFERENCES ("youtube_id") ON TABLE public."posts" TO "authenticated";

GRANT SELECT ("youtube_id") ON TABLE public."posts" TO "authenticated";

GRANT UPDATE ("youtube_id") ON TABLE public."posts" TO "authenticated";

GRANT INSERT ("youtube_url") ON TABLE public."posts" TO "authenticated";

GRANT REFERENCES ("youtube_url") ON TABLE public."posts" TO "authenticated";

GRANT SELECT ("youtube_url") ON TABLE public."posts" TO "authenticated";

GRANT UPDATE ("youtube_url") ON TABLE public."posts" TO "authenticated";

GRANT INSERT ("avatar_url") ON TABLE public."profiles" TO "authenticated";

GRANT REFERENCES ("avatar_url") ON TABLE public."profiles" TO "authenticated";

GRANT SELECT ("avatar_url") ON TABLE public."profiles" TO "authenticated";

GRANT UPDATE ("avatar_url") ON TABLE public."profiles" TO "authenticated";

GRANT INSERT ("created_at") ON TABLE public."profiles" TO "authenticated";

GRANT REFERENCES ("created_at") ON TABLE public."profiles" TO "authenticated";

GRANT SELECT ("created_at") ON TABLE public."profiles" TO "authenticated";

GRANT UPDATE ("created_at") ON TABLE public."profiles" TO "authenticated";

GRANT INSERT ("display_name") ON TABLE public."profiles" TO "authenticated";

GRANT REFERENCES ("display_name") ON TABLE public."profiles" TO "authenticated";

GRANT SELECT ("display_name") ON TABLE public."profiles" TO "authenticated";

GRANT UPDATE ("display_name") ON TABLE public."profiles" TO "authenticated";

GRANT INSERT ("id") ON TABLE public."profiles" TO "authenticated";

GRANT REFERENCES ("id") ON TABLE public."profiles" TO "authenticated";

GRANT SELECT ("id") ON TABLE public."profiles" TO "authenticated";

GRANT UPDATE ("id") ON TABLE public."profiles" TO "authenticated";

GRANT INSERT ("provider") ON TABLE public."profiles" TO "authenticated";

GRANT REFERENCES ("provider") ON TABLE public."profiles" TO "authenticated";

GRANT SELECT ("provider") ON TABLE public."profiles" TO "authenticated";

GRANT UPDATE ("provider") ON TABLE public."profiles" TO "authenticated";

GRANT INSERT ("updated_at") ON TABLE public."profiles" TO "authenticated";

GRANT REFERENCES ("updated_at") ON TABLE public."profiles" TO "authenticated";

GRANT SELECT ("updated_at") ON TABLE public."profiles" TO "authenticated";

GRANT UPDATE ("updated_at") ON TABLE public."profiles" TO "authenticated";

GRANT INSERT ("username") ON TABLE public."profiles" TO "authenticated";

GRANT REFERENCES ("username") ON TABLE public."profiles" TO "authenticated";

GRANT SELECT ("username") ON TABLE public."profiles" TO "authenticated";

GRANT UPDATE ("username") ON TABLE public."profiles" TO "authenticated";

GRANT REFERENCES ("active") ON TABLE public."tags" TO "authenticated";

GRANT SELECT ("active") ON TABLE public."tags" TO "authenticated";

GRANT REFERENCES ("created_at") ON TABLE public."tags" TO "authenticated";

GRANT SELECT ("created_at") ON TABLE public."tags" TO "authenticated";

GRANT REFERENCES ("created_by") ON TABLE public."tags" TO "authenticated";

GRANT SELECT ("created_by") ON TABLE public."tags" TO "authenticated";

GRANT REFERENCES ("id") ON TABLE public."tags" TO "authenticated";

GRANT SELECT ("id") ON TABLE public."tags" TO "authenticated";

GRANT REFERENCES ("name") ON TABLE public."tags" TO "authenticated";

GRANT SELECT ("name") ON TABLE public."tags" TO "authenticated";

GRANT REFERENCES ("slug") ON TABLE public."tags" TO "authenticated";

GRANT SELECT ("slug") ON TABLE public."tags" TO "authenticated";

GRANT REFERENCES ("sort_order") ON TABLE public."tags" TO "authenticated";

GRANT SELECT ("sort_order") ON TABLE public."tags" TO "authenticated";

GRANT REFERENCES ("updated_at") ON TABLE public."tags" TO "authenticated";

GRANT SELECT ("updated_at") ON TABLE public."tags" TO "authenticated";

GRANT REFERENCES ("account_status") ON TABLE public."user_roles" TO "authenticated";

GRANT SELECT ("account_status") ON TABLE public."user_roles" TO "authenticated";

GRANT REFERENCES ("created_at") ON TABLE public."user_roles" TO "authenticated";

GRANT SELECT ("created_at") ON TABLE public."user_roles" TO "authenticated";

GRANT REFERENCES ("role") ON TABLE public."user_roles" TO "authenticated";

GRANT SELECT ("role") ON TABLE public."user_roles" TO "authenticated";

GRANT REFERENCES ("updated_at") ON TABLE public."user_roles" TO "authenticated";

GRANT SELECT ("updated_at") ON TABLE public."user_roles" TO "authenticated";

GRANT REFERENCES ("user_id") ON TABLE public."user_roles" TO "authenticated";

GRANT SELECT ("user_id") ON TABLE public."user_roles" TO "authenticated";

GRANT INSERT ("accent_style") ON TABLE public."blog_posts" TO "service_role";

GRANT REFERENCES ("accent_style") ON TABLE public."blog_posts" TO "service_role";

GRANT SELECT ("accent_style") ON TABLE public."blog_posts" TO "service_role";

GRANT UPDATE ("accent_style") ON TABLE public."blog_posts" TO "service_role";

GRANT INSERT ("author_id") ON TABLE public."blog_posts" TO "service_role";

GRANT REFERENCES ("author_id") ON TABLE public."blog_posts" TO "service_role";

GRANT SELECT ("author_id") ON TABLE public."blog_posts" TO "service_role";

GRANT UPDATE ("author_id") ON TABLE public."blog_posts" TO "service_role";

GRANT INSERT ("body") ON TABLE public."blog_posts" TO "service_role";

GRANT REFERENCES ("body") ON TABLE public."blog_posts" TO "service_role";

GRANT SELECT ("body") ON TABLE public."blog_posts" TO "service_role";

GRANT UPDATE ("body") ON TABLE public."blog_posts" TO "service_role";

GRANT INSERT ("created_at") ON TABLE public."blog_posts" TO "service_role";

GRANT REFERENCES ("created_at") ON TABLE public."blog_posts" TO "service_role";

GRANT SELECT ("created_at") ON TABLE public."blog_posts" TO "service_role";

GRANT UPDATE ("created_at") ON TABLE public."blog_posts" TO "service_role";

GRANT INSERT ("excerpt") ON TABLE public."blog_posts" TO "service_role";

GRANT REFERENCES ("excerpt") ON TABLE public."blog_posts" TO "service_role";

GRANT SELECT ("excerpt") ON TABLE public."blog_posts" TO "service_role";

GRANT UPDATE ("excerpt") ON TABLE public."blog_posts" TO "service_role";

GRANT INSERT ("hero_image_url") ON TABLE public."blog_posts" TO "service_role";

GRANT REFERENCES ("hero_image_url") ON TABLE public."blog_posts" TO "service_role";

GRANT SELECT ("hero_image_url") ON TABLE public."blog_posts" TO "service_role";

GRANT UPDATE ("hero_image_url") ON TABLE public."blog_posts" TO "service_role";

GRANT INSERT ("id") ON TABLE public."blog_posts" TO "service_role";

GRANT REFERENCES ("id") ON TABLE public."blog_posts" TO "service_role";

GRANT SELECT ("id") ON TABLE public."blog_posts" TO "service_role";

GRANT UPDATE ("id") ON TABLE public."blog_posts" TO "service_role";

GRANT INSERT ("is_highlighted") ON TABLE public."blog_posts" TO "service_role";

GRANT REFERENCES ("is_highlighted") ON TABLE public."blog_posts" TO "service_role";

GRANT SELECT ("is_highlighted") ON TABLE public."blog_posts" TO "service_role";

GRANT UPDATE ("is_highlighted") ON TABLE public."blog_posts" TO "service_role";

GRANT INSERT ("published_at") ON TABLE public."blog_posts" TO "service_role";

GRANT REFERENCES ("published_at") ON TABLE public."blog_posts" TO "service_role";

GRANT SELECT ("published_at") ON TABLE public."blog_posts" TO "service_role";

GRANT UPDATE ("published_at") ON TABLE public."blog_posts" TO "service_role";

GRANT INSERT ("published") ON TABLE public."blog_posts" TO "service_role";

GRANT REFERENCES ("published") ON TABLE public."blog_posts" TO "service_role";

GRANT SELECT ("published") ON TABLE public."blog_posts" TO "service_role";

GRANT UPDATE ("published") ON TABLE public."blog_posts" TO "service_role";

GRANT INSERT ("slug") ON TABLE public."blog_posts" TO "service_role";

GRANT REFERENCES ("slug") ON TABLE public."blog_posts" TO "service_role";

GRANT SELECT ("slug") ON TABLE public."blog_posts" TO "service_role";

GRANT UPDATE ("slug") ON TABLE public."blog_posts" TO "service_role";

GRANT INSERT ("title") ON TABLE public."blog_posts" TO "service_role";

GRANT REFERENCES ("title") ON TABLE public."blog_posts" TO "service_role";

GRANT SELECT ("title") ON TABLE public."blog_posts" TO "service_role";

GRANT UPDATE ("title") ON TABLE public."blog_posts" TO "service_role";

GRANT INSERT ("updated_at") ON TABLE public."blog_posts" TO "service_role";

GRANT REFERENCES ("updated_at") ON TABLE public."blog_posts" TO "service_role";

GRANT SELECT ("updated_at") ON TABLE public."blog_posts" TO "service_role";

GRANT UPDATE ("updated_at") ON TABLE public."blog_posts" TO "service_role";

GRANT INSERT ("active") ON TABLE public."forum_categories" TO "service_role";

GRANT REFERENCES ("active") ON TABLE public."forum_categories" TO "service_role";

GRANT SELECT ("active") ON TABLE public."forum_categories" TO "service_role";

GRANT UPDATE ("active") ON TABLE public."forum_categories" TO "service_role";

GRANT INSERT ("created_at") ON TABLE public."forum_categories" TO "service_role";

GRANT REFERENCES ("created_at") ON TABLE public."forum_categories" TO "service_role";

GRANT SELECT ("created_at") ON TABLE public."forum_categories" TO "service_role";

GRANT UPDATE ("created_at") ON TABLE public."forum_categories" TO "service_role";

GRANT INSERT ("description") ON TABLE public."forum_categories" TO "service_role";

GRANT REFERENCES ("description") ON TABLE public."forum_categories" TO "service_role";

GRANT SELECT ("description") ON TABLE public."forum_categories" TO "service_role";

GRANT UPDATE ("description") ON TABLE public."forum_categories" TO "service_role";

GRANT INSERT ("id") ON TABLE public."forum_categories" TO "service_role";

GRANT REFERENCES ("id") ON TABLE public."forum_categories" TO "service_role";

GRANT SELECT ("id") ON TABLE public."forum_categories" TO "service_role";

GRANT UPDATE ("id") ON TABLE public."forum_categories" TO "service_role";

GRANT INSERT ("name") ON TABLE public."forum_categories" TO "service_role";

GRANT REFERENCES ("name") ON TABLE public."forum_categories" TO "service_role";

GRANT SELECT ("name") ON TABLE public."forum_categories" TO "service_role";

GRANT UPDATE ("name") ON TABLE public."forum_categories" TO "service_role";

GRANT INSERT ("slug") ON TABLE public."forum_categories" TO "service_role";

GRANT REFERENCES ("slug") ON TABLE public."forum_categories" TO "service_role";

GRANT SELECT ("slug") ON TABLE public."forum_categories" TO "service_role";

GRANT UPDATE ("slug") ON TABLE public."forum_categories" TO "service_role";

GRANT INSERT ("sort_order") ON TABLE public."forum_categories" TO "service_role";

GRANT REFERENCES ("sort_order") ON TABLE public."forum_categories" TO "service_role";

GRANT SELECT ("sort_order") ON TABLE public."forum_categories" TO "service_role";

GRANT UPDATE ("sort_order") ON TABLE public."forum_categories" TO "service_role";

GRANT INSERT ("updated_at") ON TABLE public."forum_categories" TO "service_role";

GRANT REFERENCES ("updated_at") ON TABLE public."forum_categories" TO "service_role";

GRANT SELECT ("updated_at") ON TABLE public."forum_categories" TO "service_role";

GRANT UPDATE ("updated_at") ON TABLE public."forum_categories" TO "service_role";

GRANT INSERT ("body") ON TABLE public."forum_replies" TO "service_role";

GRANT REFERENCES ("body") ON TABLE public."forum_replies" TO "service_role";

GRANT SELECT ("body") ON TABLE public."forum_replies" TO "service_role";

GRANT UPDATE ("body") ON TABLE public."forum_replies" TO "service_role";

GRANT INSERT ("created_at") ON TABLE public."forum_replies" TO "service_role";

GRANT REFERENCES ("created_at") ON TABLE public."forum_replies" TO "service_role";

GRANT SELECT ("created_at") ON TABLE public."forum_replies" TO "service_role";

GRANT UPDATE ("created_at") ON TABLE public."forum_replies" TO "service_role";

GRANT INSERT ("gif_id") ON TABLE public."forum_replies" TO "service_role";

GRANT REFERENCES ("gif_id") ON TABLE public."forum_replies" TO "service_role";

GRANT SELECT ("gif_id") ON TABLE public."forum_replies" TO "service_role";

GRANT UPDATE ("gif_id") ON TABLE public."forum_replies" TO "service_role";

GRANT INSERT ("gif_preview_url") ON TABLE public."forum_replies" TO "service_role";

GRANT REFERENCES ("gif_preview_url") ON TABLE public."forum_replies" TO "service_role";

GRANT SELECT ("gif_preview_url") ON TABLE public."forum_replies" TO "service_role";

GRANT UPDATE ("gif_preview_url") ON TABLE public."forum_replies" TO "service_role";

GRANT INSERT ("gif_url") ON TABLE public."forum_replies" TO "service_role";

GRANT REFERENCES ("gif_url") ON TABLE public."forum_replies" TO "service_role";

GRANT SELECT ("gif_url") ON TABLE public."forum_replies" TO "service_role";

GRANT UPDATE ("gif_url") ON TABLE public."forum_replies" TO "service_role";

GRANT INSERT ("id") ON TABLE public."forum_replies" TO "service_role";

GRANT REFERENCES ("id") ON TABLE public."forum_replies" TO "service_role";

GRANT SELECT ("id") ON TABLE public."forum_replies" TO "service_role";

GRANT UPDATE ("id") ON TABLE public."forum_replies" TO "service_role";

GRANT INSERT ("thread_id") ON TABLE public."forum_replies" TO "service_role";

GRANT REFERENCES ("thread_id") ON TABLE public."forum_replies" TO "service_role";

GRANT SELECT ("thread_id") ON TABLE public."forum_replies" TO "service_role";

GRANT UPDATE ("thread_id") ON TABLE public."forum_replies" TO "service_role";

GRANT INSERT ("updated_at") ON TABLE public."forum_replies" TO "service_role";

GRANT REFERENCES ("updated_at") ON TABLE public."forum_replies" TO "service_role";

GRANT SELECT ("updated_at") ON TABLE public."forum_replies" TO "service_role";

GRANT UPDATE ("updated_at") ON TABLE public."forum_replies" TO "service_role";

GRANT INSERT ("user_id") ON TABLE public."forum_replies" TO "service_role";

GRANT REFERENCES ("user_id") ON TABLE public."forum_replies" TO "service_role";

GRANT SELECT ("user_id") ON TABLE public."forum_replies" TO "service_role";

GRANT UPDATE ("user_id") ON TABLE public."forum_replies" TO "service_role";

GRANT INSERT ("body") ON TABLE public."forum_threads" TO "service_role";

GRANT REFERENCES ("body") ON TABLE public."forum_threads" TO "service_role";

GRANT SELECT ("body") ON TABLE public."forum_threads" TO "service_role";

GRANT UPDATE ("body") ON TABLE public."forum_threads" TO "service_role";

GRANT INSERT ("category_id") ON TABLE public."forum_threads" TO "service_role";

GRANT REFERENCES ("category_id") ON TABLE public."forum_threads" TO "service_role";

GRANT SELECT ("category_id") ON TABLE public."forum_threads" TO "service_role";

GRANT UPDATE ("category_id") ON TABLE public."forum_threads" TO "service_role";

GRANT INSERT ("created_at") ON TABLE public."forum_threads" TO "service_role";

GRANT REFERENCES ("created_at") ON TABLE public."forum_threads" TO "service_role";

GRANT SELECT ("created_at") ON TABLE public."forum_threads" TO "service_role";

GRANT UPDATE ("created_at") ON TABLE public."forum_threads" TO "service_role";

GRANT INSERT ("id") ON TABLE public."forum_threads" TO "service_role";

GRANT REFERENCES ("id") ON TABLE public."forum_threads" TO "service_role";

GRANT SELECT ("id") ON TABLE public."forum_threads" TO "service_role";

GRANT UPDATE ("id") ON TABLE public."forum_threads" TO "service_role";

GRANT INSERT ("is_locked") ON TABLE public."forum_threads" TO "service_role";

GRANT REFERENCES ("is_locked") ON TABLE public."forum_threads" TO "service_role";

GRANT SELECT ("is_locked") ON TABLE public."forum_threads" TO "service_role";

GRANT UPDATE ("is_locked") ON TABLE public."forum_threads" TO "service_role";

GRANT INSERT ("is_pinned") ON TABLE public."forum_threads" TO "service_role";

GRANT REFERENCES ("is_pinned") ON TABLE public."forum_threads" TO "service_role";

GRANT SELECT ("is_pinned") ON TABLE public."forum_threads" TO "service_role";

GRANT UPDATE ("is_pinned") ON TABLE public."forum_threads" TO "service_role";

GRANT INSERT ("last_activity_at") ON TABLE public."forum_threads" TO "service_role";

GRANT REFERENCES ("last_activity_at") ON TABLE public."forum_threads" TO "service_role";

GRANT SELECT ("last_activity_at") ON TABLE public."forum_threads" TO "service_role";

GRANT UPDATE ("last_activity_at") ON TABLE public."forum_threads" TO "service_role";

GRANT INSERT ("reply_count") ON TABLE public."forum_threads" TO "service_role";

GRANT REFERENCES ("reply_count") ON TABLE public."forum_threads" TO "service_role";

GRANT SELECT ("reply_count") ON TABLE public."forum_threads" TO "service_role";

GRANT UPDATE ("reply_count") ON TABLE public."forum_threads" TO "service_role";

GRANT INSERT ("title") ON TABLE public."forum_threads" TO "service_role";

GRANT REFERENCES ("title") ON TABLE public."forum_threads" TO "service_role";

GRANT SELECT ("title") ON TABLE public."forum_threads" TO "service_role";

GRANT UPDATE ("title") ON TABLE public."forum_threads" TO "service_role";

GRANT INSERT ("updated_at") ON TABLE public."forum_threads" TO "service_role";

GRANT REFERENCES ("updated_at") ON TABLE public."forum_threads" TO "service_role";

GRANT SELECT ("updated_at") ON TABLE public."forum_threads" TO "service_role";

GRANT UPDATE ("updated_at") ON TABLE public."forum_threads" TO "service_role";

GRANT INSERT ("user_id") ON TABLE public."forum_threads" TO "service_role";

GRANT REFERENCES ("user_id") ON TABLE public."forum_threads" TO "service_role";

GRANT SELECT ("user_id") ON TABLE public."forum_threads" TO "service_role";

GRANT UPDATE ("user_id") ON TABLE public."forum_threads" TO "service_role";

GRANT INSERT ("view_count") ON TABLE public."forum_threads" TO "service_role";

GRANT REFERENCES ("view_count") ON TABLE public."forum_threads" TO "service_role";

GRANT SELECT ("view_count") ON TABLE public."forum_threads" TO "service_role";

GRANT UPDATE ("view_count") ON TABLE public."forum_threads" TO "service_role";

GRANT INSERT ("active") ON TABLE public."post_categories" TO "service_role";

GRANT REFERENCES ("active") ON TABLE public."post_categories" TO "service_role";

GRANT SELECT ("active") ON TABLE public."post_categories" TO "service_role";

GRANT UPDATE ("active") ON TABLE public."post_categories" TO "service_role";

GRANT INSERT ("created_at") ON TABLE public."post_categories" TO "service_role";

GRANT REFERENCES ("created_at") ON TABLE public."post_categories" TO "service_role";

GRANT SELECT ("created_at") ON TABLE public."post_categories" TO "service_role";

GRANT UPDATE ("created_at") ON TABLE public."post_categories" TO "service_role";

GRANT INSERT ("created_by") ON TABLE public."post_categories" TO "service_role";

GRANT REFERENCES ("created_by") ON TABLE public."post_categories" TO "service_role";

GRANT SELECT ("created_by") ON TABLE public."post_categories" TO "service_role";

GRANT UPDATE ("created_by") ON TABLE public."post_categories" TO "service_role";

GRANT INSERT ("id") ON TABLE public."post_categories" TO "service_role";

GRANT REFERENCES ("id") ON TABLE public."post_categories" TO "service_role";

GRANT SELECT ("id") ON TABLE public."post_categories" TO "service_role";

GRANT UPDATE ("id") ON TABLE public."post_categories" TO "service_role";

GRANT INSERT ("name") ON TABLE public."post_categories" TO "service_role";

GRANT REFERENCES ("name") ON TABLE public."post_categories" TO "service_role";

GRANT SELECT ("name") ON TABLE public."post_categories" TO "service_role";

GRANT UPDATE ("name") ON TABLE public."post_categories" TO "service_role";

GRANT INSERT ("slug") ON TABLE public."post_categories" TO "service_role";

GRANT REFERENCES ("slug") ON TABLE public."post_categories" TO "service_role";

GRANT SELECT ("slug") ON TABLE public."post_categories" TO "service_role";

GRANT UPDATE ("slug") ON TABLE public."post_categories" TO "service_role";

GRANT INSERT ("sort_order") ON TABLE public."post_categories" TO "service_role";

GRANT REFERENCES ("sort_order") ON TABLE public."post_categories" TO "service_role";

GRANT SELECT ("sort_order") ON TABLE public."post_categories" TO "service_role";

GRANT UPDATE ("sort_order") ON TABLE public."post_categories" TO "service_role";

GRANT INSERT ("updated_at") ON TABLE public."post_categories" TO "service_role";

GRANT REFERENCES ("updated_at") ON TABLE public."post_categories" TO "service_role";

GRANT SELECT ("updated_at") ON TABLE public."post_categories" TO "service_role";

GRANT UPDATE ("updated_at") ON TABLE public."post_categories" TO "service_role";

GRANT INSERT ("body") ON TABLE public."post_comments" TO "service_role";

GRANT REFERENCES ("body") ON TABLE public."post_comments" TO "service_role";

GRANT SELECT ("body") ON TABLE public."post_comments" TO "service_role";

GRANT UPDATE ("body") ON TABLE public."post_comments" TO "service_role";

GRANT INSERT ("created_at") ON TABLE public."post_comments" TO "service_role";

GRANT REFERENCES ("created_at") ON TABLE public."post_comments" TO "service_role";

GRANT SELECT ("created_at") ON TABLE public."post_comments" TO "service_role";

GRANT UPDATE ("created_at") ON TABLE public."post_comments" TO "service_role";

GRANT INSERT ("gif_id") ON TABLE public."post_comments" TO "service_role";

GRANT REFERENCES ("gif_id") ON TABLE public."post_comments" TO "service_role";

GRANT SELECT ("gif_id") ON TABLE public."post_comments" TO "service_role";

GRANT UPDATE ("gif_id") ON TABLE public."post_comments" TO "service_role";

GRANT INSERT ("gif_preview_url") ON TABLE public."post_comments" TO "service_role";

GRANT REFERENCES ("gif_preview_url") ON TABLE public."post_comments" TO "service_role";

GRANT SELECT ("gif_preview_url") ON TABLE public."post_comments" TO "service_role";

GRANT UPDATE ("gif_preview_url") ON TABLE public."post_comments" TO "service_role";

GRANT INSERT ("gif_url") ON TABLE public."post_comments" TO "service_role";

GRANT REFERENCES ("gif_url") ON TABLE public."post_comments" TO "service_role";

GRANT SELECT ("gif_url") ON TABLE public."post_comments" TO "service_role";

GRANT UPDATE ("gif_url") ON TABLE public."post_comments" TO "service_role";

GRANT INSERT ("id") ON TABLE public."post_comments" TO "service_role";

GRANT REFERENCES ("id") ON TABLE public."post_comments" TO "service_role";

GRANT SELECT ("id") ON TABLE public."post_comments" TO "service_role";

GRANT UPDATE ("id") ON TABLE public."post_comments" TO "service_role";

GRANT INSERT ("post_id") ON TABLE public."post_comments" TO "service_role";

GRANT REFERENCES ("post_id") ON TABLE public."post_comments" TO "service_role";

GRANT SELECT ("post_id") ON TABLE public."post_comments" TO "service_role";

GRANT UPDATE ("post_id") ON TABLE public."post_comments" TO "service_role";

GRANT INSERT ("user_id") ON TABLE public."post_comments" TO "service_role";

GRANT REFERENCES ("user_id") ON TABLE public."post_comments" TO "service_role";

GRANT SELECT ("user_id") ON TABLE public."post_comments" TO "service_role";

GRANT UPDATE ("user_id") ON TABLE public."post_comments" TO "service_role";

GRANT INSERT ("created_at") ON TABLE public."post_likes" TO "service_role";

GRANT REFERENCES ("created_at") ON TABLE public."post_likes" TO "service_role";

GRANT SELECT ("created_at") ON TABLE public."post_likes" TO "service_role";

GRANT UPDATE ("created_at") ON TABLE public."post_likes" TO "service_role";

GRANT INSERT ("post_id") ON TABLE public."post_likes" TO "service_role";

GRANT REFERENCES ("post_id") ON TABLE public."post_likes" TO "service_role";

GRANT SELECT ("post_id") ON TABLE public."post_likes" TO "service_role";

GRANT UPDATE ("post_id") ON TABLE public."post_likes" TO "service_role";

GRANT INSERT ("user_id") ON TABLE public."post_likes" TO "service_role";

GRANT REFERENCES ("user_id") ON TABLE public."post_likes" TO "service_role";

GRANT SELECT ("user_id") ON TABLE public."post_likes" TO "service_role";

GRANT UPDATE ("user_id") ON TABLE public."post_likes" TO "service_role";

GRANT INSERT ("created_at") ON TABLE public."post_tags" TO "service_role";

GRANT REFERENCES ("created_at") ON TABLE public."post_tags" TO "service_role";

GRANT SELECT ("created_at") ON TABLE public."post_tags" TO "service_role";

GRANT UPDATE ("created_at") ON TABLE public."post_tags" TO "service_role";

GRANT INSERT ("post_id") ON TABLE public."post_tags" TO "service_role";

GRANT REFERENCES ("post_id") ON TABLE public."post_tags" TO "service_role";

GRANT SELECT ("post_id") ON TABLE public."post_tags" TO "service_role";

GRANT UPDATE ("post_id") ON TABLE public."post_tags" TO "service_role";

GRANT INSERT ("tag_id") ON TABLE public."post_tags" TO "service_role";

GRANT REFERENCES ("tag_id") ON TABLE public."post_tags" TO "service_role";

GRANT SELECT ("tag_id") ON TABLE public."post_tags" TO "service_role";

GRANT UPDATE ("tag_id") ON TABLE public."post_tags" TO "service_role";

GRANT INSERT ("body") ON TABLE public."posts" TO "service_role";

GRANT REFERENCES ("body") ON TABLE public."posts" TO "service_role";

GRANT SELECT ("body") ON TABLE public."posts" TO "service_role";

GRANT UPDATE ("body") ON TABLE public."posts" TO "service_role";

GRANT INSERT ("category_id") ON TABLE public."posts" TO "service_role";

GRANT REFERENCES ("category_id") ON TABLE public."posts" TO "service_role";

GRANT SELECT ("category_id") ON TABLE public."posts" TO "service_role";

GRANT UPDATE ("category_id") ON TABLE public."posts" TO "service_role";

GRANT INSERT ("created_at") ON TABLE public."posts" TO "service_role";

GRANT REFERENCES ("created_at") ON TABLE public."posts" TO "service_role";

GRANT SELECT ("created_at") ON TABLE public."posts" TO "service_role";

GRANT UPDATE ("created_at") ON TABLE public."posts" TO "service_role";

GRANT INSERT ("display_size") ON TABLE public."posts" TO "service_role";

GRANT REFERENCES ("display_size") ON TABLE public."posts" TO "service_role";

GRANT SELECT ("display_size") ON TABLE public."posts" TO "service_role";

GRANT UPDATE ("display_size") ON TABLE public."posts" TO "service_role";

GRANT INSERT ("front_page_pinned_at") ON TABLE public."posts" TO "service_role";

GRANT REFERENCES ("front_page_pinned_at") ON TABLE public."posts" TO "service_role";

GRANT SELECT ("front_page_pinned_at") ON TABLE public."posts" TO "service_role";

GRANT UPDATE ("front_page_pinned_at") ON TABLE public."posts" TO "service_role";

GRANT INSERT ("front_page_pinned_by") ON TABLE public."posts" TO "service_role";

GRANT REFERENCES ("front_page_pinned_by") ON TABLE public."posts" TO "service_role";

GRANT SELECT ("front_page_pinned_by") ON TABLE public."posts" TO "service_role";

GRANT UPDATE ("front_page_pinned_by") ON TABLE public."posts" TO "service_role";

GRANT INSERT ("front_page_pinned") ON TABLE public."posts" TO "service_role";

GRANT REFERENCES ("front_page_pinned") ON TABLE public."posts" TO "service_role";

GRANT SELECT ("front_page_pinned") ON TABLE public."posts" TO "service_role";

GRANT UPDATE ("front_page_pinned") ON TABLE public."posts" TO "service_role";

GRANT INSERT ("front_page_visible") ON TABLE public."posts" TO "service_role";

GRANT REFERENCES ("front_page_visible") ON TABLE public."posts" TO "service_role";

GRANT SELECT ("front_page_visible") ON TABLE public."posts" TO "service_role";

GRANT UPDATE ("front_page_visible") ON TABLE public."posts" TO "service_role";

GRANT INSERT ("gif_id") ON TABLE public."posts" TO "service_role";

GRANT REFERENCES ("gif_id") ON TABLE public."posts" TO "service_role";

GRANT SELECT ("gif_id") ON TABLE public."posts" TO "service_role";

GRANT UPDATE ("gif_id") ON TABLE public."posts" TO "service_role";

GRANT INSERT ("gif_preview_url") ON TABLE public."posts" TO "service_role";

GRANT REFERENCES ("gif_preview_url") ON TABLE public."posts" TO "service_role";

GRANT SELECT ("gif_preview_url") ON TABLE public."posts" TO "service_role";

GRANT UPDATE ("gif_preview_url") ON TABLE public."posts" TO "service_role";

GRANT INSERT ("gif_url") ON TABLE public."posts" TO "service_role";

GRANT REFERENCES ("gif_url") ON TABLE public."posts" TO "service_role";

GRANT SELECT ("gif_url") ON TABLE public."posts" TO "service_role";

GRANT UPDATE ("gif_url") ON TABLE public."posts" TO "service_role";

GRANT INSERT ("id") ON TABLE public."posts" TO "service_role";

GRANT REFERENCES ("id") ON TABLE public."posts" TO "service_role";

GRANT SELECT ("id") ON TABLE public."posts" TO "service_role";

GRANT UPDATE ("id") ON TABLE public."posts" TO "service_role";

GRANT INSERT ("image_url") ON TABLE public."posts" TO "service_role";

GRANT REFERENCES ("image_url") ON TABLE public."posts" TO "service_role";

GRANT SELECT ("image_url") ON TABLE public."posts" TO "service_role";

GRANT UPDATE ("image_url") ON TABLE public."posts" TO "service_role";

GRANT INSERT ("moderated_at") ON TABLE public."posts" TO "service_role";

GRANT REFERENCES ("moderated_at") ON TABLE public."posts" TO "service_role";

GRANT SELECT ("moderated_at") ON TABLE public."posts" TO "service_role";

GRANT UPDATE ("moderated_at") ON TABLE public."posts" TO "service_role";

GRANT INSERT ("moderated_by") ON TABLE public."posts" TO "service_role";

GRANT REFERENCES ("moderated_by") ON TABLE public."posts" TO "service_role";

GRANT SELECT ("moderated_by") ON TABLE public."posts" TO "service_role";

GRANT UPDATE ("moderated_by") ON TABLE public."posts" TO "service_role";

GRANT INSERT ("moderation_note") ON TABLE public."posts" TO "service_role";

GRANT REFERENCES ("moderation_note") ON TABLE public."posts" TO "service_role";

GRANT SELECT ("moderation_note") ON TABLE public."posts" TO "service_role";

GRANT UPDATE ("moderation_note") ON TABLE public."posts" TO "service_role";

GRANT INSERT ("moderation_status") ON TABLE public."posts" TO "service_role";

GRANT REFERENCES ("moderation_status") ON TABLE public."posts" TO "service_role";

GRANT SELECT ("moderation_status") ON TABLE public."posts" TO "service_role";

GRANT UPDATE ("moderation_status") ON TABLE public."posts" TO "service_role";

GRANT INSERT ("post_type") ON TABLE public."posts" TO "service_role";

GRANT REFERENCES ("post_type") ON TABLE public."posts" TO "service_role";

GRANT SELECT ("post_type") ON TABLE public."posts" TO "service_role";

GRANT UPDATE ("post_type") ON TABLE public."posts" TO "service_role";

GRANT INSERT ("published") ON TABLE public."posts" TO "service_role";

GRANT REFERENCES ("published") ON TABLE public."posts" TO "service_role";

GRANT SELECT ("published") ON TABLE public."posts" TO "service_role";

GRANT UPDATE ("published") ON TABLE public."posts" TO "service_role";

GRANT INSERT ("submitted_at") ON TABLE public."posts" TO "service_role";

GRANT REFERENCES ("submitted_at") ON TABLE public."posts" TO "service_role";

GRANT SELECT ("submitted_at") ON TABLE public."posts" TO "service_role";

GRANT UPDATE ("submitted_at") ON TABLE public."posts" TO "service_role";

GRANT INSERT ("title") ON TABLE public."posts" TO "service_role";

GRANT REFERENCES ("title") ON TABLE public."posts" TO "service_role";

GRANT SELECT ("title") ON TABLE public."posts" TO "service_role";

GRANT UPDATE ("title") ON TABLE public."posts" TO "service_role";

GRANT INSERT ("updated_at") ON TABLE public."posts" TO "service_role";

GRANT REFERENCES ("updated_at") ON TABLE public."posts" TO "service_role";

GRANT SELECT ("updated_at") ON TABLE public."posts" TO "service_role";

GRANT UPDATE ("updated_at") ON TABLE public."posts" TO "service_role";

GRANT INSERT ("user_id") ON TABLE public."posts" TO "service_role";

GRANT REFERENCES ("user_id") ON TABLE public."posts" TO "service_role";

GRANT SELECT ("user_id") ON TABLE public."posts" TO "service_role";

GRANT UPDATE ("user_id") ON TABLE public."posts" TO "service_role";

GRANT INSERT ("video_type") ON TABLE public."posts" TO "service_role";

GRANT REFERENCES ("video_type") ON TABLE public."posts" TO "service_role";

GRANT SELECT ("video_type") ON TABLE public."posts" TO "service_role";

GRANT UPDATE ("video_type") ON TABLE public."posts" TO "service_role";

GRANT INSERT ("youtube_id") ON TABLE public."posts" TO "service_role";

GRANT REFERENCES ("youtube_id") ON TABLE public."posts" TO "service_role";

GRANT SELECT ("youtube_id") ON TABLE public."posts" TO "service_role";

GRANT UPDATE ("youtube_id") ON TABLE public."posts" TO "service_role";

GRANT INSERT ("youtube_url") ON TABLE public."posts" TO "service_role";

GRANT REFERENCES ("youtube_url") ON TABLE public."posts" TO "service_role";

GRANT SELECT ("youtube_url") ON TABLE public."posts" TO "service_role";

GRANT UPDATE ("youtube_url") ON TABLE public."posts" TO "service_role";

GRANT INSERT ("avatar_url") ON TABLE public."profiles" TO "service_role";

GRANT REFERENCES ("avatar_url") ON TABLE public."profiles" TO "service_role";

GRANT SELECT ("avatar_url") ON TABLE public."profiles" TO "service_role";

GRANT UPDATE ("avatar_url") ON TABLE public."profiles" TO "service_role";

GRANT INSERT ("created_at") ON TABLE public."profiles" TO "service_role";

GRANT REFERENCES ("created_at") ON TABLE public."profiles" TO "service_role";

GRANT SELECT ("created_at") ON TABLE public."profiles" TO "service_role";

GRANT UPDATE ("created_at") ON TABLE public."profiles" TO "service_role";

GRANT INSERT ("display_name") ON TABLE public."profiles" TO "service_role";

GRANT REFERENCES ("display_name") ON TABLE public."profiles" TO "service_role";

GRANT SELECT ("display_name") ON TABLE public."profiles" TO "service_role";

GRANT UPDATE ("display_name") ON TABLE public."profiles" TO "service_role";

GRANT INSERT ("id") ON TABLE public."profiles" TO "service_role";

GRANT REFERENCES ("id") ON TABLE public."profiles" TO "service_role";

GRANT SELECT ("id") ON TABLE public."profiles" TO "service_role";

GRANT UPDATE ("id") ON TABLE public."profiles" TO "service_role";

GRANT INSERT ("provider") ON TABLE public."profiles" TO "service_role";

GRANT REFERENCES ("provider") ON TABLE public."profiles" TO "service_role";

GRANT SELECT ("provider") ON TABLE public."profiles" TO "service_role";

GRANT UPDATE ("provider") ON TABLE public."profiles" TO "service_role";

GRANT INSERT ("updated_at") ON TABLE public."profiles" TO "service_role";

GRANT REFERENCES ("updated_at") ON TABLE public."profiles" TO "service_role";

GRANT SELECT ("updated_at") ON TABLE public."profiles" TO "service_role";

GRANT UPDATE ("updated_at") ON TABLE public."profiles" TO "service_role";

GRANT INSERT ("username") ON TABLE public."profiles" TO "service_role";

GRANT REFERENCES ("username") ON TABLE public."profiles" TO "service_role";

GRANT SELECT ("username") ON TABLE public."profiles" TO "service_role";

GRANT UPDATE ("username") ON TABLE public."profiles" TO "service_role";

GRANT INSERT ("active") ON TABLE public."tags" TO "service_role";

GRANT REFERENCES ("active") ON TABLE public."tags" TO "service_role";

GRANT SELECT ("active") ON TABLE public."tags" TO "service_role";

GRANT UPDATE ("active") ON TABLE public."tags" TO "service_role";

GRANT INSERT ("created_at") ON TABLE public."tags" TO "service_role";

GRANT REFERENCES ("created_at") ON TABLE public."tags" TO "service_role";

GRANT SELECT ("created_at") ON TABLE public."tags" TO "service_role";

GRANT UPDATE ("created_at") ON TABLE public."tags" TO "service_role";

GRANT INSERT ("created_by") ON TABLE public."tags" TO "service_role";

GRANT REFERENCES ("created_by") ON TABLE public."tags" TO "service_role";

GRANT SELECT ("created_by") ON TABLE public."tags" TO "service_role";

GRANT UPDATE ("created_by") ON TABLE public."tags" TO "service_role";

GRANT INSERT ("id") ON TABLE public."tags" TO "service_role";

GRANT REFERENCES ("id") ON TABLE public."tags" TO "service_role";

GRANT SELECT ("id") ON TABLE public."tags" TO "service_role";

GRANT UPDATE ("id") ON TABLE public."tags" TO "service_role";

GRANT INSERT ("name") ON TABLE public."tags" TO "service_role";

GRANT REFERENCES ("name") ON TABLE public."tags" TO "service_role";

GRANT SELECT ("name") ON TABLE public."tags" TO "service_role";

GRANT UPDATE ("name") ON TABLE public."tags" TO "service_role";

GRANT INSERT ("slug") ON TABLE public."tags" TO "service_role";

GRANT REFERENCES ("slug") ON TABLE public."tags" TO "service_role";

GRANT SELECT ("slug") ON TABLE public."tags" TO "service_role";

GRANT UPDATE ("slug") ON TABLE public."tags" TO "service_role";

GRANT INSERT ("sort_order") ON TABLE public."tags" TO "service_role";

GRANT REFERENCES ("sort_order") ON TABLE public."tags" TO "service_role";

GRANT SELECT ("sort_order") ON TABLE public."tags" TO "service_role";

GRANT UPDATE ("sort_order") ON TABLE public."tags" TO "service_role";

GRANT INSERT ("updated_at") ON TABLE public."tags" TO "service_role";

GRANT REFERENCES ("updated_at") ON TABLE public."tags" TO "service_role";

GRANT SELECT ("updated_at") ON TABLE public."tags" TO "service_role";

GRANT UPDATE ("updated_at") ON TABLE public."tags" TO "service_role";

GRANT INSERT ("account_status") ON TABLE public."user_roles" TO "service_role";

GRANT REFERENCES ("account_status") ON TABLE public."user_roles" TO "service_role";

GRANT SELECT ("account_status") ON TABLE public."user_roles" TO "service_role";

GRANT UPDATE ("account_status") ON TABLE public."user_roles" TO "service_role";

GRANT INSERT ("created_at") ON TABLE public."user_roles" TO "service_role";

GRANT REFERENCES ("created_at") ON TABLE public."user_roles" TO "service_role";

GRANT SELECT ("created_at") ON TABLE public."user_roles" TO "service_role";

GRANT UPDATE ("created_at") ON TABLE public."user_roles" TO "service_role";

GRANT INSERT ("role") ON TABLE public."user_roles" TO "service_role";

GRANT REFERENCES ("role") ON TABLE public."user_roles" TO "service_role";

GRANT SELECT ("role") ON TABLE public."user_roles" TO "service_role";

GRANT UPDATE ("role") ON TABLE public."user_roles" TO "service_role";

GRANT INSERT ("updated_at") ON TABLE public."user_roles" TO "service_role";

GRANT REFERENCES ("updated_at") ON TABLE public."user_roles" TO "service_role";

GRANT SELECT ("updated_at") ON TABLE public."user_roles" TO "service_role";

GRANT UPDATE ("updated_at") ON TABLE public."user_roles" TO "service_role";

GRANT INSERT ("user_id") ON TABLE public."user_roles" TO "service_role";

GRANT REFERENCES ("user_id") ON TABLE public."user_roles" TO "service_role";

GRANT SELECT ("user_id") ON TABLE public."user_roles" TO "service_role";

GRANT UPDATE ("user_id") ON TABLE public."user_roles" TO "service_role";

GRANT INSERT ("comment_id") ON TABLE public."comment_reports" TO "service_role";

GRANT REFERENCES ("comment_id") ON TABLE public."comment_reports" TO "service_role";

GRANT SELECT ("comment_id") ON TABLE public."comment_reports" TO "service_role";

GRANT UPDATE ("comment_id") ON TABLE public."comment_reports" TO "service_role";

GRANT INSERT ("created_at") ON TABLE public."comment_reports" TO "service_role";

GRANT REFERENCES ("created_at") ON TABLE public."comment_reports" TO "service_role";

GRANT SELECT ("created_at") ON TABLE public."comment_reports" TO "service_role";

GRANT UPDATE ("created_at") ON TABLE public."comment_reports" TO "service_role";

GRANT INSERT ("id") ON TABLE public."comment_reports" TO "service_role";

GRANT REFERENCES ("id") ON TABLE public."comment_reports" TO "service_role";

GRANT SELECT ("id") ON TABLE public."comment_reports" TO "service_role";

GRANT UPDATE ("id") ON TABLE public."comment_reports" TO "service_role";

GRANT INSERT ("reported_by") ON TABLE public."comment_reports" TO "service_role";

GRANT REFERENCES ("reported_by") ON TABLE public."comment_reports" TO "service_role";

GRANT SELECT ("reported_by") ON TABLE public."comment_reports" TO "service_role";

GRANT UPDATE ("reported_by") ON TABLE public."comment_reports" TO "service_role";

INSERT INTO storage.buckets (id,name,public,file_size_limit,allowed_mime_types) VALUES ('post-images','post-images',true,10485760,ARRAY['image/jpeg','image/png','image/webp','image/gif']) ON CONFLICT (id) DO UPDATE SET public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

CREATE POLICY "post images owner delete" ON "storage"."objects" AS PERMISSIVE FOR DELETE TO "authenticated" USING (((bucket_id = 'post-images'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));

CREATE POLICY "post comments owner or staff delete" ON "public"."post_comments" AS PERMISSIVE FOR DELETE TO "authenticated" USING (((user_id = auth.uid()) OR is_staff()));

CREATE POLICY "posts owner delete" ON "public"."posts" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((auth.uid() = user_id));

CREATE POLICY "post likes owner delete" ON "public"."post_likes" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((user_id = auth.uid()));

CREATE POLICY "post images owner insert" ON "storage"."objects" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (((bucket_id = 'post-images'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));

CREATE POLICY "post comments owner insert" ON "public"."post_comments" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (((user_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND (ur.account_status = 'active'::text)))) AND (EXISTS ( SELECT 1
   FROM posts p
  WHERE ((p.id = post_comments.post_id) AND (p.moderation_status = 'approved'::text) AND (p.published = true))))));

CREATE POLICY "post likes owner insert" ON "public"."post_likes" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (((user_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND (ur.account_status = 'active'::text)))) AND (EXISTS ( SELECT 1
   FROM posts p
  WHERE ((p.id = post_likes.post_id) AND (p.moderation_status = 'approved'::text) AND (p.published = true))))));

CREATE POLICY "posts owner insert" ON "public"."posts" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "posts moderated read" ON "public"."posts" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING ((((moderation_status = 'approved'::text) AND (published = true)) OR (auth.uid() = user_id) OR is_staff()));

CREATE POLICY "user roles own or staff read" ON "public"."user_roles" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((user_id = auth.uid()) OR is_staff()));

CREATE POLICY "forum categories public read" ON "public"."forum_categories" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING ((active = true));

CREATE POLICY "post images public read" ON "storage"."objects" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING ((bucket_id = 'post-images'::text));

CREATE POLICY "post comments public read" ON "public"."post_comments" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING ((EXISTS ( SELECT 1
   FROM posts p
  WHERE ((p.id = post_comments.post_id) AND (p.moderation_status = 'approved'::text) AND (p.published = true)))));

CREATE POLICY "post likes public read" ON "public"."post_likes" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING ((EXISTS ( SELECT 1
   FROM posts p
  WHERE ((p.id = post_likes.post_id) AND (p.moderation_status = 'approved'::text) AND (p.published = true)))));

CREATE POLICY "post tags visible with post" ON "public"."post_tags" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING ((EXISTS ( SELECT 1
   FROM posts p
  WHERE ((p.id = post_tags.post_id) AND (((p.moderation_status = 'approved'::text) AND (p.published = true)) OR (p.user_id = auth.uid()) OR is_staff())))));

CREATE POLICY "blog public published read" ON "public"."blog_posts" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING ((published = true));

CREATE POLICY "blog admin all read" ON "public"."blog_posts" AS PERMISSIVE FOR SELECT TO "authenticated" USING (is_active_roffle_admin());

CREATE POLICY "forum replies public read" ON "public"."forum_replies" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (true);

CREATE POLICY "forum threads public read" ON "public"."forum_threads" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (true);

CREATE POLICY "categories public read" ON "public"."post_categories" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (true);

CREATE POLICY "profiles public read" ON "public"."profiles" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (true);

CREATE POLICY "tags public read" ON "public"."tags" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (true);

CREATE POLICY "post images owner update" ON "storage"."objects" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (((bucket_id = 'post-images'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text))) WITH CHECK (((bucket_id = 'post-images'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));

CREATE POLICY "profiles owner update" ON "public"."profiles" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((auth.uid() = id)) WITH CHECK ((auth.uid() = id));

CREATE POLICY "posts staff update" ON "public"."posts" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (is_staff()) WITH CHECK (is_staff());

CREATE TRIGGER forum_reply_stats_trigger AFTER INSERT OR DELETE ON public.forum_replies FOR EACH ROW EXECUTE FUNCTION sync_forum_thread_reply_stats();

CREATE TRIGGER on_auth_user_created AFTER INSERT OR UPDATE OF raw_user_meta_data, raw_app_meta_data ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE TRIGGER on_auth_user_role_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user_role();

CREATE TRIGGER posts_apply_moderation_defaults BEFORE INSERT ON public.posts FOR EACH ROW EXECUTE FUNCTION apply_post_moderation_defaults();

CREATE TRIGGER posts_set_updated_at BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER user_roles_set_updated_at BEFORE UPDATE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER validate_post_category_trigger BEFORE INSERT OR UPDATE OF category_id ON public.posts FOR EACH ROW EXECUTE FUNCTION validate_post_category();

REVOKE ALL ON FUNCTION public."admin_create_taxonomy"(text, text) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public."admin_create_taxonomy"(text, text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public."admin_dashboard_stats"() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public."admin_dashboard_stats"() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public."admin_delete_blog_post"(uuid) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public."admin_delete_blog_post"(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public."admin_delete_rejected_post"(uuid) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public."admin_delete_rejected_post"(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public."admin_flagged_comments"() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public."admin_flagged_comments"() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public."admin_list_users"() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public."admin_list_users"() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public."admin_save_blog_post"(uuid, text, text, text, text, text, text, boolean, boolean) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public."admin_save_blog_post"(uuid, text, text, text, text, text, text, boolean, boolean) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public."admin_set_account_status"(uuid, text) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public."admin_set_account_status"(uuid, text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public."admin_set_front_page_pin"(uuid, boolean) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public."admin_set_front_page_pin"(uuid, boolean) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public."admin_set_front_page_visibility"(uuid, boolean) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public."admin_set_front_page_visibility"(uuid, boolean) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public."admin_set_user_role"(uuid, text) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public."admin_set_user_role"(uuid, text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public."admin_update_taxonomy"(text, uuid, text, boolean) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public."admin_update_taxonomy"(text, uuid, text, boolean) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public."apply_post_moderation_defaults"() FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public."create_forum_reply"(uuid, text, text, text, text) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public."create_forum_reply"(uuid, text, text, text, text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public."create_forum_thread"(uuid, text, text) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public."create_forum_thread"(uuid, text, text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public."delete_forum_reply"(uuid) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public."delete_forum_reply"(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public."delete_forum_thread"(uuid) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public."delete_forum_thread"(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public."delete_post"(uuid) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public."delete_post"(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public."edit_post"(uuid, text, text, text, text, text, text, uuid, uuid[], text, text, text) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public."edit_post"(uuid, text, text, text, text, text, text, uuid, uuid[], text, text, text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public."flag_comment"(uuid) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public."flag_comment"(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public."get_youtube_gems"(integer) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public."get_youtube_gems"(integer) TO authenticated, service_role;

GRANT EXECUTE ON FUNCTION public."get_youtube_gems"(integer) TO anon;

REVOKE ALL ON FUNCTION public."handle_new_user"() FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public."handle_new_user_role"() FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public."increment_forum_thread_view"(uuid) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public."increment_forum_thread_view"(uuid) TO authenticated, service_role;

GRANT EXECUTE ON FUNCTION public."increment_forum_thread_view"(uuid) TO anon;

REVOKE ALL ON FUNCTION public."is_active_roffle_admin"() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public."is_active_roffle_admin"() TO authenticated, service_role;

GRANT EXECUTE ON FUNCTION public."is_active_roffle_admin"() TO anon;

REVOKE ALL ON FUNCTION public."is_admin"() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public."is_admin"() TO authenticated, service_role;

GRANT EXECUTE ON FUNCTION public."is_admin"() TO anon;

REVOKE ALL ON FUNCTION public."is_staff"() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public."is_staff"() TO authenticated, service_role;

GRANT EXECUTE ON FUNCTION public."is_staff"() TO anon;

REVOKE ALL ON FUNCTION public."is_username_available"(text) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public."is_username_available"(text) TO authenticated, service_role;

GRANT EXECUTE ON FUNCTION public."is_username_available"(text) TO anon;

REVOKE ALL ON FUNCTION public."moderate_post"(uuid, text, text) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public."moderate_post"(uuid, text, text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public."require_active_forum_user"() FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public."set_forum_thread_controls"(uuid, boolean, boolean) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public."set_forum_thread_controls"(uuid, boolean, boolean) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public."set_post_display_size"(uuid, text) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public."set_post_display_size"(uuid, text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public."set_post_tags"(uuid, uuid[]) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public."set_post_tags"(uuid, uuid[]) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public."set_updated_at"() FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public."sync_forum_thread_reply_stats"() FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public."validate_post_category"() FROM PUBLIC, anon, authenticated;

-- Create application records for users who signed in before this setup.
INSERT INTO public.profiles (id,display_name,avatar_url,provider)
SELECT id,coalesce(nullif(raw_user_meta_data->>'full_name',''),nullif(raw_user_meta_data->>'name',''),split_part(email,'@',1),'ROFFLE User'),coalesce(raw_user_meta_data->>'avatar_url',raw_user_meta_data->>'picture'),raw_app_meta_data->>'provider'
FROM auth.users ON CONFLICT (id) DO NOTHING;
INSERT INTO public.user_roles (user_id,role,account_status)
SELECT id,'user','active' FROM auth.users ON CONFLICT (user_id) DO NOTHING;
UPDATE public.user_roles SET role='admin',account_status='active',updated_at=now()
WHERE user_id IN (SELECT id FROM auth.users WHERE lower(email)='iekhanine@gmail.com');
NOTIFY pgrst, 'reload schema';
COMMIT;
-- Confirm your account is admin. Zero rows means that email has not signed in here.
SELECT u.email,r.role,r.account_status FROM auth.users u JOIN public.user_roles r ON r.user_id=u.id WHERE lower(u.email)='iekhanine@gmail.com';
