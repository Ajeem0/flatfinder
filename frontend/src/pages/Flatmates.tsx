import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, PlusCircle } from "lucide-react";
import PropertyCard from "../components/PropertyCard";
import { CardSkeletonGrid, EmptyState, ErrorState } from "../components/States";
import { api, ApiError } from "../lib/api";
import type { Property } from "../types";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function Flatmates() {
  const [results, setResults] = useState<Property[] | null>(null);
  const [city, setCity] = useState("");
  const [maxRent, setMaxRent] = useState("");
  const [query, setQuery] = useState("");
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const handle = window.setTimeout(async () => {
      setResults(null);
      setError(null);
      const params = new URLSearchParams({ propertyType: "FLATMATE", pageSize: "24", sort: "newest" });
      if (city.trim()) params.set("city", city.trim());
      if (maxRent) params.set("maxRent", maxRent);
      if (query.trim()) params.set("q", query.trim());
      try {
        const response = await api.properties.search(params);
        setResults(response.results);
      } catch (err) {
        setResults([]);
        setError(err instanceof ApiError ? err.message : "Could not load flatmate listings.");
      }
    }, 180);
    return () => window.clearTimeout(handle);
  }, [city, maxRent, query]);

  async function toggleFavorite(id: string) {
    if (!user) return notify("Log in to save properties.", "info");
    try {
      const { favorited } = await api.properties.toggleFavorite(id);
      setResults((prev) => prev?.map((p) => (p.id === id ? { ...p, isFavorited: favorited } : p)) ?? prev);
    } catch {
      notify("Couldn't update favorites right now.", "error");
    }
  }

  function clearFilters() {
    setCity("");
    setMaxRent("");
    setQuery("");
  }

  function selectProperty(property: Property) {
    setSelectedProperty((current) => (current?.id === property.id ? null : property));
  }

  async function chatWithPoster(property: Property) {
    if (!user) return notify("Log in to chat with the poster.", "info");
    try {
      const { conversation } = await api.chats.start(property.id);
      navigate(`/messages?conversation=${conversation.id}`);
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Could not start this chat.", "error");
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 pb-24 lg:pb-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink mb-1">Find a flatmate</h1>
          <p className="text-sm text-ink-soft">Shared rooms and flats looking for a roommate.</p>
        </div>
        <Link to="/post-property" className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white">
          <PlusCircle size={16} /> Post a flatmate listing
        </Link>
      </div>

      <form onSubmit={(event) => event.preventDefault()} className="mb-8 grid grid-cols-1 gap-3 rounded-2xl border border-line bg-white p-4 sm:grid-cols-[1fr_1fr_180px_auto] sm:items-end">
        <label className="text-xs font-semibold text-ink">
          Search
          <div className="relative mt-1.5">
            <Search size={15} className="absolute left-3 top-3 text-ink-soft" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="BHK, locality or landmark" className="w-full rounded-lg border border-line py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary" />
          </div>
        </label>
        <label className="text-xs font-semibold text-ink">
          City
          <input value={city} onChange={(event) => setCity(event.target.value)} placeholder="Jaipur" className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-primary" />
        </label>
        <label className="text-xs font-semibold text-ink">
          Max monthly rent
          <input type="number" min="0" value={maxRent} onChange={(event) => setMaxRent(event.target.value)} placeholder="15000" className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-primary" />
        </label>
        <button type="button" onClick={clearFilters} className="rounded-lg border border-line px-4 py-2.5 text-sm font-medium text-ink hover:border-primary hover:text-primary">Clear</button>
      </form>

      {results === null ? (
        <CardSkeletonGrid count={6} />
      ) : error ? (
        <ErrorState message={error} />
      ) : results.length === 0 ? (
        <EmptyState title="No flatmate listings match" description="Try a different city or budget, or post a listing if you're looking for a roommate." action={<button onClick={clearFilters} className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-white">Clear filters</button>} />
      ) : (
        <>
          {selectedProperty && (
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary-soft px-4 py-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">Selected property</p>
                <p className="mt-0.5 text-sm font-medium text-ink">{selectedProperty.title}</p>
              </div>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setSelectedProperty(null)} className="text-xs font-semibold text-ink-soft hover:text-ink">Change</button>
                <button type="button" onClick={() => navigate(`/property/${selectedProperty.slug}`)} className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white">Continue</button>
              </div>
            </div>
          )}
          <p className="mb-4 text-sm text-ink-soft">{results.length} flatmate {results.length === 1 ? "listing" : "listings"}</p>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {results.map((p) => (
              <PropertyCard
                key={p.id}
                property={p}
                onToggleFavorite={toggleFavorite}
                onChat={chatWithPoster}
                onSelect={selectProperty}
                selected={selectedProperty?.id === p.id}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
