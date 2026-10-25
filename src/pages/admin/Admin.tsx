import ForumAdmin from "../../components/admin/ForumAdmin";
import {
  useEffect,
  useState,
} from "react";

import {
  ArchiveX,
  ArrowLeft,
  BookOpen,
  FileClock,
  ShieldCheck,
  Tag,
  Users,
} from "lucide-react";

import AdminUsers from "../../components/admin/AdminUsers";
import BlogManager from "../../components/admin/BlogManager";
import FlaggedComments from "../../components/admin/FlaggedComments";
import ModerationQueue from "../../components/admin/ModerationQueue";
import RejectedPosts from "../../components/admin/RejectedPosts";
import TaxonomyManager from "../../components/admin/TaxonomyManager";

import {
  getAdminStats,
  getMyAccess,
} from "../../services/admin";

import type {
  AdminStats,
  MyAccess,
} from "../../types/admin";

import "./Admin.css";


/* ==========================================================
   ROFFLE
   ADMIN
   ========================================================== */


type Tab =
  | "dashboard"
  | "moderation"
  | "rejected"
  | "taxonomy"
  | "blog"
  | "users"
  | "forum-settings"
  | "forum-flags";


export default function Admin() {
  const [
    access,
    setAccess,
  ] =
    useState<MyAccess | null>(
      null
    );

  const [
    stats,
    setStats,
  ] =
    useState<AdminStats | null>(
      null
    );

  const [
    tab,
    setTab,
  ] =
    useState<Tab>(
      "dashboard"
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null
    );


  const refreshStats =
    async () => {
      try {
        setStats(
          await getAdminStats()
        );
      } catch (
        nextError
      ) {
        setError(
          nextError
            instanceof Error
            ? nextError.message
            : "Could not refresh admin stats."
        );
      }
    };


  useEffect(() => {
    let mounted = true;

    const load =
      async () => {
        try {
          const nextAccess =
            await getMyAccess();

          if (!mounted) {
            return;
          }

          setAccess(
            nextAccess
          );

          if (
            !nextAccess ||
            (
              nextAccess.role !==
                "moderator" &&
              nextAccess.role !==
                "admin"
            ) ||
            nextAccess.account_status !==
              "active"
          ) {
            return;
          }

          const nextStats =
            await getAdminStats();

          if (mounted) {
            setStats(
              nextStats
            );
          }
        } catch (
          nextError
        ) {
          setError(
            nextError
              instanceof Error
              ? nextError.message
              : "ROFFLE admin could not load."
          );
        } finally {
          if (mounted) {
            setLoading(
              false
            );
          }
        }
      };

    void load();

    return () => {
      mounted = false;
    };
  }, []);


  if (loading) {
    return (
      <main className="admin-gate">
        Loading ROFFLE admin...
      </main>
    );
  }


  const allowed =
    access &&
    (
      access.role ===
        "moderator" ||
      access.role ===
        "admin"
    ) &&
    access.account_status ===
      "active";


  if (!allowed) {
    return (
      <main className="admin-gate">
        <ShieldCheck
          size={28}
        />

        <h1>
          Nope.
        </h1>

        <p>
          This part of ROFFLE is for moderators and admins.
        </p>

        <a href="/">
          Back to the nonsense
        </a>
      </main>
    );
  }


  return (
    <div className="admin-page">
      <header className="admin-topbar">
        <div className="admin-topbar-inner">
          <a
            className="admin-brand"
            href="/admin"
          >
            <span>
              R
            </span>

            <strong>
              ROFFLE ADMIN
            </strong>
          </a>

          <a
            className="admin-back-link"
            href="/"
          >
            <ArrowLeft
              size={14}
            />

            Back to ROFFLE
          </a>
        </div>
      </header>

      <div className="admin-shell">
        <aside className="admin-nav">
          <button
            className={
              tab ===
                "dashboard"
                ? "active"
                : ""
            }
            onClick={() => {
              setTab(
                "dashboard"
              );
            }}
          >
            <ShieldCheck
              size={16}
            />

            Dashboard
          </button>

          <button
            className={
              tab ===
                "moderation"
                ? "active"
                : ""
            }
            onClick={() => {
              setTab(
                "moderation"
              );
            }}
          >
            <FileClock
              size={16}
            />

            Moderation

            {stats &&
              stats.pending_posts >
                0 && (
              <span className="admin-nav-count">
                {stats.pending_posts}
              </span>
            )}
          </button>

          <button
            className={
              tab ===
                "rejected"
                ? "active"
                : ""
            }
            onClick={() => {
              setTab(
                "rejected"
              );
            }}
          >
            <ArchiveX
              size={16}
            />

            Rejected

            {stats &&
              stats.rejected_posts >
                0 && (
              <span className="admin-nav-count rejected">
                {stats.rejected_posts}
              </span>
            )}
          </button>

          <button
            className={
              tab ===
                "taxonomy"
                ? "active"
                : ""
            }
            onClick={() => {
              setTab(
                "taxonomy"
              );
            }}
          >
            <Tag
              size={16}
            />

            Categories & Tags
          </button>

          {access.role ===
            "admin" && (
            <button
              className={
                tab ===
                  "blog"
                  ? "active"
                  : ""
              }
              onClick={() => {
                setTab(
                  "blog"
                );
              }}
            >
              <BookOpen
                size={16}
              />

              Blog
            </button>
          )}

          {access.role ===
            "admin" && (
            <button
              className={
                tab ===
                  "users"
                  ? "active"
                  : ""
              }
              onClick={() => {
                setTab(
                  "users"
                );
              }}
            >
              <Users
                size={16}
              />

              Users
            </button>
          )}
          <button className={tab === "forum-flags" ? "active" : ""} onClick={() => setTab("forum-flags")}>Flagged forum posts</button>
          {access.role === "admin" && <button className={tab === "forum-settings" ? "active" : ""} onClick={() => setTab("forum-settings")}>Forum settings</button>}
        </aside>

        <main className="admin-content">
          {tab === "forum-flags" && <ForumAdmin role={access.role} />}
          {tab === "forum-settings" && access.role === "admin" && <ForumAdmin role={access.role} settingsOnly />}
          {error && (
            <div className="admin-error">
              {error}
            </div>
          )}

          {tab ===
            "dashboard" && (
            <>
              <div className="admin-page-title">
                <span className="admin-eyebrow">
                  ROFFLE CONTROL ROOM
                </span>

                <h1>
                  Dashboard
                </h1>
              </div>

              <div className="admin-stat-grid">
                <div className="admin-stat">
                  <span>
                    Users
                  </span>

                  <strong>
                    {stats?.total_users ??
                      0}
                  </strong>
                </div>

                <div className="admin-stat">
                  <span>
                    Posts
                  </span>

                  <strong>
                    {stats?.total_posts ??
                      0}
                  </strong>
                </div>

                <div className="admin-stat attention">
                  <span>
                    Pending
                  </span>

                  <strong>
                    {stats?.pending_posts ??
                      0}
                  </strong>
                </div>

                <div className="admin-stat">
                  <span>
                    Approved
                  </span>

                  <strong>
                    {stats?.approved_posts ??
                      0}
                  </strong>
                </div>
              </div>

              <div className="admin-dashboard-queue">
                <ModerationQueue
                  limit={5}
                  onChanged={() => {
                    void refreshStats();
                  }}
                  onViewAll={() => {
                    setTab(
                      "moderation"
                    );
                  }}
                />
              </div>

              <div className="admin-dashboard-queue">
                <FlaggedComments
                  limit={8}
                />
              </div>
            </>
          )}

          {tab ===
            "moderation" && (
            <ModerationQueue
              onChanged={() => {
                void refreshStats();
              }}
            />
          )}

          {tab ===
            "rejected" && (
            <RejectedPosts />
          )}

          {tab ===
            "taxonomy" && (
            <TaxonomyManager />
          )}

          {tab ===
            "blog" &&
            access.role ===
              "admin" && (
            <BlogManager />
          )}

          {tab ===
            "users" &&
            access.role ===
              "admin" && (
            <AdminUsers />
          )}
        </main>
      </div>
    </div>
  );
}
