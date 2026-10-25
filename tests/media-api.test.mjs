import test from 'node:test';
import assert from 'node:assert/strict';
import {GET,POST} from '../api/media.js';
test('media API authenticates, checks account status, signs only approved files, and honors post visibility',async()=>{
 const saved={...process.env};const oldFetch=globalThis.fetch;
 Object.assign(process.env,{SUPABASE_URL:'https://test.supabase.co',SUPABASE_PUBLISHABLE_KEY:'test-publishable',SUPABASE_SERVICE_ROLE_KEY:'test-service',R2_ENDPOINT:'https://test.r2.cloudflarestorage.com',R2_ACCESS_KEY_ID:'test-access',R2_SECRET_ACCESS_KEY:'test-secret',R2_BUCKET_NAME:'roffledotcom'});
 let status='active';let reservations=0;
 globalThis.fetch=async(input)=>{const url=String(typeof input==='string'?input:input.url||input);let data;
 if(url.includes('/auth/v1/user'))data={id:'00000000-0000-0000-0000-000000000001',aud:'authenticated',email:'test@example.invalid'};
 else if(url.includes('/user_roles'))data={role:'user',account_status:status};
 else if(url.includes('/rpc/reserve_media_upload')){reservations++;data={id:'10000000-0000-0000-0000-000000000001',user_id:'00000000-0000-0000-0000-000000000001',object_key:'media/user/video.mp4',content_type:'video/mp4',bytes:1024};}
 else if(url.includes('/posts'))data=null;
 else throw Error('Unexpected network call: '+url);
 return new Response(JSON.stringify(data),{headers:{'Content-Type':'application/json'}});};
 const req=(data,auth=true)=>new Request('https://roffle.example/api/media',{method:'POST',headers:{'Content-Type':'application/json',...(auth?{Authorization:'Bearer test-jwt'}:{})},body:JSON.stringify(data)});
 try{
 assert.equal((await POST(req({action:'sign'},false))).status,401);
 status='banned';assert.equal((await POST(req({action:'sign',contentType:'video/mp4',bytes:1024}))).status,403);status='active';
 assert.equal((await POST(req({action:'sign',contentType:'video/mp4',bytes:52428801}))).status,400);assert.equal(reservations,0);
 const result=await POST(req({action:'sign',contentType:'video/mp4',bytes:1024}));assert.equal(result.status,200);const signed=await result.json();assert.match(signed.url,/staging/);assert.match(signed.url,/X-Amz-Signature/);assert.equal(reservations,1);assert.equal(signed.assetId,'10000000-0000-0000-0000-000000000001');
 assert.equal((await GET(new Request('https://roffle.example/api/media?post=20000000-0000-0000-0000-000000000001'))).status,404);
 }finally{globalThis.fetch=oldFetch;for(const k of Object.keys(process.env))if(!(k in saved))delete process.env[k];Object.assign(process.env,saved);}
});
