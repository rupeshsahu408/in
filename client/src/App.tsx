import { Switch, Route, useLocation } from "wouter";
import { useEffect, lazy, Suspense } from "react";
import { AppShell } from "./components/Layout/AppShell";
import { useAuth } from "./hooks/useAuth";

const Login = lazy(() => import("./pages/Login"));
const Home = lazy(() => import("./pages/Home"));
const Profile = lazy(() => import("./pages/Profile"));
const Explore = lazy(() => import("./pages/Explore"));
const Search = lazy(() => import("./pages/Search"));
const Reels = lazy(() => import("./pages/Reels"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Messages = lazy(() => import("./pages/Messages"));
const PostPage = lazy(() => import("./pages/Post"));
const Settings = lazy(() => import("./pages/Settings"));
const FollowList = lazy(() => import("./pages/FollowList"));

function Loader() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="spinner" />
    </div>
  );
}

function ProtectedShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [user, loading, navigate]);
  if (loading) return <Loader />;
  if (!user) return <Loader />;
  return <AppShell>{children}</AppShell>;
}

function PublicShell({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}

export default function App() {
  return (
    <Suspense fallback={<Loader />}>
      <Switch>
        <Route path="/login">
          <Login />
        </Route>
        <Route path="/u/:username/followers">
          {() => <PublicShell><FollowList kind="followers" /></PublicShell>}
        </Route>
        <Route path="/u/:username/following">
          {() => <PublicShell><FollowList kind="following" /></PublicShell>}
        </Route>
        <Route path="/u/:username">
          {() => <PublicShell><Profile /></PublicShell>}
        </Route>
        <Route path="/p/:id">
          {() => <PublicShell><PostPage /></PublicShell>}
        </Route>
        <Route path="/explore">
          {() => <PublicShell><Explore /></PublicShell>}
        </Route>
        <Route path="/search">
          {() => <PublicShell><Search /></PublicShell>}
        </Route>
        <Route path="/reels">
          {() => <PublicShell><Reels /></PublicShell>}
        </Route>
        <Route path="/notifications">
          {() => <ProtectedShell><Notifications /></ProtectedShell>}
        </Route>
        <Route path="/messages/:id">
          {() => <ProtectedShell><Messages /></ProtectedShell>}
        </Route>
        <Route path="/messages">
          {() => <ProtectedShell><Messages /></ProtectedShell>}
        </Route>
        <Route path="/settings">
          {() => <ProtectedShell><Settings /></ProtectedShell>}
        </Route>
        <Route path="/settings/edit">
          {() => <ProtectedShell><Settings /></ProtectedShell>}
        </Route>
        <Route path="/">
          {() => <PublicShell><Home /></PublicShell>}
        </Route>
        <Route>
          <PublicShell>
            <div className="p-8 text-center text-ig-subtle">Page not found</div>
          </PublicShell>
        </Route>
      </Switch>
    </Suspense>
  );
}
