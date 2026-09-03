import { Link, NavLink, useNavigate } from "react-router-dom";
import { Heart, Home, Search, PlusCircle, User as UserIcon, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

const navLinks = [
  { to: "/properties", label: "Rent" },
  { to: "/pg", label: "PG" },
  { to: "/flatmates", label: "Flatmates" },
  { to: "/messages", label: "Messages" },
  { to: "/post-property", label: "Post Property" },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const isAdmin = user?.userType === "ADMIN";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={`sticky top-0 z-40 border-b border-line transition-all duration-300 ${
          scrolled ? "bg-surface/80 shadow-[0_10px_25px_rgba(20,22,43,0.06)] backdrop-blur-xl" : "bg-surface/90 backdrop-blur"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link to="/" className="logo-mark flex items-center gap-2 shrink-0 transition-transform duration-200 hover:scale-[1.01]">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white font-display font-bold shadow-[0_8px_18px_rgba(55,48,165,0.25)]">F</span>
            <span className="font-display text-lg font-semibold tracking-tight text-ink">FlatFinder</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-6">
            {navLinks.map((l) => (
              <NavLink
                key={l.label}
                to={l.to}
                className={({ isActive }) =>
                  `nav-link text-sm font-medium ${isActive ? "active text-primary" : "text-ink-soft"}`
                }
              >
                {l.label}
              </NavLink>
            ))}
            {isAdmin && (
              <NavLink
                to="/admin/listings"
                className={({ isActive }) =>
                  `nav-link text-sm font-medium ${isActive ? "active text-primary" : "text-ink-soft"}`
                }
              >
                Admin Approvals
              </NavLink>
            )}
          </nav>

          <div className="hidden lg:flex items-center gap-4">
            <Link to="/favorites" className="text-ink-soft hover:text-primary transition-colors" aria-label="Favorites">
              <Heart size={20} />
            </Link>
            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/dashboard"
                  className="text-sm font-medium text-ink-soft hover:text-primary transition-colors"
                >
                  Hi, {user.name.split(" ")[0]}
                </Link>
                <button
                  onClick={() => {
                    logout();
                    navigate("/");
                  }}
                  className="rounded-full border border-line px-4 py-2 text-sm font-medium text-ink hover:border-primary hover:text-primary transition-colors"
                >
                  Log out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="rounded-full px-4 py-2 text-sm font-medium text-ink-soft hover:text-primary transition-colors">
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-light transition-colors"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>

          <button className="lg:hidden text-ink" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {open && (
          <div className="lg:hidden border-t border-line bg-surface px-4 py-3 flex flex-col gap-3 shadow-[0_12px_20px_rgba(20,22,43,0.05)]">
            {navLinks.map((l) => (
              <Link key={l.label} to={l.to} onClick={() => setOpen(false)} className="text-sm font-medium text-ink py-1.5">
                {l.label}
              </Link>
            ))}
            {isAdmin && (
              <Link to="/admin/listings" onClick={() => setOpen(false)} className="text-sm font-medium text-ink py-1.5">
                Admin Approvals
              </Link>
            )}
            <div className="border-t border-line pt-3 flex flex-col gap-2">
              {user ? (
                <>
                  <Link to="/dashboard" onClick={() => setOpen(false)} className="text-sm font-medium text-ink py-1.5">
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setOpen(false);
                      navigate("/");
                    }}
                    className="text-left text-sm font-medium text-danger py-1.5"
                  >
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setOpen(false)} className="text-sm font-medium text-ink py-1.5">
                    Log in
                  </Link>
                  <Link to="/signup" onClick={() => setOpen(false)} className="text-sm font-medium text-primary py-1.5">
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-line bg-surface/95 backdrop-blur py-2 px-2 shadow-[0_-10px_20px_rgba(20,22,43,0.04)]">
        <MobileTab to="/" icon={<Home size={20} />} label="Home" />
        <MobileTab to="/properties" icon={<Search size={20} />} label="Search" />
        <MobileTab to="/post-property" icon={<PlusCircle size={20} />} label="Post" />
        <MobileTab to="/favorites" icon={<Heart size={20} />} label="Saved" />
        <MobileTab to={user ? "/dashboard" : "/login"} icon={<UserIcon size={20} />} label={user ? "You" : "Login"} />
      </nav>
    </>
  );
}

function MobileTab({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-[11px] font-medium transition-colors ${
          isActive ? "text-primary" : "text-ink-soft"
        }`
      }
    >
      {icon}
      {label}
    </NavLink>
  );
}
