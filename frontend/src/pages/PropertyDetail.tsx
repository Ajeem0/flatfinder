import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Heart, MapPin, BedDouble, Ruler, Layers, Calendar, BadgeCheck, Phone,
  MessageCircle, CalendarPlus, X,
} from "lucide-react";
import { api, ApiError } from "../lib/api";
import type { Property } from "../types";
import { bhkLabel, formatDate, formatRent, FURNISHING_LABEL, PROPERTY_TYPE_LABEL } from "../lib/format";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { ErrorState } from "../components/States";

const AMENITY_ICONS: Record<string, string> = {
  Parking: "🅿️", Lift: "🛗", "Wi-Fi": "📶", AC: "❄️", "Power Backup": "🔋",
  Security: "🛡️", Gym: "🏋️", "Swimming Pool": "🏊", Balcony: "🌇",
  "Water Supply": "🚰", "Attached Bathroom": "🚿",
};

export default function PropertyDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notify } = useToast();

  const [property, setProperty] = useState<Property | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [visitOpen, setVisitOpen] = useState(false);
  const [visitDate, setVisitDate] = useState("");

  useEffect(() => {
    if (!slug) return;
    setProperty(null);
    setError(null);
    api.properties
      .get(slug)
      .then((res) => setProperty(res.property))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load this property."));
  }, [slug]);

  async function toggleFavorite() {
    if (!property) return;
    if (!user) return notify("Log in to save properties.", "info");
    try {
      const { favorited } = await api.properties.toggleFavorite(property.id);
      setProperty({ ...property, isFavorited: favorited });
      notify(favorited ? "Saved to favorites" : "Removed from favorites", "success");
    } catch {
      notify("Couldn't update favorites right now.", "error");
    }
  }

  async function contactOwner() {
    if (!property) return;
    if (!user) return notify("Log in to contact the owner.", "info");
    try {
      await api.enquiries.create({ propertyId: property.id, message: "Hi, I'm interested in this property. Is it still available?" });
      notify("Enquiry sent — the owner's number is now visible below.", "success");
      const res = await api.properties.get(property.slug);
      setProperty(res.property);
    } catch {
      notify("Couldn't send your enquiry right now.", "error");
    }
  }

  async function chatWithOwner() {
    if (!property) return;
    if (!user) return notify("Log in to chat with the poster.", "info");
    try {
      const { conversation } = await api.chats.start(property.id);
      navigate(`/messages?conversation=${conversation.id}`);
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Could not start this chat.", "error");
    }
  }

  async function requestVisit(e: React.FormEvent) {
    e.preventDefault();
    if (!property || !visitDate) return;
    if (!user) return notify("Log in to request a visit.", "info");
    try {
      await api.visits.create({ propertyId: property.id, scheduledDate: new Date(visitDate).toISOString() });
      notify("Visit requested — you'll see it under Dashboard → Scheduled Visits.", "success");
      setVisitOpen(false);
      setVisitDate("");
    } catch {
      notify("Couldn't schedule that visit right now.", "error");
    }
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <ErrorState message={error} />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 animate-pulse">
        <div className="aspect-[16/9] rounded-2xl bg-line/60 mb-6" />
        <div className="h-6 w-2/3 rounded bg-line/60 mb-3" />
        <div className="h-4 w-1/3 rounded bg-line/60" />
      </div>
    );
  }

  const images = property.images.length ? property.images : [];
  const videoEmbedUrl = getVideoEmbedUrl(property.videoUrl);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 pb-28 lg:pb-10">
      {/* Gallery */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-6 rounded-2xl overflow-hidden">
        <button className="sm:col-span-3 aspect-[16/10] sm:aspect-auto" onClick={() => setGalleryOpen(true)}>
          <img src={images[activeImage] || images[0]} alt={property.title} className="h-full w-full object-cover" />
        </button>
        <div className="hidden sm:grid grid-rows-3 gap-2">
          {images.slice(1, 4).map((img, i) => (
            <button key={i} onClick={() => { setActiveImage(i + 1); setGalleryOpen(true); }} className="overflow-hidden rounded-lg">
              <img src={img} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-10">
        <div>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                {property.owner?.userType === "OWNER" ? (
                  <span className="rounded-full bg-verified px-2.5 py-0.5 text-[11px] font-semibold text-white">Owner</span>
                ) : (
                  <span className="rounded-full bg-amber px-2.5 py-0.5 text-[11px] font-semibold text-white">Agent</span>
                )}
                {property.noBrokerage && <span className="rounded-full bg-ink/80 px-2.5 py-0.5 text-[11px] font-semibold text-white">No Brokerage</span>}
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink">{property.title}</h1>
              <p className="flex items-center gap-1 text-sm text-ink-soft mt-1">
                <MapPin size={14} /> {property.locationName ? `${property.locationName}, ` : ""}{property.city}
              </p>
            </div>
            <button
              onClick={toggleFavorite}
              aria-label={property.isFavorited ? "Remove from favorites" : "Save to favorites"}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line hover:border-danger/40"
            >
              <Heart size={18} className={property.isFavorited ? "fill-danger text-danger" : "text-ink-soft"} />
            </button>
          </div>

          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <InfoStat icon={<BedDouble size={16} />} label="BHK" value={bhkLabel(property.bhk) || "—"} />
            <InfoStat icon={<Ruler size={16} />} label="Area" value={property.areaSqft ? `${property.areaSqft} sq.ft` : "—"} />
            <InfoStat icon={<Layers size={16} />} label="Floor" value={property.floor ? `${property.floor} of ${property.totalFloors ?? "—"}` : "—"} />
            <InfoStat icon={<Calendar size={16} />} label="Available" value={formatDate(property.availableFrom)} />
          </div>

          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3 rounded-2xl border border-line bg-white p-4">
            <PriceStat label="Monthly rent" value={formatRent(property.monthlyRent)} highlight />
            <PriceStat label="Security deposit" value={formatRent(property.securityDeposit)} />
            <PriceStat label="Maintenance" value={property.maintenance ? formatRent(property.maintenance) : "Included"} />
          </div>

          <Section title="Amenities">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {property.amenities.length === 0 && <p className="text-sm text-ink-soft col-span-full">No amenities listed.</p>}
              {property.amenities.map((a) => (
                <div key={a} className="flex items-center gap-2 rounded-xl border border-line px-3 py-2.5 text-sm text-ink">
                  <span aria-hidden>{AMENITY_ICONS[a] || "✓"}</span> {a}
                </div>
              ))}
            </div>
          </Section>

          {videoEmbedUrl && (
            <Section title="Property video">
              {videoEmbedUrl.includes("youtube.com") || videoEmbedUrl.includes("youtu.be") || videoEmbedUrl.includes("vimeo.com") ? (
                <div className="overflow-hidden rounded-2xl border border-line bg-black">
                  <iframe
                    src={videoEmbedUrl}
                    title="Property video"
                    className="aspect-video w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              ) : (
                <video controls className="w-full rounded-2xl border border-line bg-black" src={property.videoUrl ?? undefined} />
              )}
            </Section>
          )}

          <Section title="Description">
            <p className="text-sm leading-relaxed text-ink-soft whitespace-pre-line">{property.description}</p>
            <dl className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              <DL label="Type" value={PROPERTY_TYPE_LABEL[property.propertyType]} />
              <DL label="Furnishing" value={FURNISHING_LABEL[property.furnishing]} />
              <DL label="Property age" value={property.propertyAgeYears ? `${property.propertyAgeYears} yrs` : "New"} />
              <DL label="Bachelors" value={property.bachelorFriendly ? "Allowed" : "Not allowed"} />
              <DL label="Families" value={property.familyFriendly ? "Allowed" : "Not allowed"} />
              <DL label="Pets" value={property.petFriendly ? "Allowed" : "Not allowed"} />
            </dl>
          </Section>

          <Section title="Location">
            <div className="rounded-2xl border border-line bg-primary-soft/40 aspect-[16/7] flex items-center justify-center text-sm text-ink-soft">
              <MapPin size={16} className="mr-1.5" /> {property.address || `${property.locationName}, ${property.city}`}
            </div>
          </Section>

          {property.propertyType === "FLATMATE" && (
            <Section title="Flatmate preferences">
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <DL label="Listing" value={property.listingType?.replaceAll("_", " ") || "Flatmate listing"} />
                <DL label="Room" value={property.roomType || "Not specified"} />
                <DL label="Existing flatmates" value={String(property.existingFlatmates ?? "Not specified")} />
                <DL label="Gender" value={property.preferredGender || "Any"} />
                <DL label="Age range" value={property.preferredAgeRange || "Any"} />
                <DL label="Occupation" value={property.occupation || "Any"} />
                <DL label="Food" value={property.foodPreference || "Any"} />
                <DL label="Smoking / drinking" value={`${property.smokingPreference || "Any"} / ${property.drinkingPreference || "Any"}`} />
              </dl>
            </Section>
          )}
        </div>

        {/* Owner contact card */}
        <aside className="lg:sticky lg:top-24 h-fit rounded-2xl border border-line bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary font-display font-semibold">
              {property.owner?.name?.[0] ?? "?"}
            </div>
            <div>
              <p className="flex items-center gap-1 font-semibold text-ink text-sm">
                {property.owner?.name}
                {property.owner?.isPhoneVerified && <BadgeCheck size={14} className="text-verified" />}
              </p>
              <p className="text-xs text-ink-soft">{property.owner?.userType === "OWNER" ? "Property Owner" : "Verified Agent"}</p>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-4 text-xs text-ink-soft">
            <span>Response rate <b className="text-ink">92%</b></span>
            <span>Response time <b className="text-ink">within a day</b></span>
          </div>

          {property.owner?.phone ? (
            <a href={`tel:${property.owner.phone}`} className="mt-4 flex items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-semibold text-white">
              <Phone size={16} /> Call {property.owner.phone}
            </a>
          ) : (
            <button
              onClick={contactOwner}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-semibold text-white hover:bg-primary-light"
            >
              <Phone size={16} /> Reveal &amp; Call Owner
            </button>
          )}

          <button
            onClick={chatWithOwner}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-full border border-line py-3 text-sm font-semibold text-ink"
          >
            <MessageCircle size={16} /> Chat with poster
          </button>

          <button
            onClick={() => (user ? setVisitOpen(true) : notify("Log in to request a visit.", "info"))}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-full border border-line py-3 text-sm font-semibold text-ink"
          >
            <CalendarPlus size={16} /> Request Visit
          </button>

          {property.owner?.phone && (
            <a
              href={`https://wa.me/91${property.owner.phone}`}
              target="_blank"
              rel="noreferrer"
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-full border border-verified/30 bg-verified-soft py-3 text-sm font-semibold text-verified"
            >
              WhatsApp Owner
            </a>
          )}

          <p className="mt-3 text-center text-[11px] text-ink-soft">
            Phone number stays hidden until you send an enquiry — a fraud-prevention measure for owners and tenants alike.
          </p>
        </aside>
      </div>

      {/* Sticky mobile contact bar */}
      <div className="fixed bottom-14 left-0 right-0 z-30 border-t border-line bg-white p-3 lg:hidden">
        <button onClick={contactOwner} className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-semibold text-white">
          <Phone size={16} /> Contact Owner
        </button>
      </div>

      {/* Fullscreen gallery */}
      {galleryOpen && (
        <div className="fixed inset-0 z-[60] bg-black/95 flex flex-col">
          <button onClick={() => setGalleryOpen(false)} className="absolute right-4 top-4 text-white" aria-label="Close gallery">
            <X size={26} />
          </button>
          <div className="flex-1 flex items-center justify-center p-6">
            <img src={images[activeImage]} alt="" className="max-h-full max-w-full object-contain" />
          </div>
          <div className="flex justify-center gap-2 pb-6 overflow-x-auto px-4">
            {images.map((img, i) => (
              <button key={i} onClick={() => setActiveImage(i)} className={`h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 ${i === activeImage ? "border-white" : "border-transparent opacity-60"}`}>
                <img src={img} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Request visit modal */}
      {visitOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/40 p-4">
          <form onSubmit={requestVisit} className="w-full max-w-sm rounded-2xl bg-white p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-semibold">Request a visit</h3>
              <button type="button" onClick={() => setVisitOpen(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <label className="block text-sm font-medium text-ink mb-1.5" htmlFor="visit-date">Preferred date &amp; time</label>
            <input
              id="visit-date"
              type="datetime-local"
              required
              value={visitDate}
              onChange={(e) => setVisitDate(e.target.value)}
              className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-primary"
            />
            <button type="submit" className="mt-4 w-full rounded-full bg-primary py-3 text-sm font-semibold text-white">
              Confirm request
            </button>
          </form>
        </div>
      )}

      <div className="mt-8">
        <Link to="/properties" className="text-sm font-medium text-primary hover:underline">
          ← Back to search results
        </Link>
      </div>
    </div>
  );
}

function InfoStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-white p-3 text-center">
      <div className="flex justify-center text-primary mb-1">{icon}</div>
      <p className="text-sm font-semibold text-ink">{value}</p>
      <p className="text-[11px] text-ink-soft">{label}</p>
    </div>
  );
}

function PriceStat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-[11px] text-ink-soft mb-0.5">{label}</p>
      <p className={`price-figure font-display font-semibold ${highlight ? "text-primary text-lg" : "text-ink text-base"}`}>{value}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-8">
      <h2 className="font-display text-lg font-semibold text-ink mb-3">{title}</h2>
      {children}
    </div>
  );
}

function getVideoEmbedUrl(videoUrl?: string | null) {
  if (!videoUrl) return null;

  try {
    const url = new URL(videoUrl);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtube.com" || host === "m.youtube.com") {
      const videoId = url.searchParams.get("v");
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    }

    if (host === "youtu.be") {
      const videoId = url.pathname.replace("/", "");
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    }

    if (host === "vimeo.com") {
      const videoId = url.pathname.split("/").filter(Boolean)[0];
      if (videoId) return `https://player.vimeo.com/video/${videoId}`;
    }

    return videoUrl;
  } catch {
    return null;
  }
}

function DL({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] text-ink-soft">{label}</dt>
      <dd className="text-ink font-medium">{value}</dd>
    </div>
  );
}
