import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { SlidersHorizontal, LayoutGrid, List, X } from "lucide-react";
import PropertyCard from "../components/PropertyCard";
import FilterSidebar, { ActiveFilterPills, EMPTY_FILTERS, type FilterState } from "../components/FilterSidebar";
import { CardSkeletonGrid, EmptyState, ErrorState } from "../components/States";
import { api, ApiError, clearPropertySearchCache } from "../lib/api";
import type { Property } from "../types";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

function filtersFromParams(params: URLSearchParams): FilterState {
  return {
    ...EMPTY_FILTERS,
    city: params.get("city") || "",
    minRent: params.get("minRent") || "",
    maxRent: params.get("maxRent") || "",
    propertyType: params.get("propertyType") || "",
    bhk: params.get("bhk")?.split(",").filter(Boolean) || [],
    furnishing: params.get("furnishing")?.split(",").filter(Boolean) || [],
    bachelorFriendly: params.get("bachelorFriendly") === "true",
    familyFriendly: params.get("familyFriendly") === "true",
    parking: params.get("parking") === "true",
    lift: params.get("lift") === "true",
    security: params.get("security") === "true",
    ac: params.get("ac") === "true",
    wifi: params.get("wifi") === "true",
    attachedBathroom: params.get("attachedBathroom") === "true",
    petFriendly: params.get("petFriendly") === "true",
    noBrokerage: params.get("noBrokerage") === "true",
    ownerListed: params.get("ownerListed") === "true",
  };
}

function buildParams(filters: FilterState, sort: string, page: number, q: string | null) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (filters.city) params.set("city", filters.city);
  if (filters.minRent) params.set("minRent", filters.minRent);
  if (filters.maxRent) params.set("maxRent", filters.maxRent);
  if (filters.propertyType) params.set("propertyType", filters.propertyType);
  if (filters.bhk.length) params.set("bhk", filters.bhk.join(","));
  if (filters.furnishing.length) params.set("furnishing", filters.furnishing.join(","));
  (["bachelorFriendly", "familyFriendly", "parking", "lift", "security", "ac", "wifi", "attachedBathroom", "petFriendly", "noBrokerage", "ownerListed"] as const).forEach(
    (key) => {
      if (filters[key]) params.set(key, "true");
    }
  );
  params.set("sort", sort);
  params.set("page", String(page));
  params.set("pageSize", "9");
  return params;
}

export default function Properties() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get("q");
  const [filters, setFilters] = useState<FilterState>(() => filtersFromParams(searchParams));
  const [sort, setSort] = useState(searchParams.get("sort") || "relevance");
  const [page, setPage] = useState(1);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const [results, setResults] = useState<Property[] | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const { user, loading: authLoading } = useAuth();
  const { notify } = useToast();
  const location = useLocation();
  const [hasMore, setHasMore] = useState(false);

  const fetchResults = useCallback(async () => {
    if (authLoading) return;
    setResults(null);
    setError(null);
    try {
      const params = buildParams(filters, sort, page, q);
      const res = await api.properties.search(params, `properties:${user?.id || "guest"}`);
      setResults(res.results);
      setTotal(res.pagination.total);
      setTotalPages(res.pagination.totalPages || 1);
      setHasMore(Boolean(res.hasMore));
    } catch (err) {
      setResults([]);
      setError(err instanceof ApiError ? err.message : "Something went wrong loading properties.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, filters, sort, page, q, user?.id]);

  // Debounced fetch so typing in the city/budget fields doesn't spam the API.
  useEffect(() => {
    const handle = setTimeout(fetchResults, 150);
    return () => clearTimeout(handle);
  }, [fetchResults]);

  useEffect(() => {
    setPage(1);
  }, [filters, sort, q]);

  // Keep the URL shareable/bookmarkable
  useEffect(() => {
    const params = buildParams(filters, sort, page, q);
    setSearchParams(params, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, sort, page]);

  function updateFilters(patch: Partial<FilterState>) {
    setFilters((f) => ({ ...f, ...patch }));
  }

  async function toggleFavorite(id: string) {
    if (!user) {
      notify("Log in to save properties to your favorites.", "info");
      return;
    }
    try {
      const { favorited } = await api.properties.toggleFavorite(id);
      clearPropertySearchCache();
      setResults((prev) => prev?.map((p) => (p.id === id ? { ...p, isFavorited: favorited } : p)) ?? prev);
      notify(favorited ? "Saved to favorites" : "Removed from favorites", "success");
    } catch {
      notify("Couldn't update favorites right now.", "error");
    }
  }

  const heading = useMemo(() => {
    if (q) return `Results for "${q}"`;
    if (filters.city) return `Properties in ${filters.city}`;
    return "All properties";
  }, [q, filters.city]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 pb-24 lg:pb-8">
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
        <div data-reveal>
          <FilterSidebar filters={filters} onChange={updateFilters} onClear={() => setFilters(EMPTY_FILTERS)} className="hidden lg:flex" />
        </div>

        <div>
          <div className="mb-2 flex flex-col gap-3" data-reveal>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="font-display text-2xl font-semibold text-ink">{heading}</h1>
                <p className="mt-0.5 text-sm text-ink-soft">{results === null ? "Searching..." : `${total} propert${total === 1 ? "y" : "ies"} found`}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setMobileFiltersOpen(true)}
                className="lg:hidden flex items-center gap-1.5 rounded-full border border-line px-3 py-2 text-xs font-medium text-ink"
              >
                <SlidersHorizontal size={14} /> Filters
              </button>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="min-w-0 flex-1 rounded-full border border-line px-3 py-2 text-xs font-medium text-ink outline-none focus:border-primary sm:flex-none"
                aria-label="Sort by"
              >
                <option value="relevance">Sort: Relevance</option>
                <option value="newest">Sort: Newest</option>
                <option value="price_asc">Sort: Price (low to high)</option>
                <option value="price_desc">Sort: Price (high to low)</option>
              </select>
              <div className="hidden sm:flex items-center rounded-full border border-line p-0.5">
                <button
                  onClick={() => setView("grid")}
                  aria-label="Grid view"
                  aria-pressed={view === "grid"}
                  className={`rounded-full p-1.5 ${view === "grid" ? "bg-primary text-white" : "text-ink-soft"}`}
                >
                  <LayoutGrid size={14} />
                </button>
                <button
                  onClick={() => setView("list")}
                  aria-label="List view"
                  aria-pressed={view === "list"}
                  className={`rounded-full p-1.5 ${view === "list" ? "bg-primary text-white" : "text-ink-soft"}`}
                >
                  <List size={14} />
                </button>
              </div>
            </div>
          </div>

          <ActiveFilterPills filters={filters} onChange={updateFilters} />

          {results === null ? (
            <CardSkeletonGrid count={9} />
          ) : error ? (
            <ErrorState message={error} onRetry={fetchResults} />
          ) : results.length === 0 ? (
            <EmptyState
              title="No properties match these filters"
              description="Try widening your budget range or clearing a few filters."
              action={
                <button onClick={() => setFilters(EMPTY_FILTERS)} className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-white">
                  Clear filters
                </button>
              }
            />
          ) : (
            <>
              <div className={view === "grid" ? "grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3" : "flex flex-col gap-4"}>
                {results.map((p, index) => (
                  <PropertyCard key={p.id} property={p} onToggleFavorite={toggleFavorite} revealDelay={index * 60} />
                ))}
              </div>

              {!user && hasMore && results.length === 3 && (
                <div className="relative mt-8 overflow-hidden rounded-2xl border border-line bg-primary-soft" data-reveal>
                  <div aria-hidden="true" className="grid grid-cols-1 gap-5 p-5 opacity-55 blur-md sm:grid-cols-2 xl:grid-cols-3">
                    {[1, 2, 3].map((placeholder) => (
                      <div key={placeholder} className="h-52 rounded-2xl border border-line bg-white p-4">
                        <div className="h-28 rounded-xl bg-line/70" />
                        <div className="mt-4 h-4 w-3/4 rounded-full bg-line/70" />
                        <div className="mt-3 h-3 w-1/2 rounded-full bg-line/60" />
                      </div>
                    ))}
                  </div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 px-4 text-center backdrop-blur-sm">
                    <h2 className="font-display text-lg font-semibold text-ink">Login first to view more flats</h2>
                    <p className="mt-1 text-sm text-ink-soft">Sign in to see all available listings.</p>
                    <Link
                      to="/login"
                      state={{ from: { pathname: location.pathname, search: location.search } }}
                      className="mt-4 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-light"
                    >
                      Login / Sign In
                    </Link>
                  </div>
                </div>
              )}

              {user && totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="rounded-full border border-line px-4 py-2 text-sm font-medium text-ink disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-ink-soft px-2">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="rounded-full border border-line px-4 py-2 text-sm font-medium text-ink disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/45 backdrop-blur-[2px]" onClick={() => setMobileFiltersOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 mx-auto h-[88vh] max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-[28px] bg-white p-5 shadow-[0_-18px_40px_rgba(20,22,43,0.18)]">
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-line" />
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-ink">Filters</h2>
              <button onClick={() => setMobileFiltersOpen(false)} aria-label="Close filters" className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white">
                <X size={20} />
              </button>
            </div>
            <div className="pb-2">
              <FilterSidebar filters={filters} onChange={updateFilters} onClear={() => setFilters(EMPTY_FILTERS)} />
            </div>
            <button
              onClick={() => setMobileFiltersOpen(false)}
              className="mt-6 w-full rounded-full bg-primary py-3.5 text-sm font-semibold text-white shadow-sm"
            >
              Show {total} results
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
