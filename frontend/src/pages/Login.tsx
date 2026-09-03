import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ApiError } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import GoogleLoginButton from "../components/GoogleLoginButton";

export default function Login() {
  const { login, googleLogin } = useAuth();
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

  async function handleGoogleLogin(credential: string) {
    try {
      await googleLogin(credential);
      notify("Welcome to FlatFinder!", "success");
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Google sign-in failed. Please try again.");
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

      <div className="my-5 flex items-center gap-3 text-xs text-ink-soft"><span className="h-px flex-1 bg-line" />or<span className="h-px flex-1 bg-line" /></div>
      <GoogleLoginButton onCredential={handleGoogleLogin} disabled={submitting} />

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
