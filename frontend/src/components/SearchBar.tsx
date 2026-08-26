import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Home as HomeIcon, Wallet, Search as SearchIcon, Sparkles } from "lucide-react";

const BHK_OPTIONS = ["Any", "1", "2", "3", "4+"];
const BUDGETS = [
  { label: "Any budget", min: "", max: "" },
  { label: "Under ₹15,000", min: "", max: "15000" },
  { label: "₹15,000 – ₹30,000", min: "15000", max: "30000" },
  { label: "₹30,000 – ₹50,000", min: "30000", max: "50000" },
  { label: "Above ₹50,000", min: "50000", max: "" },
];

export default function SearchBar() {
  const navigate = useNavigate();
  const [smartMode, setSmartMode] = useState(false);
  const [smartQuery, setSmartQuery] = useState("");
  const [city, setCity] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [bhk, setBhk] = useState("Any");
  const [budgetIdx, setBudgetIdx] = useState(0);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();

    if (smartMode && smartQuery.trim()) {
      params.set("q", smartQuery.trim());
      navigate(`/properties?${params.toString()}`);
      return;
    }

    if (city.trim()) params.set("city", city.trim());
    if (propertyType) params.set("propertyType", propertyType);
    if (bhk !== "Any") params.set("bhk", bhk === "4+" ? "4" : bhk);
    const budget = BUDGETS[budgetIdx];
    if (budget.min) params.set("minRent", budget.min);
    if (budget.max) params.set("maxRent", budget.max);

    navigate(`/properties?${params.toString()}`);
  }

  return (
    <div className="rounded-2xl border border-line bg-white/95 backdrop-blur shadow-xl p-3 sm:p-4">
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
          {smartMode ? "Smart search" : "Guided search"}
        </span>
        <button
          type="button"
          onClick={() => setSmartMode((s) => !s)}
          className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
        >
          <Sparkles size={13} />
          {smartMode ? "Use filters instead" : "Try natural language"}
        </button>
      </div>

      {smartMode ? (
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 flex items-center gap-2 rounded-xl border border-line px-3 py-3">
            <SearchIcon size={16} className="text-ink-soft shrink-0" />
            <input
              value={smartQuery}
              onChange={(e) => setSmartQuery(e.target.value)}
              placeholder='Try "2 BHK under 20k in Jaipur"'
              className="w-full bg-transparent text-sm outline-none placeholder:text-ink-soft/70"
            />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-light transition-colors"
          >
            Search
          </button>
        </form>
      ) : (
        <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_0.8fr_1.2fr_auto] gap-2">
          <label className="flex items-center gap-2 rounded-xl border border-line px-3 py-3">
            <MapPin size={16} className="text-primary shrink-0" />
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City or locality"
              className="w-full bg-transparent text-sm outline-none placeholder:text-ink-soft/70"
              aria-label="Location"
            />
          </label>

          <label className="flex items-center gap-2 rounded-xl border border-line px-3 py-3">
            <HomeIcon size={16} className="text-primary shrink-0" />
            <select
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
              className="w-full bg-transparent text-sm outline-none"
              aria-label="Property type"
            >
              <option value="">Any type</option>
              <option value="APARTMENT">Apartment</option>
              <option value="INDEPENDENT_HOUSE">Independent House</option>
              <option value="VILLA">Villa</option>
              <option value="PG">PG</option>
              <option value="ROOM">Room</option>
              <option value="FLATMATE">Flatmate</option>
            </select>
          </label>

          <label className="flex items-center gap-2 rounded-xl border border-line px-3 py-3">
            <select
              value={bhk}
              onChange={(e) => setBhk(e.target.value)}
              className="w-full bg-transparent text-sm outline-none"
              aria-label="Bedrooms"
            >
              {BHK_OPTIONS.map((b) => (
                <option key={b} value={b}>
                  {b === "Any" ? "Any BHK" : `${b} BHK`}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 rounded-xl border border-line px-3 py-3">
            <Wallet size={16} className="text-primary shrink-0" />
            <select
              value={budgetIdx}
              onChange={(e) => setBudgetIdx(Number(e.target.value))}
              className="w-full bg-transparent text-sm outline-none"
              aria-label="Budget"
            >
              {BUDGETS.map((b, i) => (
                <option key={b.label} value={i}>
                  {b.label}
                </option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-light transition-colors"
          >
            <SearchIcon size={16} />
            <span className="lg:hidden">Search</span>
          </button>
        </form>
      )}
    </div>
  );
}
