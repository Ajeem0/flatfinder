import { memo, useState } from "react";
import { Heart, MapPin, BedDouble, Ruler, BadgeCheck, MessageCircle, Check } from "lucide-react";
import { Link } from "react-router-dom";
import type { Property } from "../types";
import { formatDate, formatRent, FURNISHING_LABEL } from "../lib/format";

interface Props {
  property: Property;
  onToggleFavorite?: (id: string) => void;
  favoritePending?: boolean;
  revealDelay?: number;
  onChat?: (property: Property) => void;
  onSelect?: (property: Property) => void;
  selectLabel?: string;
  selected?: boolean;
  imagePriority?: boolean;
}

function PropertyCard({ property, onToggleFavorite, favoritePending, revealDelay = 0, onChat, onSelect, selectLabel = "Select property", selected = false, imagePriority = false }: Props) {
  const variant = property.imageVariants?.[0];
  const cover = property.images[0] || variant?.thumbnailUrl || variant?.cardUrl || variant?.mediumUrl || variant?.largeUrl;
  const src = variant?.cardUrl || variant?.mediumUrl || cover || undefined;
  const srcSet = [
    variant?.thumbnailUrl && `${variant.thumbnailUrl} 320w`,
    variant?.cardUrl && `${variant.cardUrl} 640w`,
    variant?.mediumUrl && `${variant.mediumUrl} 1024w`,
    variant?.largeUrl && `${variant.largeUrl} 1600w`,
  ].filter(Boolean).join(", ");
  const [renderedAt] = useState(() => Date.now());
  const isRecentlyApproved =
    property.status === "PUBLISHED" && renderedAt - new Date(property.updatedAt).getTime() < 1000 * 60;

  return (
    <div
      className={`card-lift group relative flex min-w-0 flex-col overflow-hidden rounded-xl border bg-surface shadow-sm sm:rounded-2xl ${selected ? "border-primary ring-2 ring-primary/15" : "border-line"}`}
      data-reveal
      data-delay={revealDelay}
    >
      <Link to={`/property/${property.slug}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-primary-soft">
          {cover ? (
            <img
              src={src}
              srcSet={srcSet || undefined}
              alt={property.title}
              loading={imagePriority ? "eager" : "lazy"}
              fetchPriority={imagePriority ? "high" : "auto"}
              decoding="async"
              width={variant?.width || 4}
              height={variant?.height || 3}
              sizes="(min-width: 1280px) 30vw, (min-width: 640px) 45vw, 100vw"
              style={variant?.blurDataUrl ? { backgroundImage: `url(${variant.blurDataUrl})`, backgroundSize: "cover" } : undefined}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-ink-soft text-sm">No photo yet</div>
          )}
          <div className="absolute left-1.5 top-1.5 flex max-w-[calc(100%-2.75rem)] gap-1 overflow-hidden sm:left-3 sm:top-3 sm:gap-1.5">
            {property.owner?.userType === "OWNER" ? (
              <span className="rounded-full bg-verified px-1.5 py-0.5 text-[8px] font-semibold text-white shadow-sm sm:px-2.5 sm:py-1 sm:text-[11px]">Owner</span>
            ) : (
              <span className="rounded-full bg-amber px-1.5 py-0.5 text-[8px] font-semibold text-white shadow-sm sm:px-2.5 sm:py-1 sm:text-[11px]">Agent</span>
            )}
            {property.noBrokerage && (
              <span className="hidden rounded-full bg-ink/80 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm sm:inline-flex">No Brokerage</span>
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
        className="absolute right-1.5 top-1.5 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur transition-transform hover:scale-110 disabled:opacity-60 sm:right-3 sm:top-3 sm:h-9 sm:w-9"
      >
        <Heart
          size={18}
          className={property.isFavorited ? "fill-danger text-danger" : "text-ink-soft"}
        />
      </button>

      <Link to={`/property/${property.slug}`} className="flex min-w-0 flex-1 flex-col gap-1 p-2 sm:gap-2 sm:p-3 lg:p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 font-display text-[11px] font-semibold leading-tight text-ink line-clamp-2 sm:text-sm lg:text-base">{property.title}</h3>
        </div>
        <p className="flex min-w-0 items-center gap-0.5 truncate text-[9px] text-ink-soft sm:gap-1 sm:text-xs lg:text-sm">
          <MapPin size={11} className="shrink-0 sm:h-[14px] sm:w-[14px]" />
          <span className="truncate">{property.locationName ? `${property.locationName}, ` : ""}{property.city}</span>
        </p>

        <div className="flex min-w-0 items-baseline gap-0.5 pt-0.5 sm:gap-1 sm:pt-1">
          <span className="price-figure truncate font-display text-sm font-semibold text-primary sm:text-lg lg:text-xl">{formatRent(property.monthlyRent)}</span>
          <span className="shrink-0 text-[8px] text-ink-soft sm:text-xs">/mo</span>
        </div>

        <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[9px] text-ink-soft sm:mt-1 sm:gap-x-3 sm:gap-y-1 sm:text-xs">
          {property.bhk && (
            <span className="flex items-center gap-1">
              <BedDouble size={10} className="sm:h-[13px] sm:w-[13px]" /> {property.bhk} BHK
            </span>
          )}
          {property.areaSqft && (
            <span className="hidden items-center gap-1 sm:flex">
              <Ruler size={13} /> {property.areaSqft} sq.ft
            </span>
          )}
          <span className="hidden sm:inline">{FURNISHING_LABEL[property.furnishing]}</span>
        </div>

        <div className="mt-auto hidden items-center justify-between border-t border-line/70 pt-3 text-xs sm:flex">
          <span className="truncate text-ink-soft">
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
      <div className="flex flex-col gap-1 px-2 pb-2 sm:gap-2 sm:px-3 sm:pb-3 lg:px-4 lg:pb-4 lg:flex-row">
        <Link to={`/property/${property.slug}`} className="w-full truncate rounded-full border border-line px-1 py-1.5 text-center text-[9px] font-semibold text-ink sm:flex-1 sm:py-2 sm:text-xs">
          View details
        </Link>
        {onSelect && (
          <button
            type="button"
            onClick={() => onSelect(property)}
            aria-pressed={selected}
            className={`flex w-full items-center justify-center gap-1 rounded-full px-1 py-1.5 text-[9px] font-semibold sm:w-auto sm:px-3 sm:py-2 sm:text-xs ${selected ? "bg-primary-soft text-primary" : "bg-primary text-white"}`}
          >
            {selected && <Check size={13} />}
            {selected ? "Selected" : selectLabel}
          </button>
        )}
        {onChat && (
          <button type="button" onClick={() => onChat(property)} className="flex w-full items-center justify-center gap-1 rounded-full bg-primary px-1 py-1.5 text-[9px] font-semibold text-white sm:w-auto sm:px-3 sm:py-2 sm:text-xs">
            <MessageCircle size={11} className="sm:h-[13px] sm:w-[13px]" /> Chat
          </button>
        )}
      </div>
    </div>
  );
}

export default memo(PropertyCard);
