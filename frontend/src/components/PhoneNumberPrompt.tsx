import { useState } from "react";
import { api, ApiError } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function PhoneNumberPrompt() {
  const { user, refreshUser } = useAuth();
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!user || (user.userType === "ADMIN" ? user.adminPhone : user.phone)) return null;
  const currentUser = user;

  async function savePhone(event: React.FormEvent) {
    event.preventDefault();
    const value = phone.trim();
    if (value.length < 7) {
      setError("Enter a valid phone number.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (currentUser.userType === "ADMIN") {
        await api.auth.updateMe({ adminPhone: value });
      } else {
        await api.auth.updateMe({ phone: value });
      }
      await refreshUser();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save your phone number.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="phone-prompt-title">
      <form onSubmit={savePhone} className="w-full max-w-md rounded-2xl border border-line bg-white p-6 shadow-xl">
        <h2 id="phone-prompt-title" className="font-display text-xl font-semibold text-ink">Add your phone number</h2>
        <p className="mt-2 text-sm text-ink-soft">Please add your phone number to continue using FlatFinder.</p>
        <label htmlFor="required-phone" className="mt-5 block text-sm font-medium text-ink">
          Phone number
          <input
            id="required-phone"
            type="tel"
            autoComplete="tel"
            autoFocus
            required
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="98765 43210"
            className="mt-1.5 w-full rounded-lg border border-line px-3.5 py-2.5 text-sm outline-none focus:border-primary"
          />
        </label>
        {error && <p role="alert" className="mt-2 text-sm text-danger">{error}</p>}
        <button type="submit" disabled={saving} className="mt-5 w-full rounded-full bg-primary py-3 text-sm font-semibold text-white disabled:opacity-60">
          {saving ? "Saving..." : "Save and continue"}
        </button>
      </form>
    </div>
  );
}