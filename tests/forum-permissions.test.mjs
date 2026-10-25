import { PGlite } from '@electric-sql/pglite';
import fs from 'node:fs/promises';
import test from 'node:test';
test('forum migration and database authorization boundaries', async () => {
const db=new PGlite();
await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
CREATE SCHEMA auth; CREATE SCHEMA storage; CREATE SCHEMA extensions;
CREATE TABLE auth.users(id uuid PRIMARY KEY,email text,raw_user_meta_data jsonb DEFAULT '{}',raw_app_meta_data jsonb DEFAULT '{}',created_at timestamptz DEFAULT now(),email_confirmed_at timestamptz);
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
GRANT USAGE ON SCHEMA auth,public TO anon,authenticated,service_role; GRANT EXECUTE ON FUNCTION auth.uid() TO anon,authenticated,service_role;
CREATE TABLE storage.buckets(id text PRIMARY KEY,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
CREATE TABLE storage.objects(id uuid,name text,bucket_id text); ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
CREATE FUNCTION storage.foldername(text) RETURNS text[] LANGUAGE sql AS $$ SELECT string_to_array($1,'/') $$;`);
try {
await db.exec(await fs.readFile(new URL('./fixtures/baseline.sql', import.meta.url),'utf8'));
await db.exec(await fs.readFile(new URL('../migrations/20261025000100_r2_forum_moderation.sql', import.meta.url),'utf8'));
console.log('PASS baseline and new migration applied');
}catch(e){console.error('FAIL migration',e.message,e.query?.slice(0,200));throw e;}
await db.exec(`INSERT INTO auth.users(id,email) VALUES ('00000000-0000-0000-0000-000000000001','admin@test.invalid'),('00000000-0000-0000-0000-000000000002','mod@test.invalid'),('00000000-0000-0000-0000-000000000003','user@test.invalid');
UPDATE public.user_roles SET role='admin' WHERE user_id='00000000-0000-0000-0000-000000000001';UPDATE public.user_roles SET role='moderator' WHERE user_id='00000000-0000-0000-0000-000000000002';
INSERT INTO public.forum_categories(id,name,slug) VALUES ('10000000-0000-0000-0000-000000000001','General','general');
INSERT INTO public.forum_threads(id,category_id,user_id,title,body) VALUES ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000003','Test thread','Original body');`);
async function as(user,sql,denied=false){await db.exec(`RESET ROLE; SELECT set_config('request.jwt.claim.sub','${user?`00000000-0000-0000-0000-00000000000${user}`:''}',false); SET ROLE ${user?'authenticated':'anon'};`);try{const r=await db.query(sql);if(denied)throw new Error('Expected permission denial');return r;}catch(e){if(denied&&e.message!=='Expected permission denial')return;throw e;}finally{await db.exec('RESET ROLE');}}
const id="'20000000-0000-0000-0000-000000000001'";
await as(null,`SELECT public.flag_forum_content('thread',${id},'spam')`,true);
await as(3,`SELECT public.flag_forum_content('thread',${id},'spam')`);
await as(3,`SELECT public.flag_forum_content('thread',${id},'spam')`);
if((await db.query('SELECT count(*)::int AS n FROM forum_reports')).rows[0].n!==1)throw Error('Duplicate report');
await as(3,`SELECT public.edit_forum_content('thread',${id},'Changed','Body')`,true);
await as(2,`SELECT public.edit_forum_content('thread',${id},'Changed','Body')`,true);
await as(1,`SELECT public.edit_forum_content('thread',${id},'Changed','Body')`);
await as(3,`SELECT public.delete_forum_thread(${id})`,true);
await as(3,`DELETE FROM public.forum_threads WHERE id=${id}`,true);
await as(2,`SELECT public.admin_save_forum_settings('Title','Description',false,false)`,true);
await as(1,`SELECT public.admin_save_forum_settings('Title','Description',false,false)`);
await as(3,`SELECT public.create_forum_thread('10000000-0000-0000-0000-000000000001','New title','New body')`,true);
await as(2,`SELECT public.delete_forum_thread(${id})`);
const r=await db.query("SELECT status,thread_id FROM forum_reports");if(r.rows[0].status!=='resolved'||r.rows[0].thread_id!==null)throw Error('Deleted report snapshot missing');
await as(3,`SELECT public.reserve_media_upload('00000000-0000-0000-0000-000000000003','video/mp4',100)`,true);

await db.exec(`INSERT INTO public.forum_threads(id,category_id,user_id,title,body) VALUES ('20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000003','Reply test','Body');
INSERT INTO public.forum_replies(id,thread_id,user_id,body) VALUES ('30000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000003','A reply');`);
const reply="'30000000-0000-0000-0000-000000000001'";
await as(3,`SELECT public.flag_forum_content('reply',${reply},'Review reply')`);
await as(2,`SELECT public.edit_forum_content('reply',${reply},null,'Edited')`,true);
await as(1,`SELECT public.edit_forum_content('reply',${reply},null,'Admin edited')`);
await as(3,`SELECT public.delete_forum_reply(${reply})`,true);
await as(2,`SELECT public.delete_forum_reply(${reply})`);
await as(3,`UPDATE public.forum_threads SET title='Unauthorized'`,true);
await as(2,`SELECT public.set_forum_thread_controls('20000000-0000-0000-0000-000000000002',true,true)`,true);
await as(1,`SELECT public.set_forum_thread_controls('20000000-0000-0000-0000-000000000002',true,true)`);
const asset=await db.query(`SELECT (public.reserve_media_upload('00000000-0000-0000-0000-000000000003','video/mp4',1024)).id AS id`);
if(!asset.rows[0].id)throw Error('Reservation failed');
await as(3,`SELECT * FROM public.media_assets`,true);
console.log('PASS reply flags/edit/delete boundaries, direct table write denial, pin/lock admin-only, server reservation and private asset ledger');
console.log('PASS anonymous denial, logged-in flags, duplicate flags, owner deletion denial, moderator edit denial/deletion allowed, admin editing/settings, posting pause, report preservation, media reservation isolation');
await db.close();

});
