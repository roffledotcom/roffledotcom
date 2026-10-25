import { createPortal } from "react-dom";
import { Pencil, Flag, Trash2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "../../lib/supabase";
export default function ForumContentActions({
  kind,
  id,
  title,
  body,
  role,
  loggedIn,
  onChanged,
  includeDelete = false,
  allowEdit = true,
  panelId,
  onDelete,
}: {
  kind: "thread" | "reply";
  id: string;
  title?: string;
  body: string | null;
  role: string | null;
  loggedIn: boolean;
  onChanged: () => void;
  includeDelete?: boolean;
  allowEdit?: boolean;
  panelId?: string;
  onDelete?: () => void;
}) {
  const [mode, setMode] = useState<"edit" | "flag" | null>(null),
    [draft, setDraft] = useState(body || ""),
    [heading, setHeading] = useState(title || ""),
    [reason, setReason] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  async function run(action: "edit" | "flag" | "delete") {
    if (busy) return;
    if (
      action === "delete" &&
      !confirm("Delete this " + kind + "? This cannot be undone.")
    )
      return;
    setBusy(true);
    setMessage("");
    try {
      const name =
        action === "edit"
          ? "edit_forum_content"
          : action === "flag"
            ? "flag_forum_content"
            : kind === "thread"
              ? "delete_forum_thread"
              : "delete_forum_reply";
      const args =
        action === "edit"
          ? { kind, target: id, new_title: heading, new_body: draft }
          : action === "flag"
            ? { kind, target: id, report_reason: reason }
            : kind === "thread"
              ? { target_thread: id }
              : { target_reply: id };
      const { error } = await supabase.rpc(name, args);
      if (error) throw error;
      setMode(null);
      setMessage(action === "flag" ? "Flagged for staff review." : "Saved.");
      onChanged();
    } catch (e) {
      setMessage(
        e instanceof Error
          ? e.message
          : (e as { message?: string }).message || "Action failed.",
      );
    } finally {
      setBusy(false);
    }
  }
  const panelContent = <div className="forum-action-panel">
      {mode && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void run(mode);
          }}
        >
          {mode === "edit" ? (
            <>
              {kind === "thread" && (
                <label>
                  Title
                  <input
                    required
                    maxLength={140}
                    value={heading}
                    onChange={(e) => setHeading(e.target.value)}
                  />
                </label>
              )}
              <label>
                Post text
                <textarea
                  required={kind === "thread" || Boolean(body)}
                  maxLength={5000}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                />
              </label>
            </>
          ) : (
            <label>
              Reason for flagging
              <textarea
                required
                maxLength={1000}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </label>
          )}
          <button disabled={busy} type="submit">
            {busy
              ? "Saving…"
              : mode === "flag"
                ? "Submit flag"
                : "Save changes"}
          </button>
          <button type="button" disabled={busy} onClick={() => setMode(null)}>
            Cancel
          </button>
        </form>
      )}
      {message && <p role="status">{message}</p>}
  </div>;
  return (
    <div className="forum-inline-actions">
      {allowEdit && role === "admin" && (
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            setDraft(body || "");
            setHeading(title || "");
            setMode(mode === "edit" ? null : "edit");
          }}
        >
          <Pencil size={13} aria-hidden="true" /> Edit
        </button>
      )}
      {includeDelete && (role === "admin" || role === "moderator") && (
        <button
          type="button"
          disabled={busy}
          onClick={() => onDelete ? onDelete() : void run("delete")}
        >
          <Trash2 size={13} aria-hidden="true" /> Delete
        </button>
      )}
      {loggedIn && (
        <button
          type="button"
          disabled={busy}
          onClick={() => setMode(mode === "flag" ? null : "flag")}
        >
          <Flag size={13} aria-hidden="true" /> Flag for review
        </button>
      )}
      {panelId && document.getElementById(panelId)
        ? createPortal(panelContent, document.getElementById(panelId)!)
        : panelContent}
    </div>
  );
}
