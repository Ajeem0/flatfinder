import { X } from "lucide-react";

export interface FilterState {
  city: string;
  minRent: string;
  maxRent: string;
  propertyType: string;
  bhk: string[];
  furnishing: string[];
  bachelorFriendly: boolean;
  familyFriendly: boolean;
  parking: boolean;
  lift: boolean;
  security: boolean;
  ac: boolean;
  wifi: boolean;
  attachedBathroom: boolean;
  petFriendly: boolean;
  noBrokerage: boolean;
  ownerListed: boolean;
}

export const EMPTY_FILTERS: FilterState = {
  city: "",
  minRent: "",
  maxRent: "",
  propertyType: "",
  bhk: [],
  furnishing: [],
  bachelorFriendly: false,
  familyFriendly: false,
  parking: false,
  lift: false,
  security: false,
  ac: false,
  wifi: false,
  attachedBathroom: false,
  petFriendly: false,
  noBrokerage: false,
  ownerListed: false,
};

interface Props {
  filters: FilterState;
  onChange: (patch: Partial<FilterState>) => void;
  onClear: () => void;
  className?: string;
}

const AMENITY_TOGGLES: { key: keyof FilterState; label: string }[] = [
  { key: "parking", label: "Parking" },
  { key: "lift", label: "Lift" },
  { key: "security", label: "Security" },
  { key: "ac", label: "AC" },
  { key: "wifi", label: "Wi-Fi" },
  { key: "attachedBathroom", label: "Attached Bathroom" },
];

export default function FilterSidebar({ filters, onChange, onClear, className = "" }: Props) {
  function toggleArrayValue(key: "bhk" | "furnishing", value: string) {
    const current = filters[key];
    onChange({ [key]: current.includes(value) ? current.filter((v) => v !== value) : [...current, value] } as Partial<FilterState>);
  }

  return (
    <aside className={`flex flex-col gap-6 ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-ink">Filters</h2>
        <button onClick={onClear} className="text-xs font-medium text-primary hover:underline">
          Clear all
        </button>
      </div>

      <FilterGroup title="Location">
        <input
          value={filters.city}
          onChange={(e) => onChange({ city: e.target.value })}
          placeholder="City or area"
          className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </FilterGroup>

      <FilterGroup title="Budget (₹/month)">
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            value={filters.minRent}
            onChange={(e) => onChange({ minRent: e.target.value })}
            placeholder="Min"
            className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <span className="text-ink-soft">–</span>
          <input
            type="number"
            min={0}
            value={filters.maxRent}
            onChange={(e) => onChange({ maxRent: e.target.value })}
            placeholder="Max"
            className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>
      </FilterGroup>

      <FilterGroup title="Property type">
        <select
          value={filters.propertyType}
          onChange={(e) => onChange({ propertyType: e.target.value })}
          className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-primary"
        >
          <option value="">Any type</option>
          <option value="APARTMENT">Apartment</option>
          <option value="INDEPENDENT_HOUSE">Independent House</option>
          <option value="VILLA">Villa</option>
          <option value="PG">PG</option>
          <option value="ROOM">Room</option>
          <option value="FLATMATE">Flatmate</option>
        </select>
      </FilterGroup>

      <FilterGroup title="Bedrooms">
        <div className="flex flex-wrap gap-2">
          {["1", "2", "3", "4"].map((b) => (
            <Chip key={b} active={filters.bhk.includes(b)} onClick={() => toggleArrayValue("bhk", b)}>
              {b === "4" ? "4+ BHK" : `${b} BHK`}
            </Chip>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Furnishing">
        <div className="flex flex-wrap gap-2">
          {[
            ["FURNISHED", "Furnished"],
            ["SEMI_FURNISHED", "Semi-furnished"],
            ["UNFURNISHED", "Unfurnished"],
          ].map(([val, label]) => (
            <Chip key={val} active={filters.furnishing.includes(val)} onClick={() => toggleArrayValue("furnishing", val)}>
              {label}
            </Chip>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Amenities">
        <div className="flex flex-wrap gap-2">
          {AMENITY_TOGGLES.map(({ key, label }) => (
            <Chip key={key} active={Boolean(filters[key])} onClick={() => onChange({ [key]: !filters[key] } as Partial<FilterState>)}>
              {label}
            </Chip>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Preferences">
        <div className="flex flex-col gap-2">
          <Checkbox checked={filters.bachelorFriendly} onChange={(v) => onChange({ bachelorFriendly: v })} label="Bachelor friendly" />
          <Checkbox checked={filters.familyFriendly} onChange={(v) => onChange({ familyFriendly: v })} label="Family friendly" />
          <Checkbox checked={filters.petFriendly} onChange={(v) => onChange({ petFriendly: v })} label="Pet friendly" />
          <Checkbox checked={filters.noBrokerage} onChange={(v) => onChange({ noBrokerage: v })} label="No brokerage" />
          <Checkbox checked={filters.ownerListed} onChange={(v) => onChange({ ownerListed: v })} label="Owner listed only" />
        </div>
      </FilterGroup>
    </aside>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-ink mb-2">{title}</h3>
      {children}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
        active ? "border-primary bg-primary-soft text-primary" : "border-line text-ink-soft hover:border-primary/50"
      }`}
    >
      {children}
    </button>
  );
}

function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 rounded border-line accent-[var(--color-primary)]" />
      {label}
    </label>
  );
}

export function ActiveFilterPills({ filters, onChange }: { filters: FilterState; onChange: (patch: Partial<FilterState>) => void }) {
  const pills: { label: string; clear: () => void }[] = [];
  if (filters.city) pills.push({ label: filters.city, clear: () => onChange({ city: "" }) });
  if (filters.minRent || filters.maxRent)
    pills.push({
      label: `₹${filters.minRent || "0"}–${filters.maxRent || "∞"}`,
      clear: () => onChange({ minRent: "", maxRent: "" }),
    });
  filters.bhk.forEach((b) => pills.push({ label: b === "4" ? "4+ BHK" : `${b} BHK`, clear: () => onChange({ bhk: filters.bhk.filter((v) => v !== b) }) }));
  filters.furnishing.forEach((f) =>
    pills.push({ label: f.replace("_", " ").toLowerCase(), clear: () => onChange({ furnishing: filters.furnishing.filter((v) => v !== f) }) })
  );

  if (!pills.length) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {pills.map((p, i) => (
        <span key={i} className="flex items-center gap-1 rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-primary capitalize">
          {p.label}
          <button onClick={p.clear} aria-label={`Remove ${p.label} filter`}>
            <X size={12} />
          </button>
        </span>
      ))}
    </div>
  );
}
