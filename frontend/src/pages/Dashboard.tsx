import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, MessageSquare, CalendarDays, Home, Eye, PlusCircle, Trash2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import type { Enquiry, FavoriteItem, Property, Visit } from "../types";
import { formatDate, formatRent } from "../lib/format";
import { EmptyState } from "../components/States";
import { useToast } from "../context/ToastContext";

export default function Dashboard() {
  const { user } = useAuth();
  const isOwner = user?.userType === "OWNER" || user?.userType === "AGENT";
  const isAdmin = user?.userType === "ADMIN";

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 pb-24 lg:pb-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">
            {isOwner ? "Owner dashboard" : "My dashboard"}
          </h1>
          <p className="text-sm text-ink-soft mt-0.5">Welcome back, {user?.name}.</p>
        </div>
        {isOwner && (
          <Link to="/post-property" className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white">
            <PlusCircle size={16} /> Add property
          </Link>
        )}
        {isAdmin && (
          <Link to="/admin/listings" className="flex items-center gap-1.5 rounded-full border border-line px-4 py-2.5 text-sm font-semibold text-ink hover:border-primary hover:text-primary">
            Approve listings
          </Link>
        )}
      </div>

      {isAdmin && <AdminProfile />}
      {isOwner ? <OwnerDashboard /> : <TenantDashboard />}
    </div>
  );
}

function AdminProfile() {
  const { user, refreshUser } = useAuth();
  const { notify } = useToast();
  const [phone, setPhone] = useState(user?.adminPhone || "");
  const [saving, setSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  async function savePhone() {
    setSaving(true);
    try {
      await api.auth.updateMe({ adminPhone: phone.trim() || null });
      await refreshUser();
      notify("Admin phone number updated", "success");
    } catch {
      notify("Could not update admin phone number", "error");
    } finally {
      setSaving(false);
    }
  }

  async function savePassword() {
    if (newPassword.length < 6) return notify("New password must be at least 6 characters", "error");
    if (newPassword !== confirmPassword) return notify("New passwords do not match", "error");
    setSavingPassword(true);
    try {
      await api.auth.updateAdminPassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      notify("Admin password updated", "success");
    } catch (err) {
      notify(err instanceof Error ? err.message : "Could not update admin password", "error");
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <section className="mb-8 rounded-2xl border border-line bg-white p-5 sm:p-6">
      <h2 className="font-display text-lg font-semibold text-ink">Admin profile</h2>
      <p className="mt-1 text-sm text-ink-soft">Update the phone number linked to your admin account.</p>
      <div className="mt-4 flex max-w-md flex-col gap-2 sm:flex-row sm:items-end">
        <label className="flex-1 text-sm font-medium text-ink">
          Phone number
          <input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+91 98765 43210" className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5 font-normal outline-none focus:border-primary" />
        </label>
        <button onClick={savePhone} disabled={saving} className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
          {saving ? "Saving..." : "Save number"}
        </button>
      </div>
      <div className="mt-6 border-t border-line pt-5">
        <h3 className="font-display text-base font-semibold text-ink">Change admin password</h3>
        <div className="mt-3 grid max-w-md gap-3">
          <input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} placeholder="Current password" autoComplete="current-password" className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-primary" />
          <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="New password (6+ characters)" autoComplete="new-password" className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-primary" />
          <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Confirm new password" autoComplete="new-password" className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-primary" />
          <button onClick={savePassword} disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword} className="w-fit rounded-lg border border-primary px-4 py-2.5 text-sm font-semibold text-primary disabled:opacity-50">
            {savingPassword ? "Updating..." : "Update password"}
          </button>
        </div>
      </div>
    </section>
  );
}

function TenantDashboard() {
  const [favorites, setFavorites] = useState<FavoriteItem[] | null>(null);
  const [enquiries, setEnquiries] = useState<Enquiry[] | null>(null);
  const [visits, setVisits] = useState<Visit[] | null>(null);

  useEffect(() => {
    api.favorites.list().then((r) => setFavorites(r.results)).catch(() => setFavorites([]));
    api.enquiries.list().then((r) => setEnquiries(r.results)).catch(() => setEnquiries([]));
    api.visits.list().then((r) => setVisits(r.results)).catch(() => setVisits([]));
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={<Heart size={16} />} label="Saved properties" value={favorites?.length ?? "—"} />
        <StatCard icon={<MessageSquare size={16} />} label="Enquiries sent" value={enquiries?.length ?? "—"} />
        <StatCard icon={<CalendarDays size={16} />} label="Scheduled visits" value={visits?.length ?? "—"} />
        <StatCard icon={<Home size={16} />} label="Posted properties" value={0} />
      </div>

      <DashboardSection title="My enquiries">
        {enquiries === null ? (
          <p className="text-sm text-ink-soft">Loading...</p>
        ) : enquiries.length === 0 ? (
          <EmptyState title="No enquiries yet" description="Contact an owner from a property page to see it here." />
        ) : (
          <div className="flex flex-col divide-y divide-line rounded-2xl border border-line bg-white">
            {enquiries.map((e) => (
              <div key={e.id} className="flex items-center justify-between gap-3 p-4">
                <div>
                  <Link to={`/property/${e.property.slug}`} className="font-medium text-sm text-ink hover:text-primary">{e.property.title}</Link>
                  <p className="text-xs text-ink-soft mt-0.5">{formatRent(e.property.monthlyRent)}/mo · Sent {formatDate(e.createdAt)}</p>
                </div>
                <StatusBadge status={e.status} />
              </div>
            ))}
          </div>
        )}
      </DashboardSection>

      <DashboardSection title="Scheduled visits">
        {visits === null ? (
          <p className="text-sm text-ink-soft">Loading...</p>
        ) : visits.length === 0 ? (
          <EmptyState title="No visits scheduled" description="Request a visit from any property page." />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-line bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-ink-soft">
                  <th className="p-3 font-medium">Property</th>
                  <th className="p-3 font-medium">Date</th>
                  <th className="p-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {visits.map((v) => (
                  <tr key={v.id} className="border-b border-line last:border-0">
                    <td className="p-3"><Link to={`/property/${v.property.slug}`} className="hover:text-primary">{v.property.title}</Link></td>
                    <td className="p-3 text-ink-soft">{new Date(v.scheduledDate).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</td>
                    <td className="p-3"><StatusBadge status={v.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DashboardSection>
    </div>
  );
}

function OwnerDashboard() {
  const { user } = useAuth();
  const { notify } = useToast();
  const [listings, setListings] = useState<Property[] | null>(null);
  const [enquiries, setEnquiries] = useState<Enquiry[] | null>(null);
  const [visits, setVisits] = useState<Visit[] | null>(null);

  async function loadListings() {
    if (!user) return;
    // Fetch the authenticated user's properties (includes pending listings)
    const res = await api.properties.mine();
    setListings(res.results);
  }

  useEffect(() => {
    loadListings().catch(() => setListings([]));
    api.enquiries.list(true).then((r) => setEnquiries(r.results)).catch(() => setEnquiries([]));
    api.visits.list(true).then((r) => setVisits(r.results)).catch(() => setVisits([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  async function deleteListing(id: string) {
    if (!confirm("Delete this listing? This can't be undone.")) return;
    try {
      await api.properties.remove(id);
      setListings((prev) => prev?.filter((p) => p.id !== id) ?? prev);
      notify("Listing deleted", "success");
    } catch {
      notify("Couldn't delete that listing right now.", "error");
    }
  }

  async function markRented(id: string) {
    try {
      await api.properties.update(id, { status: "RENTED" });
      setListings((prev) => prev?.map((p) => (p.id === id ? { ...p, status: "RENTED" } : p)) ?? prev);
      notify("Marked as rented", "success");
    } catch {
      notify("Couldn't update that listing right now.", "error");
    }
  }

  const totalViews = listings?.reduce((sum, p) => sum + p.viewCount, 0) ?? 0;

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={<Home size={16} />} label="Live listings" value={listings?.length ?? "—"} />
        <StatCard icon={<Eye size={16} />} label="Total views" value={totalViews} />
        <StatCard icon={<MessageSquare size={16} />} label="Enquiries" value={enquiries?.length ?? "—"} />
        <StatCard icon={<CalendarDays size={16} />} label="Visits requested" value={visits?.length ?? "—"} />
      </div>

      <DashboardSection title="My listings">
        {listings === null ? (
          <p className="text-sm text-ink-soft">Loading...</p>
        ) : listings.length === 0 ? (
          <EmptyState
            title="You haven't posted a property yet"
            description="New listings appear here once submitted (and after admin approval)."
            action={<Link to="/post-property" className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-white">Post a property</Link>}
          />
        ) : (
          <div className="flex flex-col divide-y divide-line rounded-2xl border border-line bg-white">
            {listings.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 p-4 flex-wrap">
                <div>
                  <Link to={`/property/${p.slug}`} className="font-medium text-sm text-ink hover:text-primary">{p.title}</Link>
                  <p className="text-xs text-ink-soft mt-0.5">{formatRent(p.monthlyRent)}/mo · {p.viewCount} views</p>
                  {p.status === "PENDING" && (
                    <p className="mt-1 text-xs font-medium text-amber">
                      Waiting for admin approval. It will appear in Rent after it is published.
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={p.status} />
                  {p.status === "PENDING" && (
                    <span className="rounded-full bg-amber-soft px-2.5 py-1 text-[11px] font-semibold text-amber">
                      Pending review
                    </span>
                  )}
                  {p.status === "PUBLISHED" && (
                    <button onClick={() => markRented(p.id)} className="rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink">
                      Mark rented
                    </button>
                  )}
                  <button onClick={() => deleteListing(p.id)} aria-label="Delete listing" className="p-1.5 text-ink-soft hover:text-danger">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </DashboardSection>

      <DashboardSection title="Enquiries received">
        {enquiries === null ? (
          <p className="text-sm text-ink-soft">Loading...</p>
        ) : enquiries.length === 0 ? (
          <EmptyState title="No enquiries yet" />
        ) : (
          <div className="flex flex-col divide-y divide-line rounded-2xl border border-line bg-white">
            {enquiries.map((e) => (
              <div key={e.id} className="flex items-center justify-between gap-3 p-4 flex-wrap">
                <div>
                  <p className="font-medium text-sm text-ink">{e.user?.name} — <span className="text-ink-soft">{e.property.title}</span></p>
                  <p className="text-xs text-ink-soft mt-0.5">{e.user?.phone || e.user?.email} · {formatDate(e.createdAt)}</p>
                </div>
                <StatusBadge status={e.status} />
              </div>
            ))}
          </div>
        )}
      </DashboardSection>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <div className="flex items-center gap-1.5 text-ink-soft mb-2">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="font-display text-2xl font-semibold text-ink">{value}</p>
    </div>
  );
}

function DashboardSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-lg font-semibold text-ink mb-3">{title}</h2>
      {children}
    </section>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    NEW: "bg-primary-soft text-primary",
    REQUESTED: "bg-primary-soft text-primary",
    RESPONDED: "bg-verified-soft text-verified",
    CONFIRMED: "bg-verified-soft text-verified",
    COMPLETED: "bg-verified-soft text-verified",
    CLOSED: "bg-line text-ink-soft",
    CANCELLED: "bg-red-50 text-danger",
    PUBLISHED: "bg-verified-soft text-verified",
    PENDING: "bg-amber-soft text-amber",
    RENTED: "bg-line text-ink-soft",
    REJECTED: "bg-red-50 text-danger",
    ARCHIVED: "bg-line text-ink-soft",
  };
  return <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${styles[status] || "bg-line text-ink-soft"}`}>{status}</span>;
}
