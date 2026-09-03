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
  const [users, setUsers] = useState<Awaited<ReturnType<typeof api.admin.users>>["results"] | null>(null);

  async function load() {
    try {
      const res = view === "all" ? await api.admin.allProperties() : await api.admin.pendingProperties();
      setListings(res.results);
    } catch (err) {
      setListings([]);
    }
  }

  useEffect(() => { load(); }, [view]);

  useEffect(() => {
    if (searchParams.get("view") !== "users") return;
    api.admin.users().then((res) => setUsers(res.results)).catch(() => setUsers([]));
  }, [searchParams]);

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
            {searchParams.get("view") === "users" ? "All registered users and their account activity" : view === "all" ? "All properties in the system" : "Pending listings waiting for review"}
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
          <button
            onClick={() => setSearchParams({ view: "users" })}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${searchParams.get("view") === "users" ? "bg-primary text-white" : "text-ink-soft"}`}
          >
            All users
          </button>
        </div>
      </div>
      {searchParams.get("view") === "users" ? (
        users === null ? <p>Loading users...</p> : users.length === 0 ? <p>No users found</p> : (
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.id} className="rounded-xl border border-line bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold text-ink">{user.name}</h2>
                      <span className="rounded-full bg-primary-soft px-2 py-1 text-[11px] font-semibold text-primary">{user.userType}</span>
                      {user.isPhoneVerified && <span className="text-xs font-medium text-verified">Phone verified</span>}
                    </div>
                    <p className="mt-1 text-sm text-ink-soft">{user.email}</p>
                    <p className="mt-1 text-sm text-ink">Phone: {user.phone || user.adminPhone || "Not provided"}</p>
                    <p className="mt-1 text-xs text-ink-soft">Joined {new Date(user.createdAt).toLocaleDateString("en-IN")}</p>
                  </div>
                  <div className="text-sm text-ink-soft">
                    <p>Location: {user.preferredLocation || "Not set"}</p>
                    <p>Budget: {user.budgetMin ?? "—"} - {user.budgetMax ?? "—"}</p>
                    <p>Preference: {user.propertyPreference || "Not set"}</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 border-t border-line pt-3 text-xs text-ink-soft sm:grid-cols-4">
                  <span>Properties: {user._count.properties}</span>
                  <span>Favorites: {user._count.favorites}</span>
                  <span>Enquiries: {user._count.enquiriesSent}</span>
                  <span>Messages: {user._count.messages}</span>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        listings === null ? (
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
        )
      )}
    </div>
  );
}
