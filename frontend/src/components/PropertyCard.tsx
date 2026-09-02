import { Heart, MapPin, BedDouble, Ruler, BadgeCheck } from "lucide-react";
import { Link } from "react-router-dom";
import type { Property } from "../types";
import { formatDate, formatRent, FURNISHING_LABEL } from "../lib/format";

interface Props {
  property: Property;
  onToggleFavorite?: (id: string) => void;
  favoritePending?: boolean;
  revealDelay?: number;
}

export default function PropertyCard({ property, onToggleFavorite, favoritePending, revealDelay = 0 }: Props) {
  const cover = property.images[0];
  const isRecentlyApproved =
    property.status === "PUBLISHED" && Date.now() - new Date(property.updatedAt).getTime() < 1000 * 60;

  return (
    <div
      className="card-lift group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-sm"
      data-reveal
      data-delay={revealDelay}
    >
      <Link to={`/property/${property.slug}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-primary-soft">
          {cover ? (
            <img
              src={cover}
              alt={property.title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-ink-soft text-sm">No photo yet</div>
          )}
          <div className="absolute left-3 top-3 flex gap-1.5">
            {property.owner?.userType === "OWNER" ? (
              <span className="rounded-full bg-verified px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm">Owner</span>
            ) : (
              <span className="rounded-full bg-amber px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm">Agent</span>
            )}
            {property.noBrokerage && (
              <span className="rounded-full bg-ink/80 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm">No Brokerage</span>
            )}
          </div>
        </div>
      </Link>

      <button
        type="button"
        aria-label={property.isFavorited ? "Remove from favorites" : "Save to favorites"}
        aria-pressed={property.isFavorited}
        disabled={favoritePending}
        onClick={() => onToggleFavorite?.(property.id)}
        className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur transition-transform hover:scale-110 disabled:opacity-60"
      >
        <Heart
          size={18}
          className={property.isFavorited ? "fill-danger text-danger" : "text-ink-soft"}
        />
      </button>

      <Link to={`/property/${property.slug}`} className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-base font-semibold leading-snug text-ink line-clamp-2">{property.title}</h3>
        </div>
        <p className="flex items-center gap-1 text-sm text-ink-soft">
          <MapPin size={14} className="shrink-0" />
          {property.locationName ? `${property.locationName}, ` : ""}
          {property.city}
        </p>

        <div className="flex items-baseline gap-1 pt-1">
          <span className="price-figure font-display text-xl font-semibold text-primary">{formatRent(property.monthlyRent)}</span>
          <span className="text-xs text-ink-soft">/month</span>
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-soft">
          {property.bhk && (
            <span className="flex items-center gap-1">
              <BedDouble size={13} /> {property.bhk} BHK
            </span>
          )}
          {property.areaSqft && (
            <span className="flex items-center gap-1">
              <Ruler size={13} /> {property.areaSqft} sq.ft
            </span>
          )}
          <span>{FURNISHING_LABEL[property.furnishing]}</span>
        </div>

        <div className="mt-auto flex items-center justify-between pt-3 border-t border-line/70 text-xs">
          <span className="text-ink-soft">
            Available {formatDate(property.availableFrom)}
            {isRecentlyApproved && <span className="ml-2 font-medium text-primary">Approved just now</span>}
          </span>
          {property.owner?.isPhoneVerified && (
            <span className="flex items-center gap-1 text-verified font-medium">
              <BadgeCheck size={13} /> Verified
            </span>
          )}
        </div>
      </Link>
    </div>
  );
}
