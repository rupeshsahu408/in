import { Switch, Route, useLocation, Redirect } from "wouter";
import { useEffect, useState, lazy, Suspense } from "react";
import { AppShell } from "./components/Layout/AppShell";
import { useAuth } from "./hooks/useAuth";

const Landing       = lazy(() => import("./pages/Landing"));
const Login         = lazy(() => import("./pages/Login"));
const Home          = lazy(() => import("./pages/Home"));
const Profile       = lazy(() => import("./pages/Profile"));
const Explore       = lazy(() => import("./pages/Explore"));
const Search        = lazy(() => import("./pages/Search"));
const Reels         = lazy(() => import("./pages/Reels"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Messages      = lazy(() => import("./pages/Messages"));
const PostPage      = lazy(() => import("./pages/Post"));
const Settings      = lazy(() => import("./pages/Settings"));
const FollowList    = lazy(() => import("./pages/FollowList"));

/* Full-screen loader shown while Firebase restores session */
function Loader() {
  return (
    <div className="flex items-center justify-center h-screen bg-white">
      <div
        className="w-6 h-6 rounded-full border-2 border-gray-200 border-t-gray-700"
        style={{ animation: "spin 0.7s linear infinite" }}
      />
    </div>
  );
}

/* Scrolls to top on every route change */
function ScrollReset() {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [location]);
  return null;
}

/* Fade-in wrapper keyed to the route */
function PageWrapper({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  return (
    <div key={location} className="page-enter">
      {children}
    </div>
  );
}

/* Pages that live inside the main AppShell */
function ShellPage({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <PageWrapper>{children}</PageWrapper>
    </AppShell>
  );
}

/*
 * Smart root route:
 *   • loading + had prior session  → brief white spinner (Firebase restoring)
 *   • loading + no prior session   → show landing immediately (new / guest)
 *   • logged in                    → main feed  (also stamps "ig_session=1")
 *   • logged out                   → landing page
 *
 * We use a tiny localStorage flag "ig_session" so returning users get the
 * spinner instead of a flash of the landing page before the redirect fires.
 */
function RootRoute() {
  const { user, loading } = useAuth();

  // Read once at mount — did this browser have a session before?
  const [prevLoggedIn] = useState(() => localStorage.getItem("ig_session") === "1");

  useEffect(() => {
    if (!loading) {
      if (user) {
        localStorage.setItem("ig_session", "1");
      } else {
        localStorage.removeItem("ig_session");
      }
    }
  }, [user, loading]);

  if (loading) {
    // Returning logged-in user → show spinner while Firebase restores token
    if (prevLoggedIn) return <Loader />;
    // New / guest visitor → show landing immediately, no wait
    return <Landing />;
  }

  if (user) {
    return (
      <ShellPage>
        <Home />
      </ShellPage>
    );
  }

  return <Landing />;
}

/* Redirects logged-in users away from /login back to feed */
function LoginRoute() {
  const { user, loading } = useAuth();
  if (loading) return <Loader />;
  if (user) return <Redirect to="/" />;
  return <Login />;
}

/* Ensures unauthenticated users can't access protected pages */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [user, loading, navigate]);
  if (loading) return <Loader />;
  if (!user) return <Loader />;
  return <ShellPage>{children}</ShellPage>;
}

export default function App() {
  return (
    <>
      <ScrollReset />
      <Suspense fallback={<Loader />}>
        <Switch>
          {/* Root — smart: Landing for guests, Home for logged-in users */}
          <Route path="/" component={RootRoute} />

          {/* Auth */}
          <Route path="/login" component={LoginRoute} />

          {/* Public pages */}
          <Route path="/u/:username/followers">
            {() => <ShellPage><FollowList kind="followers" /></ShellPage>}
          </Route>
          <Route path="/u/:username/following">
            {() => <ShellPage><FollowList kind="following" /></ShellPage>}
          </Route>
          <Route path="/u/:username">
            {() => <ShellPage><Profile /></ShellPage>}
          </Route>
          <Route path="/p/:id">
            {() => <ShellPage><PostPage /></ShellPage>}
          </Route>
          <Route path="/explore">
            {() => <ShellPage><Explore /></ShellPage>}
          </Route>
          <Route path="/search">
            {() => <ShellPage><Search /></ShellPage>}
          </Route>
          <Route path="/reels">
            {() => <ShellPage><Reels /></ShellPage>}
          </Route>

          {/* Protected pages */}
          <Route path="/notifications">
            {() => <ProtectedRoute><Notifications /></ProtectedRoute>}
          </Route>
          <Route path="/messages/:id">
            {() => <ProtectedRoute><Messages /></ProtectedRoute>}
          </Route>
          <Route path="/messages">
            {() => <ProtectedRoute><Messages /></ProtectedRoute>}
          </Route>
          <Route path="/settings">
            {() => <ProtectedRoute><Settings /></ProtectedRoute>}
          </Route>
          <Route path="/settings/edit">
            {() => <ProtectedRoute><Settings /></ProtectedRoute>}
          </Route>

          {/* 404 */}
          <Route>
            <ShellPage>
              <div className="p-12 text-center text-ig-subtle">Page not found</div>
            </ShellPage>
          </Route>
        </Switch>
      </Suspense>
    </>
  );
}
