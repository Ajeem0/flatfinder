import { lazy, Suspense, useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Home as HomeIcon } from "lucide-react";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import Layout from "./components/Layout";

import Home from "./pages/Home";
import Properties from "./pages/Properties";
const PropertyDetail = lazy(() => import("./pages/PropertyDetail"));
const Login = lazy(() => import("./pages/Login"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const Signup = lazy(() => import("./pages/Signup"));
const Favorites = lazy(() => import("./pages/Favorites"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const PostProperty = lazy(() => import("./pages/PostProperty"));
const AdminListings = lazy(() => import("./pages/AdminListings"));
const AdminPropertyEdit = lazy(() => import("./pages/AdminPropertyEdit"));
const PgFinder = lazy(() => import("./pages/PgFinder"));
const Flatmates = lazy(() => import("./pages/Flatmates"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Messages = lazy(() => import("./pages/Messages"));
import ProtectedRoute from "./components/ProtectedRoute";

function AppShell() {
  const [isBooting, setIsBooting] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsBooting(false), 250);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <>
      <div className={`app-splash ${isBooting ? "is-visible" : "is-hidden"}`} aria-hidden={!isBooting}>
        <div className="app-splash__logo">
          <HomeIcon size={34} strokeWidth={1.8} />
          <span className="app-splash__window app-splash__window--one" />
          <span className="app-splash__window app-splash__window--two" />
        </div>
        <p className="app-splash__label">Finding your place</p>
      </div>

      <Layout>
        <Suspense fallback={<div className="mx-auto max-w-6xl px-4 py-8"><div className="h-64 animate-pulse rounded-2xl bg-line/50" /></div>}>
          <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/properties" element={<Properties />} />
          <Route path="/property/:slug" element={<PropertyDetail />} />
          <Route path="/pg" element={<PgFinder />} />
          <Route path="/flatmates" element={<Flatmates />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/listings"
            element={
              <ProtectedRoute roles={["ADMIN"]}>
                <AdminListings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/properties/:id/edit"
            element={
              <ProtectedRoute roles={["ADMIN"]}>
                <AdminPropertyEdit />
              </ProtectedRoute>
            }
          />
          <Route path="/post-property" element={<ProtectedRoute roles={["OWNER", "AGENT", "ADMIN"]}><PostProperty /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </Layout>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppShell />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
