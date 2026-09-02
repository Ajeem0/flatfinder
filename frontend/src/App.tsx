import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import Layout from "./components/Layout";

import Home from "./pages/Home";
import Properties from "./pages/Properties";
import PropertyDetail from "./pages/PropertyDetail";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Favorites from "./pages/Favorites";
import Dashboard from "./pages/Dashboard";
import PostProperty from "./pages/PostProperty";
import AdminListings from "./pages/AdminListings";
import AdminPropertyEdit from "./pages/AdminPropertyEdit";
import PgFinder from "./pages/PgFinder";
import Flatmates from "./pages/Flatmates";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";

function AppShell() {
  const [isBooting, setIsBooting] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsBooting(false), 450);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <>
      <div className={`app-splash ${isBooting ? "is-visible" : "is-hidden"}`} aria-hidden={!isBooting}>
        <div className="app-splash__logo">
          <span>F</span>
        </div>
      </div>

      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/properties" element={<Properties />} />
          <Route path="/property/:slug" element={<PropertyDetail />} />
          <Route path="/pg" element={<PgFinder />} />
          <Route path="/flatmates" element={<Flatmates />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/favorites" element={<Favorites />} />
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
          <Route path="/post-property" element={<PostProperty />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
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
