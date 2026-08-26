import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ApiError } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const DEMO_ACCOUNTS = [
  { label: "Tenant demo", email: "tenant@flatfinder.in", password: "password123" },
  { label: "Owner demo", email: "owner1@flatfinder.in", password: "password123" },
];

export default function Login() {
  const { login } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: Location })?.from?.pathname || "/dashboard";

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const updateField = (field: "email" | "password") =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setForm((current) => ({ ...current, [field]: event.target.value }));
    };

  const fillDemoAccount = (email: string, password: string) => {
    setForm({ email, password });
    setError(null);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const email = form.email.trim();
    const password = form.password.trim();

    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      notify("Welcome back!", "success");
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't log in right now.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <h1 className="font-display text-2xl font-semibold text-ink mb-1">Log in to FlatFinder</h1>
      <p className="text-sm text-ink-soft mb-6">New here? <Link to="/signup" className="text-primary font-medium hover:underline">Create an account</Link></p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-danger">{error}</p>}

        <Field label="Email" htmlFor="email">
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={form.email}
            onChange={updateField("email")}
            className={inputClass}
            placeholder="you@example.com"
          />
        </Field>

        <Field label="Password" htmlFor="password">
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={form.password}
            onChange={updateField("password")}
            className={inputClass}
            placeholder="••••••••"
          />
        </Field>

        <div className="text-right">
          <Link to="/forgot-password" className="text-xs font-medium text-primary hover:underline">Forgot password?</Link>
        </div>

        <button
          type="submit"
          disabled={submitting || !form.email.trim() || !form.password.trim()}
          className="rounded-full bg-primary py-3 text-sm font-semibold text-white hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Logging in..." : "Log in"}
        </button>
      </form>

      <div className="mt-6 rounded-xl border border-line bg-white p-3 text-xs text-ink-soft">
        <p className="mb-2">Quick demo access:</p>
        <div className="flex flex-wrap gap-2">
          {DEMO_ACCOUNTS.map((account) => (
            <button
              key={account.email}
              type="button"
              onClick={() => fillDemoAccount(account.email, account.password)}
              className="rounded-full border border-line bg-primary-soft px-2.5 py-1.5 text-[11px] font-medium text-primary hover:border-primary"
            >
              {account.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export const inputClass = "w-full rounded-lg border border-line px-3.5 py-2.5 text-sm outline-none focus:border-primary";

export function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-ink mb-1.5">{label}</label>
      {children}
    </div>
  );
}
