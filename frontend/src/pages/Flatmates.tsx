import { useEffect, useState } from "react";
import PropertyCard from "../components/PropertyCard";
import { CardSkeletonGrid, EmptyState } from "../components/States";
import { api } from "../lib/api";
import type { Property } from "../types";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function Flatmates() {
  const [results, setResults] = useState<Property[] | null>(null);
  const { user } = useAuth();
  const { notify } = useToast();

  useEffect(() => {
    const params = new URLSearchParams({ propertyType: "FLATMATE", pageSize: "24", sort: "newest" });
    api.properties.search(params).then((r) => setResults(r.results)).catch(() => setResults([]));
  }, []);

  async function toggleFavorite(id: string) {
    if (!user) return notify("Log in to save properties.", "info");
    try {
      const { favorited } = await api.properties.toggleFavorite(id);
      setResults((prev) => prev?.map((p) => (p.id === id ? { ...p, isFavorited: favorited } : p)) ?? prev);
    } catch {
      notify("Couldn't update favorites right now.", "error");
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 pb-24 lg:pb-8">
      <h1 className="font-display text-2xl font-semibold text-ink mb-1">Find a flatmate</h1>
      <p className="text-sm text-ink-soft mb-6">
        Shared rooms and flats looking for a roommate. Full lifestyle-matching profiles (food/smoking/pet
        preferences) aren't wired up in this MVP yet — these are regular listings tagged as flatmate-friendly.
      </p>

      {results === null ? (
        <CardSkeletonGrid count={6} />
      ) : results.length === 0 ? (
        <EmptyState title="No flatmate listings right now" description="Check back soon, or post one if you're looking for a roommate." />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {results.map((p) => (
            <PropertyCard key={p.id} property={p} onToggleFavorite={toggleFavorite} />
          ))}
        </div>
      )}
    </div>
  );
}
