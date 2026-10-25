import { supabase } from "../lib/supabase";

import type {
  AccountStatus,
  AdminStats,
  AdminUser,
  ModerationPost,
  MyAccess,
  UserRole,
  FlaggedComment,
  RejectedPost,
} from "../types/admin";


/* ==========================================================
   ROFFLE
   ADMIN SERVICE
   ========================================================== */


export async function getMyAccess():
Promise<MyAccess | null> {
  const {
    data: {
      user,
    },
  } =
    await supabase.auth
      .getUser();

  if (!user) {
    return null;
  }

  const {
    data,
    error,
  } =
    await supabase
      .from("user_roles")
      .select(
        "role, account_status"
      )
      .eq(
        "user_id",
        user.id
      )
      .maybeSingle();

  if (error) {
    throw error;
  }

  return data as
    MyAccess | null;
}


export async function getAdminStats() {
  const {
    data,
    error,
  } =
    await supabase.rpc(
      "admin_dashboard_stats"
    );

  if (error) {
    throw error;
  }

  const first =
    Array.isArray(data)
      ? data[0]
      : data;

  return first as
    AdminStats;
}


export async function getModerationQueue() {
  const {
    data,
    error,
  } =
    await supabase
      .from("posts")
      .select(`
        id,
        user_id,
        post_type,
        title,
        body,
        youtube_url,
        image_url,
        media_asset_id,
        created_at,
        moderation_status,
        profiles!posts_user_id_fkey (
          username,
          display_name
        )
      `)
      .eq(
        "moderation_status",
        "pending"
      )
      .order(
        "created_at",
        {
          ascending:
            true,
        }
      );

  if (error) {
    throw error;
  }

  return (
    data ??
    []
  ) as unknown as
    ModerationPost[];
}


export async function moderatePost(
  postId: string,
  decision:
    | "approved"
    | "rejected",
  note?: string,
) {
  const {
    error,
  } =
    await supabase.rpc(
      "moderate_post",
      {
        target_post:
          postId,

        decision,

        note:
          note?.trim() ||
          null,
      }
    );

  if (error) {
    throw error;
  }
}


export async function getAdminUsers() {
  const {
    data,
    error,
  } =
    await supabase.rpc(
      "admin_list_users"
    );

  if (error) {
    throw error;
  }

  return (
    data ??
    []
  ) as AdminUser[];
}


export async function setUserRole(
  userId: string,
  role: UserRole,
) {
  const {
    error,
  } =
    await supabase.rpc(
      "admin_set_user_role",
      {
        target_user:
          userId,

        new_role:
          role,
      }
    );

  if (error) {
    throw error;
  }
}


export async function setAccountStatus(
  userId: string,
  status:
    AccountStatus,
) {
  const {
    error,
  } =
    await supabase.rpc(
      "admin_set_account_status",
      {
        target_user:
          userId,

        new_status:
          status,
      }
    );

  if (error) {
    throw error;
  }
}


/* ==========================================================
   FLAGGED COMMENTS
   ========================================================== */


export async function getFlaggedComments() {
  const {
    data,
    error,
  } =
    await supabase.rpc(
      "admin_flagged_comments"
    );

  if (error) {
    throw error;
  }

  return (
    data ??
    []
  ).map(
    (
      row:
        Record<string, any>
    ) => ({
      comment_id:
        row.comment_id,

      post_id:
        row.post_id,

      comment_body:
        row.comment_body ??
        null,

      comment_gif_url:
        row.comment_gif_url ??
        null,

      comment_user_id:
        row.comment_user_id,

      author_username:
        row.author_username ??
        null,

      author_display_name:
        row.author_display_name,

      report_count:
        Number(
          row.report_count ??
          0
        ),

      first_reported_at:
        row.first_reported_at,

      last_reported_at:
        row.last_reported_at,
    })
  ) as FlaggedComment[];
}


/* ==========================================================
   REJECTED POSTS
   ========================================================== */


export async function getRejectedPosts() {
  const {
    data,
    error,
  } =
    await supabase
      .from("posts")
      .select(`
        id,
        user_id,
        post_type,
        title,
        body,
        youtube_url,
        image_url,
        media_asset_id,
        created_at,
        moderated_at,
        moderation_note,
        moderation_status,
        profiles!posts_user_id_fkey (
          username,
          display_name
        )
      `)
      .eq(
        "moderation_status",
        "rejected"
      )
      .order(
        "moderated_at",
        {
          ascending:
            false,
        }
      );

  if (error) {
    throw error;
  }

  return (
    data ??
    []
  ) as unknown as
    RejectedPost[];
}


export async function restoreRejectedPost(
  postId: string,
) {
  await moderatePost(
    postId,
    "approved",
    "Restored from rejected posts."
  );
}


export async function permanentlyDeleteRejectedPost(
  postId: string,
) {
  const {
    error,
  } =
    await supabase.rpc(
      "admin_delete_rejected_post",
      {
        target_post:
          postId,
      }
    );

  if (error) {
    throw error;
  }
}
