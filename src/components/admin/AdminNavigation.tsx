import { useState } from "react";
import { ArchiveX, ArrowDown, ArrowUp, BookOpen, FileClock, Flag, GripVertical, RotateCcw, Settings, ShieldCheck, Tag, Users } from "lucide-react";
import type { Tab } from "../../pages/admin/Admin";
import type { AdminStats } from "../../types/admin";
import { moveMenuItem, restoreMenuOrder } from "../../lib/menu-order.mjs";

const items = [
  { id: "dashboard", label: "Overview", icon: ShieldCheck },
  { id: "moderation", label: "Post moderation", icon: FileClock },
  { id: "forum-flags", label: "Forum reports", icon: Flag },
  { id: "rejected", label: "Rejected posts", icon: ArchiveX },
  { id: "taxonomy", label: "Categories & tags", icon: Tag },
  { id: "blog", label: "Blog", icon: BookOpen, admin: true },
  { id: "users", label: "People", icon: Users, admin: true },
  { id: "forum-settings", label: "Forum settings", icon: Settings, admin: true },
] as const;
const defaults = items.map((item) => item.id);
const storageKey = "roffle.admin.menu-order.v1";
export default function AdminNavigation({ tab, onSelect, role, stats }: {
  tab: Tab; onSelect: (tab: Tab) => void; role: string; stats: AdminStats | null;
}) {
  const [order, setOrder] = useState<string[]>(() => {
    try { return restoreMenuOrder(JSON.parse(localStorage.getItem(storageKey) || "null"), defaults); }
    catch { return [...defaults]; }
  });
  const [dragged, setDragged] = useState<string | null>(null);
  const [target, setTarget] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [arranging, setArranging] = useState(false);
  const visible = order.map((id) => items.find((item) => item.id === id)!).filter((item) => !("admin" in item) || role === "admin");
  function save(next: string[], message: string) {
    setOrder(next);
    try { localStorage.setItem(storageKey, JSON.stringify(next)); setAnnouncement(message); }
    catch { setAnnouncement(`${message} Storage is unavailable, so this order lasts until you reload.`); }
  }
  function move(id: string, direction: number) {
    const i = visible.findIndex((item) => item.id === id);
    const neighbor = visible[i + direction];
    if (neighbor) save(moveMenuItem(order, id, neighbor.id, direction > 0), "Menu order updated.");
  }
  return <aside className="admin-nav" aria-label="Admin navigation">
    <div className="admin-nav-heading"><span>WORKSPACE</span><button className="admin-arrange-toggle" aria-pressed={arranging} onClick={() => setArranging(!arranging)}>{arranging ? "Done" : "Reorder"}</button></div>
    <p className="admin-nav-hint">Drag a handle to reorder. The orange line marks the new position.</p>
    <nav aria-label="Admin sections" onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setTarget(null); }}>
      {visible.map((item, index) => {
        const Icon = item.icon;
        const count = item.id === "moderation" ? stats?.pending_posts : item.id === "rejected" ? stats?.rejected_posts : 0;
        return <div key={item.id} className={`admin-nav-row ${dragged === item.id ? "is-dragging" : ""} ${target === item.id ? "drop-after" : ""} ${target === `before:${item.id}` ? "drop-before" : ""}`}
          onDragOver={(event) => {
            if (!dragged || dragged === item.id) return;
            event.preventDefault(); event.dataTransfer.dropEffect = "move";
            const rect = event.currentTarget.getBoundingClientRect();
            setTarget(event.clientY < rect.top + rect.height / 2 ? `before:${item.id}` : item.id);
          }}
          onDrop={(event) => {
            event.preventDefault();
            if (dragged && target) save(moveMenuItem(order, dragged, item.id, !target.startsWith("before:")), `${items.find((entry) => entry.id === dragged)?.label} moved.`);
            setDragged(null); setTarget(null);
          }}>
          <button className="admin-drag-handle" draggable aria-label={`Drag ${item.label}. Use Alt and arrow keys to reorder.`}
            onKeyDown={(event) => { if (event.altKey && (event.key === "ArrowUp" || event.key === "ArrowDown")) { event.preventDefault(); move(item.id, event.key === "ArrowUp" ? -1 : 1); } }}
            onDragStart={(event) => { event.dataTransfer.setData("text/plain", item.id); event.dataTransfer.effectAllowed = "move"; setDragged(item.id); }}
            onDragEnd={() => { setDragged(null); setTarget(null); }}><GripVertical size={16} /></button>
          <button className={`admin-nav-link ${tab === item.id ? "active" : ""}`} aria-current={tab === item.id ? "page" : undefined} onClick={() => onSelect(item.id)}><Icon size={18} /><span>{item.label}</span>{!!count && <span className="admin-nav-count">{count}</span>}</button>
          {arranging && <div className="admin-menu-movers"><button disabled={index === 0} aria-label={`Move ${item.label} up`} onClick={() => move(item.id, -1)}><ArrowUp size={14} /></button><button disabled={index === visible.length - 1} aria-label={`Move ${item.label} down`} onClick={() => move(item.id, 1)}><ArrowDown size={14} /></button></div>}
        </div>;
      })}
    </nav>
    <button className="admin-menu-reset" onClick={() => save([...defaults], "Default menu order restored.")}><RotateCcw size={14} /> Reset menu order</button>
    <span className="admin-nav-hint">Saved in this browser.</span>
    <span className="sr-only" role="status">{announcement}</span>
  </aside>;
}
