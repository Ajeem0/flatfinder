import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, X } from "lucide-react";
import { api, ApiError } from "../lib/api";
import { useToast } from "../context/ToastContext";
import { AMENITY_LIST } from "../pages/PostProperty";
import type { Property } from "../types";

const fields = [
  ["title", "Title"],
  ["cityName", "City"],
  ["locationName", "Locality"],
  ["address", "Address"],
  ["pincode", "Pincode"],
  ["monthlyRent", "Monthly rent", "number"],
  ["securityDeposit", "Security deposit", "number"],
  ["maintenance", "Maintenance", "number"],
  ["brokerage", "Brokerage", "number"],
  ["bhk", "BHK", "number"],
  ["areaSqft", "Area (sq.ft)", "number"],
  ["floor", "Floor", "number"],
  ["totalFloors", "Total floors", "number"],
] as const;

type FormState = Record<string, string | boolean | string[]> & { images: string[]; amenities: string[]; videoUrl: string };
type Owner = { id: string; name: string; email: string; phone: string | null; userType: string };

function toForm(property: Property): FormState {
  return {
    title: property.title,
    cityName: property.city || "",
    locationName: property.locationName || "",
    address: property.address || "",
    pincode: property.pincode || "",
    monthlyRent: String(property.monthlyRent),
    securityDeposit: String(property.securityDeposit),
    maintenance: String(property.maintenance),
    brokerage: String(property.brokerage),
    bhk: property.bhk == null ? "" : String(property.bhk),
    areaSqft: property.areaSqft == null ? "" : String(property.areaSqft),
    floor: property.floor == null ? "" : String(property.floor),
    totalFloors: property.totalFloors == null ? "" : String(property.totalFloors),
    description: property.description,
    furnishing: property.furnishing,
    propertyType: property.propertyType,
    noBrokerage: property.noBrokerage,
    bachelorFriendly: property.bachelorFriendly,
    familyFriendly: property.familyFriendly,
    petFriendly: property.petFriendly,
    images: property.images || [],
    amenities: property.amenities || [],
    videoUrl: property.videoUrl || "",
    status: property.status,
    ownerId: property.owner?.id || "",
    ownerPhone: property.owner?.phone || "",
  };
}

export default function AdminPropertyEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { notify } = useToast();
  const [form, setForm] = useState<FormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [owners, setOwners] = useState<Owner[]>([]);

  useEffect(() => {
    if (!id) return;
    api.properties.get(id)
      .then(({ property }) => setForm(toForm(property)))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Could not load this property."))
      .finally(() => setLoading(false));
    api.admin.users().then(({ results }) => {
      setOwners(results);
      setForm((current) => {
        if (!current || !current.ownerId || current.ownerPhone) return current;
        const owner = results.find((item) => item.id === current.ownerId);
        return owner ? Object.assign({}, current, { ownerPhone: owner.phone || "" }) as FormState : current;
      });
    }).catch(() => setOwners([]));
  }, [id]);

  function update(patch: Partial<FormState>) {
    setForm((current) => current ? Object.assign({}, current, patch) as FormState : current);
  }

  async function uploadImages(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    const images = await Promise.all(files.map((file) => new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    })));
    update({ images: [...(form?.images || []), ...images] });
    event.target.value = "";
  }

  async function save() {
    if (!id || !form) return;
    setSaving(true);
    try {
      await api.properties.update(id, {
        ...form,
        monthlyRent: Number(form.monthlyRent) || 0,
        securityDeposit: Number(form.securityDeposit) || 0,
        maintenance: Number(form.maintenance) || 0,
        brokerage: Number(form.brokerage) || 0,
        bhk: form.bhk ? Number(form.bhk) : null,
        areaSqft: form.areaSqft ? Number(form.areaSqft) : null,
        floor: form.floor ? Number(form.floor) : null,
        totalFloors: form.totalFloors ? Number(form.totalFloors) : null,
        ownerId: form.ownerId,
      });
      if (form.ownerId) await api.admin.updateUserPhone(String(form.ownerId), String(form.ownerPhone || ""));
      notify("Property updated successfully", "success");
      navigate("/admin/listings?view=all");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update this property.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="mx-auto max-w-4xl px-4 py-8 text-sm text-ink-soft">Loading property...</div>;
  if (!form) return <div className="mx-auto max-w-4xl px-4 py-8 text-sm text-danger">{error || "Property not found."}</div>;

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 pb-24 lg:pb-10">
      <button onClick={() => navigate(-1)} className="mb-5 flex items-center gap-1 text-sm font-medium text-ink-soft hover:text-primary"><ArrowLeft size={16} /> Back to listings</button>
      <div className="mb-6 flex items-start justify-between gap-3">
        <div><h1 className="font-display text-2xl font-semibold text-ink">Edit property</h1><p className="mt-1 text-sm text-ink-soft">Update the listing uploaded by the owner.</p></div>
        <select value={String(form.status)} onChange={(event) => update({ status: event.target.value })} className="rounded-lg border border-line px-3 py-2 text-sm">
          {['PENDING', 'PUBLISHED', 'REJECTED', 'RENTED', 'ARCHIVED'].map((status) => <option key={status}>{status}</option>)}
        </select>
      </div>
      {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-danger">{error}</p>}
      <div className="space-y-6 rounded-2xl border border-line bg-white p-5 sm:p-6">
        <section><h2 className="mb-3 font-display text-lg font-semibold">Property information</h2><div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {fields.map(([key, label, type]) => <label key={key} className="text-sm font-medium text-ink">{label}<input type={type || "text"} value={String(form[key] ?? "")} onChange={(event) => update({ [key]: event.target.value })} className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5 font-normal outline-none focus:border-primary" /></label>)}
          <label className="text-sm font-medium text-ink">Furnishing<select value={String(form.furnishing)} onChange={(event) => update({ furnishing: event.target.value })} className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5 font-normal"><option>FURNISHED</option><option>SEMI_FURNISHED</option><option>UNFURNISHED</option></select></label>
        </div></section>
        <section><h2 className="mb-3 font-display text-lg font-semibold">Owner</h2><div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-ink">Assigned owner<select value={String(form.ownerId)} onChange={(event) => { const owner = owners.find((item) => item.id === event.target.value); update({ ownerId: event.target.value, ownerPhone: owner?.phone || "" }); }} className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5 font-normal"><option value="">Select owner</option>{owners.map((owner) => <option key={owner.id} value={owner.id}>{owner.name} ({owner.userType.toLowerCase()})</option>)}</select></label>
          <label className="text-sm font-medium text-ink">Owner phone<input type="tel" value={String(form.ownerPhone || "")} onChange={(event) => update({ ownerPhone: event.target.value })} placeholder="+91 98765 43210" className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5 font-normal outline-none focus:border-primary" /></label>
        </div></section>
        <label className="block text-sm font-medium text-ink">Description<textarea value={String(form.description)} onChange={(event) => update({ description: event.target.value })} rows={6} className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5 font-normal outline-none focus:border-primary" /></label>
        <section><h2 className="mb-3 font-display text-lg font-semibold">Amenities</h2><div className="flex flex-wrap gap-2">{AMENITY_LIST.map((amenity) => { const active = form.amenities.includes(amenity); return <button type="button" key={amenity} onClick={() => update({ amenities: active ? form.amenities.filter((item) => item !== amenity) : [...form.amenities, amenity] })} className={`rounded-full border px-3 py-1.5 text-xs font-medium ${active ? "border-primary bg-primary-soft text-primary" : "border-line text-ink-soft"}`}>{amenity}</button>; })}</div></section>
        <section><h2 className="mb-3 font-display text-lg font-semibold">Photos</h2><label className="inline-flex cursor-pointer rounded-lg border border-dashed border-line px-4 py-2 text-sm font-medium text-primary">Add photos<input type="file" accept="image/*" multiple onChange={uploadImages} className="hidden" /></label><div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">{form.images.map((image, index) => <div key={`${image}-${index}`} className="relative aspect-square overflow-hidden rounded-lg border border-line"><img src={image} alt="" className="h-full w-full object-cover" /><button type="button" onClick={() => update({ images: form.images.filter((_, itemIndex) => itemIndex !== index) })} className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white" aria-label="Remove photo"><X size={13} /></button></div>)}</div></section>
        <label className="block text-sm font-medium text-ink">Video URL<input value={form.videoUrl} onChange={(event) => update({ videoUrl: event.target.value })} placeholder="https://..." className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5 font-normal outline-none focus:border-primary" /></label>
      </div>
      <button onClick={save} disabled={saving} className="mt-6 flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"><Save size={16} />{saving ? "Saving..." : "Save changes"}</button>
    </div>
  );
}
