import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, MapPin, X } from "lucide-react";
import { api } from "../lib/api";
import type { FavoriteItem } from "../types";
import { formatRent } from "../lib/format";
import { EmptyState } from "../components/States";
import { useToast } from "../context/ToastContext";

export default function Favorites() {
  const [items, setItems] = useState<FavoriteItem[] | null>(null);
  const { notify } = useToast();

  useEffect(() => {
    api.favorites
      .list()
      .then((res) => setItems(res.results))
      .catch(() => setItems([]));
  }, []);

  async function remove(propertyId: string) {
    try {
      await api.properties.toggleFavorite(propertyId);
      setItems((prev) => prev?.filter((i) => i.propertyId !== propertyId) ?? prev);
      notify("Removed from favorites", "success");
    } catch {
      notify("Couldn't remove that right now.", "error");
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 pb-24 lg:pb-8">
      <h1 className="font-display text-2xl font-semibold text-ink mb-1">Your favorites</h1>
      <p className="text-sm text-ink-soft mb-6">Properties you've saved for later.</p>

      {items === null ? (
        <p className="text-sm text-ink-soft">Loading...</p>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Heart size={28} />}
          title="No saved properties yet"
          description="Tap the heart on any listing to save it here."
          action={
            <Link to="/properties" className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-white">
              Browse properties
            </Link>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <div key={item.favoriteId} className="flex items-center gap-4 rounded-2xl border border-line bg-white p-3">
              <Link to={`/property/${item.slug}`} className="h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-primary-soft">
                {item.image && <img src={item.image} alt={item.title} className="h-full w-full object-cover" />}
              </Link>
              <div className="flex-1 min-w-0">
                <Link to={`/property/${item.slug}`} className="font-semibold text-ink text-sm truncate block hover:text-primary">{item.title}</Link>
                <p className="flex items-center gap-1 text-xs text-ink-soft mt-0.5">
                  <MapPin size={12} /> {item.locationName ? `${item.locationName}, ` : ""}{item.city}
                </p>
                <p className="price-figure font-display text-sm font-semibold text-primary mt-1">{formatRent(item.monthlyRent)}/mo</p>
              </div>
              {item.status !== "PUBLISHED" && (
                <span className="rounded-full bg-line px-2 py-1 text-[10px] font-medium text-ink-soft shrink-0">{item.status}</span>
              )}
              <button onClick={() => remove(item.propertyId)} aria-label="Remove from favorites" className="shrink-0 text-ink-soft hover:text-danger p-2">
                <X size={18} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
