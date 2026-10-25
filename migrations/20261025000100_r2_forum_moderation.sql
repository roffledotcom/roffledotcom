-- Run ONCE in the NEW Roffle project, after the initial database setup.
BEGIN;
CREATE TABLE public.forum_settings (
 id boolean PRIMARY KEY DEFAULT true CHECK (id),
 title text NOT NULL DEFAULT 'ROFFLE Forums' CHECK (char_length(title) BETWEEN 1 AND 100),
 description text NOT NULL DEFAULT 'Talk about what makes you laugh.' CHECK (char_length(description)<=1000),
 allow_threads boolean NOT NULL DEFAULT true,
 allow_replies boolean NOT NULL DEFAULT true
);
INSERT INTO public.forum_settings(id) VALUES(true);
ALTER TABLE public.forum_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.forum_settings FROM anon,authenticated;
GRANT SELECT ON public.forum_settings TO anon,authenticated;
CREATE POLICY forum_settings_read ON public.forum_settings FOR SELECT USING(true);
CREATE TABLE public.forum_reports (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 thread_id uuid REFERENCES public.forum_threads(id) ON DELETE SET NULL,
 reply_id uuid REFERENCES public.forum_replies(id) ON DELETE SET NULL,
 target_kind text NOT NULL CHECK(target_kind IN ('thread','reply')),
 target_id uuid NOT NULL,
 reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 reason text NOT NULL CHECK(char_length(reason) BETWEEN 1 AND 1000),
 content_snapshot text NOT NULL,
 title_snapshot text,
 status text NOT NULL DEFAULT 'open' CHECK(status IN ('open','resolved')),
 created_at timestamptz NOT NULL DEFAULT now(),
 resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
 resolved_at timestamptz,
 UNIQUE(target_kind,target_id,reporter_id)
);
CREATE INDEX forum_reports_open_idx ON public.forum_reports(status,created_at DESC);
ALTER TABLE public.forum_reports ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.forum_reports FROM anon,authenticated;
GRANT SELECT ON public.forum_reports TO authenticated;
CREATE POLICY forum_reports_staff_read ON public.forum_reports FOR SELECT TO authenticated USING(public.is_staff());
CREATE FUNCTION public.flag_forum_content(kind text,target uuid,report_reason text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE tid uuid; rid uuid; content text; headline text;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in to flag a post.'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=auth.uid() AND account_status='active') THEN RAISE EXCEPTION 'Active account required.'; END IF;
 IF char_length(trim(report_reason)) NOT BETWEEN 1 AND 1000 THEN RAISE EXCEPTION 'Enter a reason (1–1000 characters).'; END IF;
 IF kind='thread' THEN
  SELECT id,body,title INTO tid,content,headline FROM public.forum_threads WHERE id=target;
 ELSIF kind='reply' THEN
  SELECT r.thread_id,r.id,coalesce(r.body,'[GIF reply]'),t.title INTO tid,rid,content,headline FROM public.forum_replies r JOIN public.forum_threads t ON t.id=r.thread_id WHERE r.id=target;
 ELSE RAISE EXCEPTION 'Invalid content type.'; END IF;
 IF tid IS NULL THEN RAISE EXCEPTION 'Post no longer exists.'; END IF;
 INSERT INTO public.forum_reports(thread_id,reply_id,target_kind,target_id,reporter_id,reason,content_snapshot,title_snapshot)
 VALUES(tid,rid,kind,target,auth.uid(),trim(report_reason),content,headline)
 ON CONFLICT(target_kind,target_id,reporter_id) DO NOTHING;
END $$;
CREATE FUNCTION public.edit_forum_content(kind text,target uuid,new_title text,new_body text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NOT public.is_admin() THEN RAISE EXCEPTION 'Admin access required.'; END IF;
 IF kind='thread' THEN
  UPDATE public.forum_threads SET title=trim(new_title),body=trim(new_body),updated_at=now() WHERE id=target;
 ELSIF kind='reply' THEN
  UPDATE public.forum_replies SET body=nullif(trim(new_body),''),updated_at=now() WHERE id=target;
 ELSE RAISE EXCEPTION 'Invalid content type.'; END IF;
 IF NOT FOUND THEN RAISE EXCEPTION 'Post no longer exists.'; END IF;
END $$;
CREATE OR REPLACE FUNCTION public.delete_forum_thread(target_thread uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NOT public.is_staff() THEN RAISE EXCEPTION 'Admin or moderator access required.'; END IF;
 UPDATE public.forum_reports SET status='resolved',resolved_by=auth.uid(),resolved_at=now()
 WHERE thread_id=target_thread AND status='open';
 DELETE FROM public.forum_threads WHERE id=target_thread;
 IF NOT FOUND THEN RAISE EXCEPTION 'Thread no longer exists.'; END IF;
END $$;
CREATE OR REPLACE FUNCTION public.delete_forum_reply(target_reply uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NOT public.is_staff() THEN RAISE EXCEPTION 'Admin or moderator access required.'; END IF;
 UPDATE public.forum_reports SET status='resolved',resolved_by=auth.uid(),resolved_at=now()
 WHERE reply_id=target_reply AND status='open';
 DELETE FROM public.forum_replies WHERE id=target_reply;
 IF NOT FOUND THEN RAISE EXCEPTION 'Reply no longer exists.'; END IF;
END $$;
CREATE FUNCTION public.resolve_forum_report(report uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NOT public.is_staff() THEN RAISE EXCEPTION 'Staff access required.'; END IF;
 UPDATE public.forum_reports SET status='resolved',resolved_by=auth.uid(),resolved_at=now() WHERE id=report;
END $$;
CREATE FUNCTION public.admin_save_forum_settings(forum_title text,forum_description text,threads_enabled boolean,replies_enabled boolean) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NOT public.is_admin() THEN RAISE EXCEPTION 'Admin access required.'; END IF;
 UPDATE public.forum_settings SET title=trim(forum_title),description=trim(forum_description),allow_threads=threads_enabled,allow_replies=replies_enabled WHERE id;
END $$;
CREATE FUNCTION public.admin_save_forum_category(category uuid,category_name text,category_slug text,category_description text,category_order integer,category_active boolean) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NOT public.is_admin() THEN RAISE EXCEPTION 'Admin access required.'; END IF;
 IF category IS NULL THEN
 INSERT INTO public.forum_categories(name,slug,description,sort_order,active) VALUES(trim(category_name),trim(category_slug),nullif(trim(category_description),''),category_order,category_active);
 ELSE
 UPDATE public.forum_categories SET name=trim(category_name),slug=trim(category_slug),description=nullif(trim(category_description),''),sort_order=category_order,active=category_active,updated_at=now() WHERE id=category;
 END IF;
END $$;
CREATE FUNCTION public.admin_delete_forum_category(category uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NOT public.is_admin() THEN RAISE EXCEPTION 'Admin access required.'; END IF;
 IF EXISTS(SELECT 1 FROM public.forum_threads WHERE category_id=category) THEN RAISE EXCEPTION 'This category has threads. Disable it instead, or delete its threads first.'; END IF;
 DELETE FROM public.forum_categories WHERE id=category;
END $$;
-- Admin can see inactive categories; regular visitors retain the original active-only policy.
CREATE POLICY forum_category_admin_read ON public.forum_categories FOR SELECT TO authenticated USING(public.is_admin());
-- Prevent direct table mutations from bypassing the staff-only RPCs.
REVOKE INSERT,UPDATE,DELETE ON public.forum_threads,public.forum_replies,public.forum_categories FROM anon,authenticated;

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
 IF NOT (SELECT allow_threads FROM public.forum_settings WHERE id) AND NOT public.is_admin() THEN RAISE EXCEPTION 'Forum posting is temporarily paused.'; END IF;
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
$function$
;

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
 IF NOT (SELECT allow_replies FROM public.forum_settings WHERE id) AND NOT public.is_admin() THEN RAISE EXCEPTION 'Forum posting is temporarily paused.'; END IF;
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
$function$
;

CREATE OR REPLACE FUNCTION public.set_forum_thread_controls(target_thread uuid, pinned boolean, locked boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not
    public.is_admin()
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
$function$
;

-- Private R2 upload ledger. Only the server's service role can change it.
CREATE TABLE public.media_assets (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 object_key text NOT NULL UNIQUE,
 content_type text NOT NULL CHECK(content_type IN ('video/mp4','video/webm','image/webp')),
 bytes bigint NOT NULL CHECK(bytes BETWEEN 1 AND 52428800),
 status text NOT NULL DEFAULT 'uploading' CHECK(status IN ('uploading','ready','failed')),
 created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.media_assets FROM anon,authenticated;
GRANT ALL ON public.media_assets TO service_role;
CREATE INDEX media_assets_owner_created_idx ON public.media_assets(user_id,created_at);
ALTER TABLE public.posts ADD COLUMN media_asset_id uuid REFERENCES public.media_assets(id);
CREATE UNIQUE INDEX posts_media_asset_unique ON public.posts(media_asset_id) WHERE media_asset_id IS NOT NULL;
ALTER TABLE public.posts DROP CONSTRAINT posts_post_type_check;
ALTER TABLE public.posts ADD CONSTRAINT posts_post_type_check CHECK(post_type IN ('youtube','text','image','upload_video'));
ALTER TABLE public.posts DROP CONSTRAINT posts_content_check;
ALTER TABLE public.posts ADD CONSTRAINT posts_content_check CHECK(
 (post_type='youtube' AND youtube_url IS NOT NULL AND youtube_id IS NOT NULL AND video_type IS NOT NULL AND video_type IN ('short','video')) OR
 (post_type='text' AND body IS NOT NULL AND char_length(trim(body)) BETWEEN 1 AND 500) OR
 (post_type='image' AND (image_url IS NOT NULL OR media_asset_id IS NOT NULL)) OR
 (post_type='upload_video' AND media_asset_id IS NOT NULL)
);
CREATE FUNCTION public.validate_media_post() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NEW.media_asset_id IS NOT NULL AND NOT EXISTS(
 SELECT 1 FROM public.media_assets a WHERE a.id=NEW.media_asset_id AND a.user_id=NEW.user_id AND a.status='ready'
 AND ((NEW.post_type='upload_video' AND a.content_type LIKE 'video/%') OR (NEW.post_type='image' AND a.content_type='image/webp'))
 ) THEN RAISE EXCEPTION 'Media upload is not ready or does not belong to this author.'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER posts_validate_media BEFORE INSERT OR UPDATE OF media_asset_id,post_type,user_id ON public.posts FOR EACH ROW EXECUTE FUNCTION public.validate_media_post();
CREATE FUNCTION public.reserve_media_upload(owner_id uuid,mime text,file_bytes bigint) RETURNS public.media_assets
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE asset public.media_assets; asset_id uuid:=gen_random_uuid(); ext text;
BEGIN
 PERFORM pg_advisory_xact_lock(82657123);
 IF NOT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=owner_id AND account_status='active') THEN RAISE EXCEPTION 'Active Roffle account required.'; END IF;
 IF mime NOT IN ('video/mp4','video/webm','image/webp') OR file_bytes NOT BETWEEN 1 AND 52428800 OR (mime='image/webp' AND file_bytes>10485760) THEN RAISE EXCEPTION 'Invalid file type or size.'; END IF;
 IF (SELECT count(*) FROM public.media_assets WHERE user_id=owner_id AND created_at>now()-interval '1 day')>=20 THEN RAISE EXCEPTION 'Daily upload limit reached (20).'; END IF;
 IF (SELECT coalesce(sum(bytes),0) FROM public.media_assets WHERE status='ready' OR (status='uploading' AND created_at>now()-interval '1 day'))+file_bytes>8589934592 THEN RAISE EXCEPTION 'Roffle media storage budget reached. Contact an admin.'; END IF;
 ext:=CASE mime WHEN 'video/mp4' THEN 'mp4' WHEN 'video/webm' THEN 'webm' ELSE 'webp' END;
 INSERT INTO public.media_assets(id,user_id,object_key,content_type,bytes) VALUES(asset_id,owner_id,'media/'||owner_id||'/'||asset_id||'.'||ext,mime,file_bytes) RETURNING * INTO asset;
 RETURN asset;
END $$;
REVOKE ALL ON FUNCTION public.reserve_media_upload(uuid,text,bigint) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_media_upload(uuid,text,bigint) TO service_role;
REVOKE ALL ON FUNCTION public.validate_media_post() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.flag_forum_content(text,uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.flag_forum_content(text,uuid,text) TO authenticated;
REVOKE ALL ON FUNCTION public.edit_forum_content(text,uuid,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.edit_forum_content(text,uuid,text,text) TO authenticated;
REVOKE ALL ON FUNCTION public.resolve_forum_report(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.resolve_forum_report(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.admin_save_forum_settings(text,text,boolean,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.admin_save_forum_settings(text,text,boolean,boolean) TO authenticated;
REVOKE ALL ON FUNCTION public.admin_save_forum_category(uuid,text,text,text,integer,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.admin_save_forum_category(uuid,text,text,text,integer,boolean) TO authenticated;
REVOKE ALL ON FUNCTION public.admin_delete_forum_category(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.admin_delete_forum_category(uuid) TO authenticated;

CREATE FUNCTION public.edit_uploaded_post(target_post uuid,new_title text,new_body text,new_category uuid,new_tags uuid[]) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=auth.uid() AND account_status='active') THEN RAISE EXCEPTION 'Active account required.'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.posts WHERE id=target_post AND media_asset_id IS NOT NULL AND (user_id=auth.uid() OR public.is_admin())) THEN RAISE EXCEPTION 'Only the author or an admin can edit this media post.'; END IF;
 IF char_length(trim(coalesce(new_title,''))) NOT BETWEEN 1 AND 180 OR char_length(coalesce(new_body,''))>500 THEN RAISE EXCEPTION 'Invalid title or caption length.'; END IF;
 UPDATE public.posts SET title=trim(new_title),body=nullif(trim(new_body),''),category_id=new_category,updated_at=now(),moderation_status=CASE WHEN public.is_admin() THEN moderation_status ELSE 'pending' END WHERE id=target_post;
 PERFORM public.set_post_tags(target_post,new_tags);
END $$;
REVOKE ALL ON FUNCTION public.edit_uploaded_post(uuid,text,text,uuid,uuid[]) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.edit_uploaded_post(uuid,text,text,uuid,uuid[]) TO authenticated;

NOTIFY pgrst,'reload schema';
COMMIT;
