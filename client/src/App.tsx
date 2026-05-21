import { Switch, Route, useLocation, Redirect } from "wouter";
import { useEffect, useState, lazy, Suspense } from "react";
import { AppShell } from "./components/Layout/AppShell";
import { useAuth } from "./hooks/useAuth";

const Landing       = lazy(() => import("./pages/Landing"));
const Login         = lazy(() => import("./pages/Login"));
const Signup        = lazy(() => import("./pages/Signup"));
const Onboarding    = lazy(() => import("./pages/Onboarding"));
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

function Loader() {
  return (
    <div className="flex items-center justify-center h-screen bg-white">
      <div
        className="w-6 h-6 rounded-full border-2 border-gray-200 border-t-gray-700"
        style={{ animation: "spin 0.7s linear infinite" }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ScrollReset() {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [location]);
  return null;
}

function PageWrapper({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  return <div key={location} className="page-enter">{children}</div>;
}

function ShellPage({ children }: { children: React.ReactNode }) {
  return <AppShell><PageWrapper>{children}</PageWrapper></AppShell>;
}

/*
 * Smart root route:
 *   loading + had prior session   → spinner (Firebase restoring token)
 *   loading + no prior session    → landing page immediately
 *   user + !onboardingComplete    → redirect to /onboarding
 *   user + onboardingComplete     → home feed
 *   no user                       → landing page
 */
function RootRoute() {
  const { user, loading } = useAuth();
  const [prevLoggedIn] = useState(() => localStorage.getItem("ig_session") === "1");

  useEffect(() => {
    if (!loading) {
      if (user?.onboardingComplete) {
        localStorage.setItem("ig_session", "1");
      } else {
        localStorage.removeItem("ig_session");
      }
    }
  }, [user, loading]);

  if (loading) {
    return prevLoggedIn ? <Loader /> : <Landing />;
  }
  if (user && !user.onboardingComplete) return <Redirect to="/onboarding" />;
  if (user) return <ShellPage><Home /></ShellPage>;
  return <Landing />;
}

/* Login — show form immediately, redirect only when definitely logged in */
function LoginRoute() {
  const { user, loading } = useAuth();
  if (!loading && user && !user.onboardingComplete) return <Redirect to="/onboarding" />;
  if (!loading && user) return <Redirect to="/" />;
  return <Login />;
}

/* Signup — same pattern */
function SignupRoute() {
  const { user, loading } = useAuth();
  if (!loading && user && !user.onboardingComplete) return <Redirect to="/onboarding" />;
  if (!loading && user) return <Redirect to="/" />;
  return <Signup />;
}

/* Protected page — requires full onboarded user */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <Loader />;
  if (!user) return <Redirect to="/login" />;
  if (!user.onboardingComplete) return <Redirect to="/onboarding" />;
  return <ShellPage>{children}</ShellPage>;
}

export default function App() {
  return (
    <>
      <ScrollReset />
      <Suspense fallback={<Loader />}>
        <Switch>
          <Route path="/" component={RootRoute} />
          <Route path="/login" component={LoginRoute} />
          <Route path="/signup" component={SignupRoute} />
          {/* Onboarding is public — handles its own auth (email link callback) */}
          <Route path="/onboarding">{() => <Onboarding />}</Route>

          {/* Public profile pages */}
          <Route path="/u/:username/followers">{() => <ShellPage><FollowList kind="followers" /></ShellPage>}</Route>
          <Route path="/u/:username/following">{() => <ShellPage><FollowList kind="following" /></ShellPage>}</Route>
          <Route path="/u/:username">{() => <ShellPage><Profile /></ShellPage>}</Route>
          <Route path="/p/:id">{() => <ShellPage><PostPage /></ShellPage>}</Route>
          <Route path="/explore">{() => <ShellPage><Explore /></ShellPage>}</Route>
          <Route path="/search">{() => <ShellPage><Search /></ShellPage>}</Route>
          <Route path="/reels">{() => <ShellPage><Reels /></ShellPage>}</Route>

          {/* Protected pages */}
          <Route path="/notifications">{() => <ProtectedRoute><Notifications /></ProtectedRoute>}</Route>
          <Route path="/messages/:id">{() => <ProtectedRoute><Messages /></ProtectedRoute>}</Route>
          <Route path="/messages">{() => <ProtectedRoute><Messages /></ProtectedRoute>}</Route>
          <Route path="/settings">{() => <ProtectedRoute><Settings /></ProtectedRoute>}</Route>
          <Route path="/settings/edit">{() => <ProtectedRoute><Settings /></ProtectedRoute>}</Route>

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
