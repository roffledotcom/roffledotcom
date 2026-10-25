import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import ForumContentActions from "../posts/ForumContentActions";
type Settings = {
  title: string;
  description: string;
  allow_threads: boolean;
  allow_replies: boolean;
};
type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  active: boolean;
};
type Report = {
  id: string;
  thread_id: string | null;
  reply_id: string | null;
  target_kind: "thread" | "reply";
  target_id: string;
  reason: string;
  content_snapshot: string;
  title_snapshot: string | null;
  created_at: string;
  reporter_id: string;
  reporter_label?: string;
};
const blank = {
  id: "",
  name: "",
  slug: "",
  description: "",
  sort_order: 100,
  active: true,
};
export default function ForumAdmin({
  role,
  settingsOnly = false,
}: {
  role: "admin" | "moderator" | "user";
  settingsOnly?: boolean;
}) {
  const [reports, setReports] = useState<Report[]>([]),
    [settings, setSettings] = useState<Settings | null>(null),
    [categories, setCategories] = useState<Category[]>([]),
    [category, setCategory] = useState<Category>(blank),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    try {
      if (settingsOnly) {
        if (role !== "admin") return;
        const [s, c] = await Promise.all([
          supabase.from("forum_settings").select("*").single(),
          supabase.from("forum_categories").select("*").order("sort_order"),
        ]);
        if (s.error) throw s.error;
        if (c.error) throw c.error;
        setSettings(s.data);
        setCategories(c.data || []);
      } else {
        const r = await supabase
          .from("forum_reports")
          .select("*")
          .eq("status", "open")
          .order("created_at", { ascending: false });
        if (r.error) throw r.error;
        const rows: Report[] = r.data || [];
        const ids = [...new Set(rows.map((report) => report.reporter_id).filter(Boolean))];
        const names = new Map<string, string>();
        if (ids.length) {
          const profiles = await supabase.from("profiles").select("id, username, display_name").in("id", ids);
          if (profiles.error) throw profiles.error;
          for (const profile of profiles.data || []) {
            names.set(profile.id, profile.username ? `@${profile.username}` : profile.display_name || "ROFFLE member");
          }
        }
        setReports(rows.map((report) => ({ ...report, reporter_label: names.get(report.reporter_id) || "Unavailable account" })));
      }
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [role, settingsOnly]);
  useEffect(() => {
    void load();
  }, [load]);
  async function rpc(name: string, args: Record<string, unknown>) {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      const { error } = await supabase.rpc(name, args);
      if (error) throw error;
      setMessage("Saved.");
      await load();
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (settingsOnly && role !== "admin") return <p>Admin access required.</p>;
  return (
    <section className="forum-admin">
      <div className="admin-section-heading"><span className="admin-eyebrow">{settingsOnly ? "COMMUNITY SETTINGS" : "COMMUNITY MODERATION"}</span>
      <h1>{settingsOnly ? "Forum settings" : "Flagged forum posts"}</h1>
      <p>{settingsOnly ? "Shape the spaces where ROFFLE talks." : "A little context before you make the call."}</p></div>
      {message && <p role="status">{message}</p>}
      {loading && <p>Loading…</p>}
      {settingsOnly ? (
        <>
          {settings && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void rpc("admin_save_forum_settings", {
                  forum_title: settings.title,
                  forum_description: settings.description,
                  threads_enabled: settings.allow_threads,
                  replies_enabled: settings.allow_replies,
                });
              }}
            >
              <label>
                Forum title
                <input
                  required
                  maxLength={100}
                  value={settings.title}
                  onChange={(e) =>
                    setSettings({ ...settings, title: e.target.value })
                  }
                />
              </label>
              <label>
                Description
                <textarea
                  maxLength={1000}
                  value={settings.description}
                  onChange={(e) =>
                    setSettings({ ...settings, description: e.target.value })
                  }
                />
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={settings.allow_threads}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      allow_threads: e.target.checked,
                    })
                  }
                />{" "}
                Allow new threads
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={settings.allow_replies}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      allow_replies: e.target.checked,
                    })
                  }
                />{" "}
                Allow replies
              </label>
              <button disabled={busy}>Save forum settings</button>
            </form>
          )}
          <h2>Categories</h2>
          <p>
            Disabling a category hides it from category listings. Existing
            thread links remain accessible. Categories with threads cannot be
            deleted.
          </p>
          <div>
            {categories.map((c) => (
              <article key={c.id}>
                <strong>{c.name}</strong> ({c.active ? "active" : "disabled"}){" "}
                <button disabled={busy} onClick={() => setCategory(c)}>
                  Edit category
                </button>
                <button
                  disabled={busy}
                  onClick={() => {
                    if (confirm("Delete this empty category?"))
                      void rpc("admin_delete_forum_category", {
                        category: c.id,
                      });
                  }}
                >
                  Delete category
                </button>
              </article>
            ))}
          </div>
          <h3>{category.id ? "Edit category" : "New category"}</h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void rpc("admin_save_forum_category", {
                category: category.id || null,
                category_name: category.name,
                category_slug: category.slug,
                category_description: category.description || "",
                category_order: category.sort_order,
                category_active: category.active,
              });
            }}
          >
            <label>
              Name
              <input
                required
                maxLength={60}
                value={category.name}
                onChange={(e) =>
                  setCategory({ ...category, name: e.target.value })
                }
              />
            </label>
            <label>
              Slug
              <input
                required
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                value={category.slug}
                onChange={(e) =>
                  setCategory({ ...category, slug: e.target.value })
                }
              />
            </label>
            <label>
              Description
              <textarea
                value={category.description || ""}
                onChange={(e) =>
                  setCategory({ ...category, description: e.target.value })
                }
              />
            </label>
            <label>
              Sort order
              <input
                type="number"
                required
                value={category.sort_order}
                onChange={(e) =>
                  setCategory({
                    ...category,
                    sort_order: Number(e.target.value),
                  })
                }
              />
            </label>
            <label>
              <input
                type="checkbox"
                checked={category.active}
                onChange={(e) =>
                  setCategory({ ...category, active: e.target.checked })
                }
              />{" "}
              Active
            </label>
            <button disabled={busy}>Save category</button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setCategory(blank)}
            >
              New / clear
            </button>
          </form>
        </>
      ) : (
        <>
          {!loading && !reports.length && <div className="admin-empty"><strong>All clear.</strong><p>No open forum reports. Enjoy the peace while it lasts.</p></div>}
          {reports.map((r) => (
            <article className="forum-report-card" key={r.id}>
              <h2>{r.title_snapshot || "Forum reply"}</h2>
              <p>
                {r.target_kind} · {new Date(r.created_at).toLocaleString()}
              </p>
              <p>
                <strong>Reported content:</strong> {r.content_snapshot}
              </p>
              <p>
                <strong>Reason for review:</strong> {r.reason}
              </p>
              <p className="forum-reporter"><strong>Reported by</strong> {r.reporter_label}</p>
              {r.thread_id ? (
                <>
                  <a href={"/forum/t/" + r.thread_id}>
                    Open thread to review or edit
                  </a>
                  <ForumContentActions
                    kind={r.target_kind}
                    id={r.target_id}
                    body={r.content_snapshot}
                    title={r.title_snapshot || ""}
                    role={role}
                    allowEdit={false}
                    loggedIn={false}
                    includeDelete
                    onChanged={() => void load()}
                  />
                </>
              ) : (
                <p>The original content has been deleted.</p>
              )}
              <button
                disabled={busy}
                onClick={() =>
                  void rpc("resolve_forum_report", { report: r.id })
                }
              >
                Dismiss / mark reviewed
              </button>
            </article>
          ))}
        </>
      )}
    </section>
  );
}
