import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import type { Property } from "../types";
import { useToast } from "../context/ToastContext";

export default function AdminListings() {
  const [listings, setListings] = useState<Property[] | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const { notify } = useToast();
  const view = searchParams.get("view") === "all" ? "all" : "pending";

  async function load() {
    try {
      const res = view === "all" ? await api.admin.allProperties() : await api.admin.pendingProperties();
      setListings(res.results);
    } catch (err) {
      setListings([]);
    }
  }

  useEffect(() => { load(); }, [view]);

  async function approve(id: string) {
    try {
      await api.admin.approveProperty(id);
      notify("Listing approved", "success");
      setListings((prev) => prev?.filter((p) => p.id !== id) ?? prev);
    } catch {
      notify("Failed to approve", "error");
    }
  }

  async function reject(id: string) {
    try {
      await api.admin.rejectProperty(id);
      notify("Listing rejected", "success");
      setListings((prev) => prev?.filter((p) => p.id !== id) ?? prev);
    } catch {
      notify("Failed to reject", "error");
    }
  }

  async function remove(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await api.properties.remove(id);
      notify("Listing deleted", "success");
      setListings((prev) => prev?.filter((p) => p.id !== id) ?? prev);
    } catch {
      notify("Failed to delete", "error");
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-semibold">Admin properties</h1>
          <p className="text-sm text-ink-soft mt-0.5">
            {view === "all" ? "All properties in the system" : "Pending listings waiting for review"}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-line p-1">
          <button
            onClick={() => setSearchParams({ view: "pending" })}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${view === "pending" ? "bg-primary text-white" : "text-ink-soft"}`}
          >
            Pending
          </button>
          <button
            onClick={() => setSearchParams({ view: "all" })}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${view === "all" ? "bg-primary text-white" : "text-ink-soft"}`}
          >
            All properties
          </button>
        </div>
      </div>
      {listings === null ? (
        <p>Loading...</p>
      ) : listings.length === 0 ? (
        <p>{view === "all" ? "No properties found" : "No pending listings"}</p>
      ) : (
        <div className="space-y-4">
          {listings.map((p) => (
            <div key={p.id} className="border rounded p-4 flex justify-between items-start">
              <div>
                <div className="font-medium">{p.title}</div>
                <div className="text-sm text-ink-soft">{p.city} — {p.locationName}</div>
                {(p.latitude != null || p.longitude != null) && (
                  <div className="text-xs text-ink-soft mt-1">
                    Coordinates: {p.latitude ?? "—"}, {p.longitude ?? "—"}
                  </div>
                )}
                <div className="text-xs text-ink-soft mt-2">{p.description}</div>
              </div>
              <div className="flex flex-col gap-2 min-w-[160px]">
                <Link to={`/admin/properties/${p.id}/edit`} className="rounded-lg border border-primary px-4 py-2 text-center text-sm font-semibold text-primary hover:bg-primary-soft">
                  Edit property
                </Link>
                {view === "pending" ? (
                  <>
                    <button onClick={() => approve(p.id)} className="rounded bg-green-600 text-white px-3 py-1">Approve &amp; publish</button>
                    <button onClick={() => reject(p.id)} className="rounded border border-line px-3 py-1 text-ink">Reject</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => remove(p.id, p.title)} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700">
                      Remove property
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
