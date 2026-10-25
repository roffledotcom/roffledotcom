import {
  lazy,
  Suspense,
  useEffect,
  useState,
} from "react";

import {
  ArrowRight,
  LockKeyhole,
  Sparkles,
} from "lucide-react";

import { supabase } from "./lib/supabase";

import PasswordAuthForm from "./components/auth/PasswordAuthForm";

import "./AppV2.css";

const CommunityPrototype = lazy(() => import("./prototype/Prototype"));

const AppV2 = lazy(() => import("./AppV2"));

const Admin = lazy(
  () =>
    import(
      "./pages/admin/Admin"
    )
);


const Forum = lazy(
  () =>
    import(
      "./pages/forum/Forum"
    )
);


const Blog = lazy(
  () =>
    import(
      "./pages/blog/Blog"
    )
);


/* ==========================================================
   ROFFLE
   APP ENTRY / LOGIN
   ========================================================== */


function PrototypeLoading() {
  return (
    <main className="roffle-auth-loading">
      <span>Loading ROFFLE...</span>
    </main>
  );
}


function RoffleLogo() {
  return (
    <a
      className="roffle-logo"
      href="/"
      aria-label="ROFFLE home"
    >
      <span className="logo-mark">
        R
      </span>

      <span className="logo-word">
        ROFFLE
      </span>
    </a>
  );
}



function GoogleLogo() {
  return (
    <svg
      className="auth-provider-logo"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-1.99 3.02v2.51h3.22c1.89-1.74 2.99-4.31 2.99-7.38Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.97-.89 6.62-2.4l-3.22-2.51c-.9.6-2.04.96-3.4.96-2.6 0-4.8-1.75-5.59-4.11H3.08v2.58A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.41 13.94A6.01 6.01 0 0 1 6.1 12c0-.67.11-1.32.31-1.94V7.48H3.08A10 10 0 0 0 2 12c0 1.61.39 3.13 1.08 4.52l3.33-2.58Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.95c1.47 0 2.79.5 3.82 1.49l2.87-2.87C16.96 2.96 14.7 2 12 2a10 10 0 0 0-8.92 5.48l3.33 2.58C7.2 7.7 9.4 5.95 12 5.95Z"
      />
    </svg>
  );
}


function DiscordLogo() {
  return (
    <svg
      className="auth-provider-logo discord-logo"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        d="M19.54 5.32A16.7 16.7 0 0 0 15.44 4l-.5 1.03a15.3 15.3 0 0 0-5.87 0L8.56 4a16.8 16.8 0 0 0-4.11 1.33C1.85 9.17 1.15 12.9 1.5 16.58a16.5 16.5 0 0 0 5.03 2.54l1.2-1.65a10.5 10.5 0 0 1-1.89-.9l.46-.35a12 12 0 0 0 11.4 0l.47.35c-.6.35-1.23.65-1.9.9l1.2 1.65a16.5 16.5 0 0 0 5.03-2.54c.4-4.27-.68-7.97-2.46-11.26ZM8.34 14.72c-1.08 0-1.97-.99-1.97-2.2 0-1.22.87-2.2 1.97-2.2 1.1 0 1.99 1 1.97 2.2 0 1.21-.87 2.2-1.97 2.2Zm7.32 0c-1.08 0-1.97-.99-1.97-2.2 0-1.22.87-2.2 1.97-2.2 1.1 0 1.99 1 1.97 2.2 0 1.21-.87 2.2-1.97 2.2Z"
      />
    </svg>
  );
}


function LoginPage() {
  const [
    signingIn,
    setSigningIn,
  ] = useState<
    "google" | "discord" | null
  >(null);

  const [
    signedIn,
    setSignedIn,
  ] = useState(false);

  const [
    authError,
    setAuthError,
  ] = useState<string | null>(
    null
  );


  useEffect(() => {
    let active = true;

    void supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) {
          return;
        }

        setSignedIn(
          Boolean(data.session)
        );
      });

    const {
      data: {
        subscription,
      },
    } =
      supabase.auth.onAuthStateChange(
        (_event, session) => {
          if (!active) {
            return;
          }

          setSignedIn(
            Boolean(session)
          );
        }
      );

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);


  const signInWithProvider =
    async (
      provider:
        | "google"
        | "discord"
    ) => {
      setSigningIn(provider);
      setAuthError(null);

      const { error } =
        await supabase.auth
          .signInWithOAuth({
            provider,

            options: {
              redirectTo:
                `${window.location.origin}/`,
            },
          });

      if (error) {
        setAuthError(
          error.message
        );

        setSigningIn(null);
      }
    };


  const continueToRoffle =
    () => {
      window.location.assign(
        "/"
      );
    };


  return (
    <div className="roffle-auth-page">
      <style>
        {`
          .roffle-auth-page {
            min-height: 100vh;
            background:
              radial-gradient(
                circle at 85% 8%,
                rgba(255, 90, 31, 0.10),
                transparent 31rem
              ),
              radial-gradient(
                circle at 10% 95%,
                rgba(17, 17, 17, 0.035),
                transparent 30rem
              ),
              var(--bg);
          }

          .roffle-auth-header {
            background: rgba(17, 17, 17, 0.97);
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          }

          .roffle-auth-header-shell {
            width: min(1120px, calc(100% - 40px));
            height: 72px;
            margin: 0 auto;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }

          .roffle-auth-browse {
            color: #b8b8b4;
            font-size: 16px;
            font-weight: 700;
            transition: color 140ms ease;
          }

          .roffle-auth-browse:hover {
            color: #fff;
          }

          .roffle-auth-main {
            width: min(1120px, calc(100% - 40px));
            min-height: calc(100vh - 72px);
            margin: 0 auto;
            padding: 64px 0;
            display: grid;
            grid-template-columns: minmax(0, 1.1fr) minmax(360px, 430px);
            align-items: center;
            gap: 88px;
          }

          .roffle-auth-intro {
            max-width: 610px;
          }

          .roffle-auth-kicker {
            margin-bottom: 14px;
            display: inline-flex;
            align-items: center;
            gap: 7px;
            color: var(--accent);
            font-size: 14px;
            font-weight: 900;
            letter-spacing: 0.15em;
            text-transform: uppercase;
          }

          .roffle-auth-intro h1 {
            max-width: 590px;
            margin: 0;
            color: #171717;
            font-size: clamp(50px, 6.5vw, 82px);
            font-weight: 880;
            line-height: 0.92;
            letter-spacing: -0.065em;
          }

          .roffle-auth-intro p {
            max-width: 500px;
            margin: 25px 0 0;
            color: var(--text-soft);
            font-size: 16px;
            line-height: 1.7;
          }

          .roffle-auth-caption {
            margin-top: 30px;
            display: flex;
            align-items: center;
            gap: 8px;
            color: var(--text-muted);
            font-size: 16px;
            font-weight: 650;
          }

          .roffle-auth-caption span:first-child {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: var(--accent);
            box-shadow: 0 0 0 4px var(--accent-soft);
          }

          .roffle-login-card {
            padding: 34px;
            border: 1px solid var(--border);
            border-radius: 22px;
            background: #fff;
            box-shadow:
              0 3px 12px rgba(0, 0, 0, 0.025),
              0 28px 70px rgba(0, 0, 0, 0.05);
          }

          .roffle-login-orb {
            width: 52px;
            height: 52px;
            margin-bottom: 24px;
            display: grid;
            place-items: center;
            border-radius: 15px;
            background: #111;
            color: #fff;
          }

          .roffle-login-card h2 {
            margin: 0;
            color: #171717;
            font-size: 29px;
            font-weight: 850;
            letter-spacing: -0.045em;
          }

          .roffle-login-card > p {
            margin: 9px 0 25px;
            color: var(--text-soft);
            font-size: 16px;
            line-height: 1.6;
          }

          .roffle-google-button,
          .roffle-discord-button {
            width: 100%;
            min-height: 50px;
            padding: 0 16px;

            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;

            border-radius: 12px;

            font-size: 16px;
            font-weight: 800;

            transition:
              transform 140ms ease,
              border-color 140ms ease,
              background 140ms ease,
              box-shadow 140ms ease;
          }

          .roffle-google-button {
            border: 1px solid #d8dadf;
            background: #fff;
            color: #202124;
            box-shadow:
              0 1px 2px rgba(0, 0, 0, 0.04),
              0 6px 18px rgba(0, 0, 0, 0.035);
          }

          .roffle-google-button:hover {
            transform: translateY(-1px);
            border-color: #c3c7ce;
            background: #fafafa;
            box-shadow:
              0 2px 4px rgba(0, 0, 0, 0.05),
              0 8px 22px rgba(0, 0, 0, 0.05);
          }

          .roffle-discord-button {
            margin-top: 11px;

            border: 1px solid #5865f2;
            background: #5865f2;
            color: #fff;
            box-shadow:
              0 8px 24px rgba(88, 101, 242, 0.22);
          }

          .roffle-discord-button:hover {
            transform: translateY(-1px);
            border-color: #4752c4;
            background: #4752c4;
            box-shadow:
              0 10px 28px rgba(88, 101, 242, 0.27);
          }

          .roffle-google-button:disabled,
          .roffle-discord-button:disabled {
            opacity: 0.62;
            cursor: wait;
            transform: none;
          }

          .auth-provider-logo {
            width: 20px;
            height: 20px;

            flex: 0 0 auto;

            display: block;
          }

          .discord-logo {
            width: 22px;
            height: 22px;
          }

          .roffle-auth-divider {
            margin: 23px 0;
            display: flex;
            align-items: center;
            gap: 12px;
            color: #aaa;
            font-size: 14px;
            font-weight: 800;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }

          .roffle-auth-divider::before,
          .roffle-auth-divider::after {
            content: "";
            height: 1px;
            flex: 1;
            background: var(--border);
          }

          .roffle-auth-guest {
            width: 100%;
            min-height: 46px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            border: 1px solid var(--border);
            border-radius: 12px;
            background: var(--surface-soft);
            color: #282828;
            padding: 0 15px;
            font-size: 16px;
            font-weight: 750;
          }

          .roffle-auth-guest:hover {
            border-color: #c9c9c3;
            background: #fff;
          }

          .roffle-auth-error {
            margin: 15px 0 0;
            padding: 11px 12px;
            border: 1px solid rgba(210, 60, 35, 0.18);
            border-radius: 10px;
            background: #fff3ef;
            color: #b23820;
            font-size: 16px;
            line-height: 1.45;
          }

          .roffle-auth-footnote {
            margin-top: 20px;
            display: flex;
            align-items: flex-start;
            gap: 8px;
            color: #999994;
            font-size: 14px;
            line-height: 1.5;
          }

          .roffle-auth-footnote svg {
            flex: 0 0 auto;
            margin-top: 1px;
          }

          .roffle-auth-loading {
            min-height: 100vh;
            display: grid;
            place-items: center;
            background: #0d0d0e;
            color: #8a8a8f;
            font-size: 16px;
            font-weight: 700;
          }

          @media (max-width: 850px) {
            .roffle-auth-main {
              grid-template-columns: 1fr;
              gap: 44px;
              padding: 46px 0 64px;
            }

            .roffle-auth-intro {
              max-width: 700px;
            }

            .roffle-auth-intro h1 {
              font-size: clamp(48px, 12vw, 72px);
            }

            .roffle-login-card {
              width: 100%;
              max-width: 520px;
            }
          }

          @media (max-width: 520px) {
            .roffle-auth-header-shell,
            .roffle-auth-main {
              width: min(100% - 28px, 1120px);
            }

            .roffle-auth-main {
              padding-top: 36px;
            }

            .roffle-auth-browse {
              font-size: 16px;
            }

            .roffle-auth-intro h1 {
              font-size: 48px;
            }

            .roffle-auth-intro p {
              font-size: 16px;
            }

            .roffle-login-card {
              padding: 25px 20px;
              border-radius: 18px;
            }
          }
        `}
      </style>

      <header className="roffle-auth-header">
        <div className="roffle-auth-header-shell">
          <RoffleLogo />
        </div>
      </header>

      <main className="roffle-auth-main">
        <section className="roffle-auth-intro">
          <div className="roffle-auth-kicker">
            <Sparkles size={14} />
            wtf internet
          </div>

          <h1>
            Welcome back little guy! 
          </h1>

          <p>
            Sign in to post weird stuff,
            questionable videos, and things
            you probably should have kept to
            yourself, in your demented little brain.          </p>

          <div className="roffle-auth-caption">
            <span />

            <span>
              Lurking is an option. But we judge you. 
            </span>
          </div>
        </section>

        <section className="roffle-login-card">
          <div className="roffle-login-orb">
            <LockKeyhole size={22} />
          </div>

          <h2>
            Log in to ROFFLE
          </h2>

          <p>
            One click. No elaborate onboarding
            ritual. We have nonsense to get to.
          </p>

          {signedIn && (
            <>
              <button
                className="roffle-continue-button"
                type="button"
                onClick={
                  continueToRoffle
                }
              >
                Continue to ROFFLE

                <ArrowRight size={17} />
              </button>

              <div className="roffle-auth-divider">
                or use another login
              </div>
            </>
          )}

          <button
            className="roffle-google-button"
            type="button"
            disabled={
              signingIn !== null
            }
            onClick={() => {
              void signInWithProvider(
                "google"
              );
            }}
          >
            <GoogleLogo />

            {signingIn === "google"
              ? "Opening Google..."
              : "Continue with Google"}
          </button>

          <button
            className="roffle-discord-button"
            type="button"
            disabled={
              signingIn !== null
            }
            onClick={() => {
              void signInWithProvider(
                "discord"
              );
            }}
          >
            <DiscordLogo />

            {signingIn === "discord"
              ? "Opening Discord..."
              : "Continue with Discord"}
          </button>

          <div className="roffle-auth-divider">
            or use email
          </div>

          <PasswordAuthForm />

          <div className="roffle-auth-divider">
            or
          </div>

          <a
            className="roffle-auth-guest"
            href="/"
          >
            Lurk, so mommy and daddy don't know...

            <ArrowRight size={16} />
          </a>

          {authError && (
            <div className="roffle-auth-error">
              {authError}
            </div>
          )}

          <div className="roffle-auth-footnote">
            <LockKeyhole size={13} />

            <span>
              Authentication is handled through
              OAuth. ROFFLE never sees
              your Google or Discord password.
            </span>
          </div>
        </section>
      </main>
    </div>
  );
}


function App() {
  const path =
    window.location.pathname
      .toLowerCase();

  if (path === "/prototype" || path.startsWith("/prototype/")) {
    return <Suspense fallback={<PrototypeLoading />}><CommunityPrototype /></Suspense>;
  }

  if (
    path === "/login" ||
    path === "/signin"
  ) {
    return <LoginPage />;
  }

  if (
    path === "/blog" ||
    path.startsWith(
      "/blog/"
    )
  ) {
    return (
      <Suspense
        fallback={
          <PrototypeLoading />
        }
      >
        <Blog />
      </Suspense>
    );
  }


  if (
    path === "/forum" ||
    path.startsWith(
      "/forum/"
    )
  ) {
    return (
      <Suspense
        fallback={
          <PrototypeLoading />
        }
      >
        <Forum />
      </Suspense>
    );
  }


  if (
    path === "/admin" ||
    path.startsWith(
      "/admin/"
    )
  ) {
    return (
      <Suspense
        fallback={
          <PrototypeLoading />
        }
      >
        <Admin />
      </Suspense>
    );
  }

  return (
    <Suspense
      fallback={
        <PrototypeLoading />
      }
    >
      <AppV2 />
    </Suspense>
  );
}

export default App;