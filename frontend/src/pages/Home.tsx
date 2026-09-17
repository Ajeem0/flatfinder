import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, Search, Users, ArrowRight } from "lucide-react";
import SearchBar from "../components/SearchBar";
import PropertyCard from "../components/PropertyCard";
import { CardSkeletonGrid } from "../components/States";
import { api } from "../lib/api";
import type { Property } from "../types";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const POPULAR_CITIES = ["Jaipur", "Delhi", "Mumbai", "Bangalore", "Pune", "Hyderabad", "Gurgaon"];

export default function Home() {
  const [featured, setFeatured] = useState<Property[] | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const { user } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams({ sort: "newest", pageSize: "3" });
    api.properties
      .search(params)
      .then((res) => setFeatured(res.results))
      .catch(() => setFeatured([]));
  }, []);

  async function toggleFavorite(id: string) {
    if (!user) {
      notify("Log in to save properties to your favorites.", "info");
      return;
    }
    try {
      const { favorited } = await api.properties.toggleFavorite(id);
      setFeatured((prev) => prev?.map((p) => (p.id === id ? { ...p, isFavorited: favorited } : p)) ?? prev);
      notify(favorited ? "Saved to favorites" : "Removed from favorites", "success");
    } catch {
      notify("Couldn't update favorites right now.", "error");
    }
  }

  function openAllProperties() {
    if (user) {
      navigate("/properties");
      return;
    }
    setShowLoginPrompt(true);
  }

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-primary">
        <div
          className="absolute inset-0 opacity-25 hero-card"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1800&q=60')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/95 via-primary/85 to-primary" />

        <div className="relative mx-auto max-w-7xl px-4 pt-16 pb-28 sm:px-6 sm:pt-24 sm:pb-36 text-center">
          <span className="hero-badge inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90 mb-5">
            <ShieldCheck size={13} /> Verified owners across 7 cities
          </span>
          <h1 className="hero-title font-display text-4xl sm:text-6xl font-semibold text-white leading-[1.05] max-w-3xl mx-auto">
            Find a place you'll love to live.
          </h1>
          <p className="hero-copy mt-4 max-w-xl mx-auto text-base sm:text-lg text-white/80">
            Discover flats, apartments, PGs and rooms that match your budget, location and lifestyle.
          </p>
        </div>
      </section>

      {/* Floating search card, overlapping hero/content boundary */}
      <div className="relative -mt-20 sm:-mt-24 mx-auto max-w-5xl px-4 sm:px-6">
        <div className="hero-cta">
          <SearchBar />
        </div>

        <div className="hero-cta mt-5 flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs font-medium text-ink-soft mr-1">Popular:</span>
          {POPULAR_CITIES.map((city) => (
            <Link
              key={city}
              to={`/properties?city=${city}`}
              className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink hover:border-primary hover:text-primary transition-colors"
            >
              {city}
            </Link>
          ))}
        </div>
      </div>

      {/* Trust strip */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-20 grid grid-cols-1 sm:grid-cols-3 gap-6">
        <TrustCard icon={<ShieldCheck size={20} />} title="Verified listings" desc="Every owner is phone-verified before their listing goes live." delay={0} />
        <TrustCard icon={<Search size={20} />} title="Smart search" desc={`Type it like you'd say it — "2 BHK under 20k in Jaipur" just works.`} delay={120} />
        <TrustCard icon={<Users size={20} />} title="No hidden brokerage" desc="Filter for owner-listed, no-brokerage properties in one tap." delay={240} />
      </section>

      {/* Featured properties */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-20 mb-24">
        <div className="flex items-end justify-between mb-6" data-reveal>
          <div>
            <h2 className="font-display text-2xl font-semibold text-ink">Freshly listed</h2>
            <p className="text-sm text-ink-soft mt-1">The newest homes added to FlatFinder</p>
          </div>
          <button onClick={openAllProperties} className="hidden sm:flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            View all <ArrowRight size={14} />
          </button>
        </div>

        {featured === null ? (
          <div data-reveal>
            <CardSkeletonGrid count={3} />
          </div>
        ) : featured.length === 0 ? (
          <p className="text-sm text-ink-soft" data-reveal>No listings yet — check back soon, or be the first to post one.</p>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {featured.map((p, index) => (
              <PropertyCard key={p.id} property={p} onToggleFavorite={toggleFavorite} revealDelay={index * 80} />
            ))}
          </div>
        )}

        <button onClick={openAllProperties} className="sm:hidden mt-6 flex w-full items-center justify-center gap-1 text-sm font-medium text-primary" data-reveal>
          View all properties <ArrowRight size={14} />
        </button>
      </section>

      {showLoginPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4" role="presentation" onMouseDown={() => setShowLoginPrompt(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-prompt-title"
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h2 id="login-prompt-title" className="font-display text-xl font-semibold text-ink">Log in to view all properties</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">Create an account or log in to explore every available home.</p>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setShowLoginPrompt(false)} className="flex-1 rounded-full border border-line px-4 py-2.5 text-sm font-medium text-ink">
                Cancel
              </button>
              <Link
                to="/login"
                state={{ from: { pathname: "/properties" } }}
                className="flex-1 rounded-full bg-primary px-4 py-2.5 text-center text-sm font-semibold text-white"
                onClick={() => setShowLoginPrompt(false)}
              >
                Log in
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TrustCard({ icon, title, desc, delay }: { icon: React.ReactNode; title: string; desc: string; delay: number }) {
  return (
    <div className="card-lift rounded-2xl border border-line bg-white p-5" data-reveal data-delay={delay}>
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary mb-3">{icon}</div>
      <h3 className="font-semibold text-ink text-sm mb-1">{title}</h3>
      <p className="text-sm text-ink-soft leading-relaxed">{desc}</p>
    </div>
  );
}
