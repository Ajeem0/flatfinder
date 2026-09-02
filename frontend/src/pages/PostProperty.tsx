import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { api, ApiError } from "../lib/api";
import { useToast } from "../context/ToastContext";
import { formatRent } from "../lib/format";
import ProtectedRoute from "../components/ProtectedRoute";
import { useAuth } from "../context/AuthContext";

const STEPS = ["Type", "Location", "Details", "Pricing", "Amenities", "Photos", "Description", "Preview"];
export const AMENITY_LIST = ["Parking", "Lift", "Wi-Fi", "AC", "Power Backup", "Security", "Gym", "Swimming Pool", "Balcony", "Water Supply", "Attached Bathroom"];

interface FormState {
  propertyType: string;
  cityName: string;
  locationName: string;
  address: string;
  pincode: string;
  latitude: string;
  longitude: string;
  bhk: string;
  areaSqft: string;
  floor: string;
  totalFloors: string;
  furnishing: string;
  propertyAgeYears: string;
  monthlyRent: string;
  securityDeposit: string;
  maintenance: string;
  brokerage: string;
  noBrokerage: boolean;
  amenities: string[];
  images: string[];
  videoUrl: string;
  title: string;
  description: string;
}

const INITIAL: FormState = {
  propertyType: "APARTMENT",
  cityName: "",
  locationName: "",
  address: "",
  pincode: "",
  latitude: "",
  longitude: "",
  bhk: "2",
  areaSqft: "",
  floor: "",
  totalFloors: "",
  furnishing: "SEMI_FURNISHED",
  propertyAgeYears: "",
  monthlyRent: "",
  securityDeposit: "",
  maintenance: "",
  brokerage: "",
  noBrokerage: true,
  amenities: [],
  images: [],
  videoUrl: "",
  title: "",
  description: "",
};

export default function PostProperty() {
  return (
    <ProtectedRoute>
      <PostPropertyForm />
    </ProtectedRoute>
  );
}

function PostPropertyForm() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { notify } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.userType === "ADMIN";

  function update(patch: Partial<FormState>) {
    setForm((f) => ({ ...f, ...patch }));
  }

  function next() {
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  }
  function back() {
    setStep((s) => Math.max(0, s - 1));
  }

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    try {
      const uploaded = await Promise.all(
        files.map(
          (file) =>
            new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(String(reader.result));
              reader.onerror = () => reject(new Error("Unable to read selected image"));
              reader.readAsDataURL(file);
            })
        )
      );

      update({ images: [...form.images, ...uploaded] });
    } catch {
      setError("One or more images could not be uploaded. Please try again.");
    } finally {
      event.target.value = "";
    }
  }

  async function handleVideoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Unable to read selected video"));
        reader.readAsDataURL(file);
      });

      update({ videoUrl: dataUrl });
      setError(null);
    } catch {
      setError("The selected video could not be uploaded. Please try again.");
    } finally {
      event.target.value = "";
    }
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      await api.properties.create({
        title: form.title || `${form.bhk} BHK ${form.propertyType === "PG" ? "PG" : "Apartment"} in ${form.locationName}`,
        description: form.description,
        propertyType: form.propertyType,
        bhk: form.propertyType === "PG" ? null : Number(form.bhk) || null,
        areaSqft: Number(form.areaSqft) || null,
        floor: Number(form.floor) || null,
        totalFloors: Number(form.totalFloors) || null,
        furnishing: form.furnishing,
        propertyAgeYears: Number(form.propertyAgeYears) || null,
        monthlyRent: Number(form.monthlyRent) || 0,
        securityDeposit: Number(form.securityDeposit) || 0,
        maintenance: Number(form.maintenance) || 0,
        brokerage: Number(form.brokerage) || 0,
        noBrokerage: form.noBrokerage,
        cityName: form.cityName,
        locationName: form.locationName,
        address: form.address,
        pincode: form.pincode,
        latitude: isAdmin && form.latitude ? Number(form.latitude) : null,
        longitude: isAdmin && form.longitude ? Number(form.longitude) : null,
        videoUrl: form.videoUrl || null,
        images: form.images,
        amenities: form.amenities,
      });
      notify("Listing submitted — it'll go live after a quick admin review.", "success");
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't submit this listing right now.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 pb-24 lg:pb-10">
      <h1 className="font-display text-2xl font-semibold text-ink mb-1">Post a property</h1>
      <p className="text-sm text-ink-soft mb-6">Step {step + 1} of {STEPS.length}: {STEPS[step]}</p>

      {/* Stepper */}
      <div className="flex items-center gap-1.5 mb-8 overflow-x-auto pb-1">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-1.5 shrink-0">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                i < step ? "bg-verified text-white" : i === step ? "bg-primary text-white" : "bg-line text-ink-soft"
              }`}
            >
              {i < step ? <Check size={14} /> : i + 1}
            </div>
            {i < STEPS.length - 1 && <div className={`h-0.5 w-6 ${i < step ? "bg-verified" : "bg-line"}`} />}
          </div>
        ))}
      </div>

      {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-danger">{error}</p>}

      <div className="rounded-2xl border border-line bg-white p-5 sm:p-6">
        {step === 0 && (
          <StepBlock title="What are you listing?">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {["APARTMENT", "INDEPENDENT_HOUSE", "VILLA", "PG", "ROOM", "FLATMATE"].map((t) => (
                <button
                  key={t}
                  onClick={() => update({ propertyType: t })}
                  className={`rounded-xl border px-3 py-4 text-sm font-medium capitalize ${
                    form.propertyType === t ? "border-primary bg-primary-soft text-primary" : "border-line text-ink"
                  }`}
                >
                  {t.replace("_", " ").toLowerCase()}
                </button>
              ))}
            </div>
          </StepBlock>
        )}

        {step === 1 && (
          <StepBlock title="Where is it located?">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextField label="City" value={form.cityName} onChange={(v) => update({ cityName: v })} placeholder="Jaipur" />
              <TextField label="Area / Locality" value={form.locationName} onChange={(v) => update({ locationName: v })} placeholder="Vaishali Nagar" />
              <TextField label="Address" value={form.address} onChange={(v) => update({ address: v })} placeholder="Street, landmark" className="sm:col-span-2" />
              <TextField label="Pincode" value={form.pincode} onChange={(v) => update({ pincode: v })} placeholder="302021" />
              {isAdmin && (
                <>
                  <TextField label="Latitude" value={form.latitude} onChange={(v) => update({ latitude: v })} placeholder="26.9124" />
                  <TextField label="Longitude" value={form.longitude} onChange={(v) => update({ longitude: v })} placeholder="75.7873" />
                  <p className="sm:col-span-2 text-xs text-ink-soft">
                    Coordinates are visible only to admins and are used for admin review and location management.
                  </p>
                </>
              )}
            </div>
          </StepBlock>
        )}

        {step === 2 && (
          <StepBlock title="Property details">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {form.propertyType !== "PG" && (
                <SelectField label="BHK" value={form.bhk} onChange={(v) => update({ bhk: v })} options={["1", "2", "3", "4", "5"]} />
              )}
              <TextField label="Area (sq.ft)" type="number" value={form.areaSqft} onChange={(v) => update({ areaSqft: v })} placeholder="1200" />
              <TextField label="Floor" type="number" value={form.floor} onChange={(v) => update({ floor: v })} placeholder="3" />
              <TextField label="Total floors" type="number" value={form.totalFloors} onChange={(v) => update({ totalFloors: v })} placeholder="10" />
              <SelectField
                label="Furnishing"
                value={form.furnishing}
                onChange={(v) => update({ furnishing: v })}
                options={["FURNISHED", "SEMI_FURNISHED", "UNFURNISHED"]}
                labels={{ FURNISHED: "Furnished", SEMI_FURNISHED: "Semi-furnished", UNFURNISHED: "Unfurnished" }}
              />
              <TextField label="Property age (years)" type="number" value={form.propertyAgeYears} onChange={(v) => update({ propertyAgeYears: v })} placeholder="5" />
            </div>
          </StepBlock>
        )}

        {step === 3 && (
          <StepBlock title="Pricing">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextField label="Monthly rent (₹)" type="number" required value={form.monthlyRent} onChange={(v) => update({ monthlyRent: v })} placeholder="18000" />
              <TextField label="Security deposit (₹)" type="number" value={form.securityDeposit} onChange={(v) => update({ securityDeposit: v })} placeholder="36000" />
              <TextField label="Maintenance (₹/month)" type="number" value={form.maintenance} onChange={(v) => update({ maintenance: v })} placeholder="900" />
              <TextField label="Brokerage (₹)" type="number" value={form.brokerage} onChange={(v) => update({ brokerage: v })} placeholder="0" disabled={form.noBrokerage} />
            </div>
            <label className="mt-4 flex items-center gap-2 text-sm text-ink">
              <input type="checkbox" checked={form.noBrokerage} onChange={(e) => update({ noBrokerage: e.target.checked, brokerage: e.target.checked ? "0" : form.brokerage })} className="h-4 w-4 accent-[var(--color-primary)]" />
              No brokerage — list directly as owner
            </label>
          </StepBlock>
        )}

        {step === 4 && (
          <StepBlock title="Amenities">
            <div className="flex flex-wrap gap-2">
              {AMENITY_LIST.map((a) => {
                const active = form.amenities.includes(a);
                return (
                  <button
                    key={a}
                    onClick={() => update({ amenities: active ? form.amenities.filter((x) => x !== a) : [...form.amenities, a] })}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium ${active ? "border-primary bg-primary-soft text-primary" : "border-line text-ink-soft"}`}
                  >
                    {a}
                  </button>
                );
              })}
            </div>
          </StepBlock>
        )}

        {step === 5 && (
          <StepBlock title="Photos & video">
            <div className="space-y-4">
              <div>
                <p className="text-xs text-ink-soft mb-3">Upload images from your device. These are stored as data URLs in this demo and used in the listing preview.</p>
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-line bg-soft px-3 py-3 text-sm font-medium text-primary hover:border-primary">
                  <span>Choose photos</span>
                  <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">Upload a video (optional)</label>
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-line bg-soft px-3 py-3 text-sm font-medium text-primary hover:border-primary">
                  <span>{form.videoUrl ? "Replace video" : "Choose video"}</span>
                  <input type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
                </label>
                <p className="mt-1 text-xs text-ink-soft">Upload a MP4, WebM, or other supported video file. The video is stored as a file upload in this demo.</p>
              </div>

              {form.images.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-medium text-ink">Uploaded photos</p>
                  <div className="grid grid-cols-3 gap-2">
                    {form.images.map((img, i) => (
                      <div key={`${img}-${i}`} className="relative aspect-square overflow-hidden rounded-lg border border-line">
                        <img src={img} alt="" className="h-full w-full object-cover" />
                        <button
                          onClick={() => update({ images: form.images.filter((_, idx) => idx !== i) })}
                          className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white text-xs"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </StepBlock>
        )}

        {step === 6 && (
          <StepBlock title="Description">
            <TextField label="Listing title" value={form.title} onChange={(v) => update({ title: v })} placeholder="Modern 2 BHK Apartment" />
            <div className="mt-4">
              <label className="block text-sm font-medium text-ink mb-1.5">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => update({ description: e.target.value })}
                rows={6}
                placeholder="Describe the property, nearby landmarks, house rules..."
                className="w-full rounded-lg border border-line px-3.5 py-2.5 text-sm outline-none focus:border-primary"
              />
            </div>
          </StepBlock>
        )}

        {step === 7 && (
          <StepBlock title="Preview & publish">
            <div className="rounded-xl border border-line overflow-hidden">
              {form.images[0] && <img src={form.images[0]} alt="" className="h-48 w-full object-cover" />}
              {form.videoUrl && !form.images[0] && (
                <div className="flex h-48 w-full items-center justify-center bg-primary-soft px-4 text-center text-sm font-medium text-primary">
                  Video included: {form.videoUrl}
                </div>
              )}
              <div className="p-4">
                <h3 className="font-display font-semibold text-lg">{form.title || `${form.bhk} BHK in ${form.locationName || "..."}`}</h3>
                <p className="text-sm text-ink-soft">{form.locationName}, {form.cityName}</p>
                <p className="price-figure font-display text-lg font-semibold text-primary mt-2">
                  {form.monthlyRent ? formatRent(Number(form.monthlyRent)) : "₹0"}/month
                </p>
                <p className="text-sm text-ink-soft mt-2 line-clamp-3">{form.description || "No description added."}</p>
                {form.videoUrl && <p className="text-xs text-ink-soft mt-2">Video uploaded</p>}
                {form.amenities.length > 0 && (
                  <p className="text-xs text-ink-soft mt-2">Amenities: {form.amenities.join(", ")}</p>
                )}
              </div>
            </div>
            <p className="mt-4 text-xs text-ink-soft">
              Your listing will be submitted as <b>Pending</b> and go live after a quick admin review — matching the trust &amp; safety flow described in the spec.
            </p>
          </StepBlock>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={back}
          disabled={step === 0}
          className="flex items-center gap-1 rounded-full border border-line px-4 py-2.5 text-sm font-medium text-ink disabled:opacity-40"
        >
          <ChevronLeft size={16} /> Back
        </button>

        {step < STEPS.length - 1 ? (
          <button onClick={next} className="flex items-center gap-1 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white">
            Next <ChevronRight size={16} />
          </button>
        ) : (
          <button onClick={submit} disabled={submitting} className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
            {submitting ? "Publishing..." : "Submit for review"}
          </button>
        )}
      </div>
    </div>
  );
}

function StepBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-display text-lg font-semibold text-ink mb-4">{title}</h2>
      {children}
    </div>
  );
}

function TextField({
  label, value, onChange, placeholder, type = "text", className = "", required, disabled,
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; className?: string; required?: boolean; disabled?: boolean;
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-ink mb-1.5">{label}</label>
      <input
        type={type}
        required={required}
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-line px-3.5 py-2.5 text-sm outline-none focus:border-primary disabled:bg-canvas disabled:text-ink-soft"
      />
    </div>
  );
}

function SelectField({
  label, value, onChange, options, labels,
}: {
  label: string; value: string; onChange: (v: string) => void; options: string[]; labels?: Record<string, string>;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-ink mb-1.5">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-lg border border-line px-3.5 py-2.5 text-sm outline-none focus:border-primary">
        {options.map((o) => (
          <option key={o} value={o}>{labels?.[o] || o}</option>
        ))}
      </select>
    </div>
  );
}
