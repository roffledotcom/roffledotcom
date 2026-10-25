import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowRight, ArrowUp, Bell, ChartNoAxesColumnIncreasing, Check, ChevronDown, Clock, FileText, Flag, Flame, Gamepad2, Grid2X2, House, Menu, MessageCircle, Plus, Search, Send, Share2, Smile, Trophy, Users, X } from "lucide-react";
import type { FormEvent } from "react";
import "./Prototype.css";

type Category = "Comedy" | "Gaming" | "Weird Stuff" | "Community";
type Post = { id: string; author: string; avatar: string; category: Category; title: string; body?: string; image?: string; video?: string; score: number; hours: number; comments: number; replies: string[] };
const seed: Post[] = [
  { id: "game", author: "tooterfish", avatar: "🐟", category: "Gaming", title: "We had a plan. The game disagreed.", image: "game", body: "A flawless strategy. Approximately four seconds of execution.", score: 128, hours: 2, comments: 34, replies: ["The strategy was clearly to become a pancake.", "We should probably try dodging next time."] },
  { id: "cat", author: "nix0n", avatar: "🐶", category: "Comedy", title: "The meeting could have been a meme.", image: "cat", score: 86, hours: 4, comments: 18, replies: ["Circling back to the snacks."] },
  { id: "community", author: "tooterfish", avatar: "🐟", category: "Community", title: "Make yourselves.", body: "Clips, memes, nonsense. Submissions get reviewed before the front page, then the community takes it from there.", score: 174, hours: 30, comments: 27, replies: [] },
];
const categories: { name: Category; icon: typeof Smile }[] = [{ name: "Comedy", icon: Smile }, { name: "Gaming", icon: Gamepad2 }, { name: "Weird Stuff", icon: Flame }, { name: "Community", icon: Users }];
const leaders = [{ name: "tooterfish", avatar: "🐟", weekly: 1280, all: 6412 }, { name: "nix0n", avatar: "🐶", weekly: 945, all: 4871 }];

export default function Prototype() {
  const [posts, setPosts] = useState(seed);
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [sort, setSort] = useState("Hot");
  const [period, setPeriod] = useState("week");
  const [category, setCategory] = useState<Category | "All">("All");
  const [search, setSearch] = useState("");
  const [view, setView] = useState("feed");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [composer, setComposer] = useState(false);
  const [comments, setComments] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [rankPeriod, setRankPeriod] = useState<"weekly" | "all">("weekly");
  const [notifications, setNotifications] = useState(false);
  const [flagged, setFlagged] = useState<string[]>([]);
  const [submissionCount, setSubmissionCount] = useState(0);
  const [pendingTitle, setPendingTitle] = useState("");
  const [commentDraft, setCommentDraft] = useState("");
  const categoryRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(""), 4500);
    return () => window.clearTimeout(timer);
  }, [message]);
  function goFeed(next: Category | "All" = "All") { setCategory(next); setView("feed"); setMobileMenu(false); }
  const visible = posts.filter((p) => (category === "All" || p.category === category) && `${p.title} ${p.author} ${p.body || ""}`.toLowerCase().includes(search.toLowerCase()) && (sort !== "Top" || period !== "day" || p.hours < 24)).sort((a, b) => {
    const score = (p: Post) => p.score + (votes[p.id] || 0);
    return sort === "New" ? a.hours - b.hours : sort === "Top" ? score(b) - score(a) : score(b) / Math.pow(b.hours + 2, .65) - score(a) / Math.pow(a.hours + 2, .65);
  });
  const ranked = leaders.map((leader) => ({ ...leader, points: leader[rankPeriod] + posts.filter((p) => p.author === leader.name).reduce((sum, p) => sum + (votes[p.id] || 0), 0) })).sort((a, b) => b.points - a.points);
  async function share(id: string) {
    const url = `${window.location.origin}/prototype#demo-${id}`;
    try { await navigator.clipboard.writeText(url); setMessage("Prototype post link copied."); } catch { setMessage("Copy this page’s address to share the prototype."); }
  }
  function comment(event: FormEvent, id: string) {
    event.preventDefault();
    if (!commentDraft.trim()) return;
    setPosts((rows) => rows.map((p) => p.id === id ? { ...p, comments: p.comments + 1, replies: [...p.replies, commentDraft.trim()] } : p));
    setCommentDraft("");
  }
  return <div className="rp" ref={pageRef}>
    <a className="rp-skip" href="#rp-main">Skip to feed</a>
    <header className="rp-header">
      <button className="rp-mobile-toggle rp-icon-button" aria-label="Toggle navigation" aria-expanded={mobileMenu} onClick={() => setMobileMenu(!mobileMenu)}><Menu size={23} /></button>
      <a className="rp-logo" href="/prototype"><span>R</span><strong>ROFFLE</strong></a>
      <label className="rp-search"><Search size={20} /><input aria-label="Search prototype posts" placeholder="Search ROFFLE" value={search} onChange={(e) => { setSearch(e.target.value); setView("feed"); }} />{search && <button aria-label="Clear search" onClick={() => setSearch("")}><X size={16} /></button>}</label>
      <button className="rp-primary rp-header-submit" onClick={() => setComposer(true)}><Plus size={21} /><span>Submit a post</span></button>
      <div className="rp-notification-wrap"><button className="rp-icon-button" aria-label="Demo notifications" aria-expanded={notifications} onClick={() => setNotifications(!notifications)}><Bell size={22} /><i /></button>{notifications && <div className="rp-notifications"><strong>You’re in the prototype.</strong><p>{submissionCount ? `${submissionCount} demo submission${submissionCount === 1 ? "" : "s"} awaiting review.` : "No new notifications. Enjoy the peace."}</p><small>Nothing here changes the live site.</small></div>}</div>
      <span className="rp-avatar rp-account" aria-label="Demo account">🐶</span><ChevronDown className="rp-account-chevron" size={16} />
    </header>
    <div className="rp-preview-strip"><span><strong>DESIGN PREVIEW</strong> Demo posts, votes and points. Changes reset on reload.</span><a href="/">Back to current site <ArrowRight size={14} /></a></div>
    <div className="rp-layout">
      <aside className={`rp-sidebar ${mobileMenu ? "is-open" : ""}`}>
        <nav aria-label="Prototype navigation">
          <button className={view === "feed" && category === "All" ? "selected" : ""} onClick={() => goFeed()}><House size={22} />Home</button>
          <button onClick={() => { setMobileMenu(true); categoryRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }); }}><Grid2X2 size={22} />Categories</button>
          <a href="/forum"><MessageCircle size={22} />Forums <span className="rp-live-link">↗</span></a>
          <button className={view === "leaderboard" ? "selected" : ""} onClick={() => { setView("leaderboard"); setMobileMenu(false); }}><Trophy size={22} />Leaderboard</button>
          <a href="/blog"><FileText size={22} />Blog <span className="rp-live-link">↗</span></a>
        </nav>
        <div className="rp-category-nav" ref={categoryRef}><h2>CATEGORIES</h2>{categories.map(({ name, icon: Icon }) => <button key={name} className={view === "feed" && category === name ? "selected" : ""} onClick={() => goFeed(name)}><Icon size={22} />{name}</button>)}</div>
        <p className="rp-sidebar-note"><span>ROFFLE · Community prototype</span></p>
      </aside>
      <main id="rp-main" className="rp-feed">
        {view === "leaderboard" ? <>
          <div className="rp-intro"><span className="rp-eyebrow">THE PEOPLE BEHIND THE POSTS</span><p>Bragging rights.</p></div>
          <section className="rp-card rp-full-leaderboard"><div className="rp-card-heading"><h2><Trophy size={23} />Leaderboard</h2><PeriodToggle value={rankPeriod} onChange={setRankPeriod} /></div>{ranked.map((person, i) => <div className="rp-ranking" key={person.name}><b>{i + 1}</b><span className="rp-avatar">{person.avatar}</span><strong>@{person.name}</strong><span>{person.points.toLocaleString()} <small>points</small></span></div>)}<p className="rp-note">Illustrative scores. In the finished version, approved posts earn points from community votes.</p></section>
          <button className="rp-secondary" onClick={() => goFeed()}>Back to the feed</button>
        </> : <>
          <div className="rp-intro"><h1>{category === "All" ? "slightly unsupervised..." : category}</h1><p>{category === "All" ? "questionable judgment." : `The latest approved ${category.toLowerCase()} posts from the community.`}</p></div>
          <div className="rp-feed-tools"><div className="rp-sort" aria-label="Feed sorting">{[{ label: "Hot", icon: Flame }, { label: "New", icon: Clock }, { label: "Top", icon: ChartNoAxesColumnIncreasing }].map(({ label, icon: Icon }) => <button key={label} className={sort === label ? "selected" : ""} aria-pressed={sort === label} onClick={() => setSort(label)}><Icon size={20} />{label}</button>)}</div>{sort === "Top" && <select aria-label="Top posts time period" value={period} onChange={(e) => setPeriod(e.target.value)}><option value="day">Today</option><option value="week">This week</option><option value="all">All time</option></select>}<span className="rp-feed-count">{visible.length} posts</span></div>
          {pendingTitle && <div className="rp-pending" role="status"><Check size={20} /><div><strong>Your demo submission is in the queue.</strong><p>“{pendingTitle}” would need staff approval before appearing here.</p></div><button aria-label="Dismiss submission notice" onClick={() => setPendingTitle("")}><X size={18} /></button></div>}
          {!visible.length && <section className="rp-card rp-empty"><Search size={30} /><h2>Nothing in this corner yet.</h2><p>Try another search or browse all posts.</p><button className="rp-primary" onClick={() => { setSearch(""); goFeed(); }}>Show all posts</button></section>}
          {visible.map((post) => <article className="rp-post rp-card" key={post.id} id={`demo-${post.id}`}>
            <div className="rp-votes"><button className={votes[post.id] === 1 ? "up selected" : "up"} aria-label={`Upvote ${post.title}`} aria-pressed={votes[post.id] === 1} onClick={() => setVotes((v) => ({ ...v, [post.id]: v[post.id] === 1 ? 0 : 1 }))}><ArrowUp size={26} strokeWidth={3} /></button><strong>{post.score + (votes[post.id] || 0)}</strong><button className={votes[post.id] === -1 ? "down selected" : "down"} aria-label={`Downvote ${post.title}`} aria-pressed={votes[post.id] === -1} onClick={() => setVotes((v) => ({ ...v, [post.id]: v[post.id] === -1 ? 0 : -1 }))}><ArrowDown size={26} strokeWidth={3} /></button></div>
            <div className="rp-post-content"><div className="rp-post-meta"><span className="rp-avatar">{post.avatar}</span><span>@{post.author}</span><span>·</span><button onClick={() => goFeed(post.category)}>{post.category}</button><span>·</span><span>{post.hours}h</span><span className="rp-demo-label">DEMO</span></div>
              <h2>{post.title}</h2>{post.image && <div className={`rp-demo-media rp-demo-${post.id}`}><img src="/prototype-assets/reference.png" alt={post.id === "game" ? "Illustrative game scene with a character running from a boulder" : "Illustrative cat at a laptop"} loading="lazy" /></div>}{post.video && <video className="rp-post-image" src={post.video} controls playsInline preload="metadata" />}{post.body && <p className="rp-post-body">{post.body}</p>}
              <div className="rp-post-actions"><button aria-expanded={comments === post.id} onClick={() => { setComments(comments === post.id ? null : post.id); setCommentDraft(""); }}><MessageCircle size={21} />{post.comments} comments</button><button onClick={() => void share(post.id)}><Share2 size={21} />Share</button><button className={flagged.includes(post.id) ? "is-flagged" : ""} onClick={() => { setFlagged((ids) => ids.includes(post.id) ? ids : [...ids, post.id]); setMessage("Demo flag recorded. No report was sent to staff."); }}><Flag size={19} />{flagged.includes(post.id) ? "Flagged" : "Flag"}</button></div>
              {comments === post.id && <section className="rp-comments" aria-label={`Comments on ${post.title}`}><p className="rp-note">Sample comments, local to this preview.</p>{post.replies.map((reply, i) => <div className="rp-comment" key={i}><span className="rp-avatar">{i % 2 ? "👾" : "🐶"}</span><p>{reply}</p></div>)}<form onSubmit={(event) => comment(event, post.id)}><label htmlFor={`reply-${post.id}`}>Add a demo comment</label><textarea id={`reply-${post.id}`} maxLength={500} value={commentDraft} onChange={(event) => setCommentDraft(event.target.value)} placeholder="Something worth adding?" required /><button className="rp-primary" disabled={!commentDraft.trim()}><Send size={17} />Comment</button></form></section>}
            </div>
          </article>)}
          <p className="rp-end">You’ve reached the end of the demo. Go touch some grass. 🌱</p>
        </>}
      </main>
      <aside className="rp-right-rail" aria-label="Community information">
        <section className="rp-card rp-welcome"><h2>Welcome to ROFFLE</h2><p className="rp-note">Submissions reviewed before appearing here.</p><button className="rp-primary" onClick={() => setComposer(true)}><Plus size={22} />Submit a post</button></section>
        <section className="rp-card rp-leaders"><div className="rp-card-heading"><h2><Trophy size={22} />Top contributors</h2></div><PeriodToggle value={rankPeriod} onChange={setRankPeriod} />{ranked.map((person, i) => <div className="rp-ranking" key={person.name}><b>{i + 1}</b><span className="rp-avatar">{person.avatar}</span><span>@{person.name}</span><strong>{person.points.toLocaleString()}</strong></div>)}<button className="rp-text-link" onClick={() => { setView("leaderboard"); setMobileMenu(false); window.scrollTo({ top: 0, behavior: "smooth" }); }}>View leaderboard <ArrowRight size={17} /></button></section>
        <section className="rp-card rp-rules"><h2><FileText size={21} />Community rules</h2><ol><li>Be funny.</li><li>Be decent.</li><li>No spam.</li></ol></section>
        <section className="rp-card rp-announcement"><div className="rp-post-meta"><span className="rp-avatar">🐟</span><strong>From @tooterfish</strong><span className="rp-announcement-time">1d ago</span></div><h3>ROFFLE.</h3><p>A bigger, weirder, funnier place for gamers, comedians and everyone in between. Thanks for being here.</p><a className="rp-text-link" href="/blog">Visit the blog <ArrowRight size={16} /></a></section>
        <p className="rp-rail-footer">ROFFLE prototype · All scores are demo data.<br /><a href="/">Return to the current site</a></p>
      </aside>
    </div>
    {message && <div className="rp-toast" role="status"><Check size={19} />{message}<button aria-label="Dismiss message" onClick={() => setMessage("")}><X size={16} /></button></div>}
    {composer && <Composer onClose={() => setComposer(false)} onSubmit={(title) => { setComposer(false); setPendingTitle(title); setSubmissionCount((count) => count + 1); setView("feed"); window.scrollTo({ top: 0, behavior: "smooth" }); }} />}
  </div>;
}
function PeriodToggle({ value, onChange }: { value: "weekly" | "all"; onChange: (next: "weekly" | "all") => void }) {
  return <div className="rp-period" aria-label="Leaderboard time period"><button aria-pressed={value === "weekly"} className={value === "weekly" ? "selected" : ""} onClick={() => onChange("weekly")}>This week</button><button aria-pressed={value === "all"} className={value === "all" ? "selected" : ""} onClick={() => onChange("all")}>All time</button></div>;
}
function Composer({ onClose, onSubmit }: { onClose: () => void; onSubmit: (title: string) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState("Text");
  useEffect(() => {
    const element = dialog.current;
    const previous = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element?.showModal();
    return () => { element?.close(); document.body.style.overflow = previousOverflow; previous?.focus(); };
  }, []);
  return <dialog className="rp rp-dialog" ref={dialog} onCancel={(event) => { event.preventDefault(); onClose(); }} onClick={(event) => { if (event.target === event.currentTarget) { const bounds = event.currentTarget.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose(); } }}>
    <header><div><span className="rp-eyebrow">A LITTLE LESS LURKING</span><h2>Give the internet something good.</h2></div><button className="rp-icon-button" aria-label="Close submission dialog" onClick={onClose}><X /></button></header>
    <form onSubmit={(event) => { event.preventDefault(); if (title.trim()) onSubmit(title.trim()); }}>
      <p className="rp-note">Prototype only. This form simulates the approval queue and does not upload or publish anything.</p>
      <div className="rp-composer-tabs">{["Text", "Image", "Video"].map((type) => <button type="button" key={type} className={kind === type ? "selected" : ""} aria-pressed={kind === type} onClick={() => setKind(type)}>{type}</button>)}</div>
      <label>Title<input required autoFocus maxLength={180} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Make it a good one." /></label>
      <label>Category<select defaultValue="Comedy">{categories.map(({ name }) => <option key={name}>{name}</option>)}</select></label>
      {kind !== "Text" && <label>{kind === "Video" ? "MP4 / WebM" : "Choose an image"}<input key={kind} type="file" accept={kind === "Video" ? "video/mp4,video/webm" : "image/*"} required /></label>}
      <label>{kind === "Text" ? "Your post" : "Caption (optional)"}<textarea placeholder="The context. The punchline. The questionable life choices." maxLength={2000} /></label>
      <footer><span>Staff approval before the front page.</span><button className="rp-primary" disabled={!title.trim()}><Send size={18} />Submit for review</button></footer>
    </form>
  </dialog>;
}
