import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, BadgeCheck, Sparkles } from "lucide-react";
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
  const propertySectionRef = useRef<HTMLElement>(null);

    useEffect(() => {
      const params = new URLSearchParams({ sort: "newest", pageSize: "6" });
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

  function showFeaturedProperties() {
    propertySectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="overflow-hidden">
      <section
        className="relative isolate min-h-[540px] bg-ink bg-cover bg-center sm:min-h-[610px]"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=2200&q=85')",
        }}
      >
        <div
          className="absolute inset-0 -z-10 bg-ink/65"
        />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-32 bg-gradient-to-t from-ink/50 to-transparent" />

        <div className="mx-auto flex min-h-[540px] max-w-7xl flex-col justify-center px-4 pb-20 pt-20 sm:min-h-[610px] sm:px-6 sm:pb-28 sm:pt-24">
          <div className="max-w-2xl text-white">
            <span className="hero-badge inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/90 backdrop-blur-sm">
              <BadgeCheck size={14} /> Homes checked for you
          </span>
            <h1 className="hero-title mt-5 max-w-xl font-display text-4xl font-semibold leading-[1.02] text-white sm:text-6xl">
              A better place to live is closer than you think.
            </h1>
            <p className="hero-copy mt-4 max-w-lg text-sm leading-relaxed text-white/80 sm:text-lg">
              Explore real flats, PGs and rooms with clear pricing, verified owners and spaces that feel like home.
            </p>
            <div className="hero-cta mt-7 flex flex-wrap items-center gap-3">
              <button onClick={showFeaturedProperties} className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-ink shadow-lg transition-transform hover:-translate-y-0.5">
                Explore homes <ArrowRight size={16} />
              </button>
              <Link to="/post-property" className="inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur-sm hover:bg-white/20">
                List your property
              </Link>
            </div>
          </div>
          <div className="mt-auto hidden items-center gap-8 pt-10 text-white/85 sm:flex">
            <HeroProof value="7" label="cities" />
            <HeroProof value="100%" label="phone-verified owners" />
            <HeroProof value="₹0" label="hidden brokerage" />
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto -mt-16 max-w-5xl px-3 sm:-mt-20 sm:px-6">
        <div className="hero-card rounded-3xl border border-line bg-white p-3 shadow-[0_24px_70px_rgba(20,22,43,0.16)] sm:p-5">
          <div className="mb-3 flex items-center justify-between px-1">
            <div>
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary"><Sparkles size={13} /> Start with a search</p>
              <p className="mt-1 hidden text-sm text-ink-soft sm:block">Tell us where and how you want to live.</p>
            </div>
            <Link to="/properties" className="text-xs font-semibold text-ink-soft hover:text-primary">Browse all</Link>
          </div>
          <SearchBar />
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {POPULAR_CITIES.map((city) => (
              <Link key={city} to={`/properties?city=${city}`} className="shrink-0 rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:border-primary hover:text-primary">
              {city}
              </Link>
            ))}
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-ink-soft">Ready to find your next place?</p>
            <AllPropertiesAction showLoginPrompt={showLoginPrompt} onOpen={openAllProperties} />
          </div>
        </div>
      </section>

      <section ref={propertySectionRef} id="featured-properties" className="scroll-mt-24 mx-auto max-w-7xl px-4 pb-24 pt-16 sm:px-6 sm:pt-20">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between" data-reveal>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Fresh on FlatFinder</p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-ink sm:text-4xl">Homes worth a closer look.</h2>
            <p className="mt-2 text-sm text-ink-soft">Newly listed spaces with the details you need to decide.</p>
          </div>
          <AllPropertiesAction showLoginPrompt={showLoginPrompt} onOpen={openAllProperties} />
        </div>

        {featured === null ? (
          <div data-reveal>
            <CardSkeletonGrid count={6} />
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

        <div className="mt-10 flex justify-center sm:hidden">
          <AllPropertiesAction showLoginPrompt={showLoginPrompt} onOpen={openAllProperties} />
        </div>
      </section>
    </div>
  );
}

function AllPropertiesAction({ showLoginPrompt, onOpen }: { showLoginPrompt: boolean; onOpen: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button onClick={onOpen} className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-light">
        See more properties <ArrowRight size={15} />
      </button>
      {showLoginPrompt && (
        <Link to="/login" state={{ from: { pathname: "/properties" } }} className="inline-flex items-center gap-1.5 rounded-full border border-primary bg-primary-soft px-4 py-2.5 text-sm font-semibold text-primary">
          Log in to continue
        </Link>
      )}
    </div>
  );
}

function HeroProof({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="font-display text-2xl font-semibold text-white">{value}</p>
      <p className="mt-0.5 text-xs text-white/65">{label}</p>
    </div>
  );
}

