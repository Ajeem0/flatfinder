import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiError } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { inputClass, Field } from "./Login";
import GoogleLoginButton from "../components/GoogleLoginButton";

const USER_TYPES = [
  { value: "TENANT", label: "Tenant" },
  { value: "OWNER", label: "Owner" },
  { value: "AGENT", label: "Agent" },
];

export default function Signup() {
  const { register, googleLogin } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [userType, setUserType] = useState("TENANT");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const updateField = (field: "name" | "email" | "phone" | "password") =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setForm((current) => ({ ...current, [field]: event.target.value }));
    };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      password: form.password.trim(),
      userType,
    };

    setError(null);

    if (!payload.name || !payload.email || !payload.password) {
      setError("Name, email, and password are required.");
      return;
    }

    if (payload.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setSubmitting(true);
    try {
      await register(payload);
      notify("Account created — welcome to FlatFinder!", "success");
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't create your account right now.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogleSignup(credential: string) {
    try {
      await googleLogin(credential, userType);
      notify("Account created — welcome to FlatFinder!", "success");
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Google sign-up failed. Please try again.");
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <h1 className="font-display text-2xl font-semibold text-ink mb-1">Create your account</h1>
      <p className="text-sm text-ink-soft mb-6">
        Already have one? <Link to="/login" className="text-primary font-medium hover:underline">Log in</Link>
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-danger">{error}</p>}

        <Field label="I am a..." htmlFor="user-type">
          <div id="user-type" className="grid grid-cols-3 gap-2">
            {USER_TYPES.map((option) => (
              <button
                type="button"
                key={option.value}
                aria-pressed={userType === option.value}
                onClick={() => setUserType(option.value)}
                className={`rounded-xl border px-2 py-3 text-center transition-colors ${
                  userType === option.value ? "border-primary bg-primary-soft" : "border-line"
                }`}
              >
                <span className={`block text-sm font-semibold ${userType === option.value ? "text-primary" : "text-ink"}`}>
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        </Field>

        <Field label="Full name" htmlFor="name">
          <input id="name" required value={form.name} onChange={updateField("name")} className={inputClass} placeholder="Your name" />
        </Field>
        <Field label="Email" htmlFor="signup-email">
          <input id="signup-email" type="email" autoComplete="email" required value={form.email} onChange={updateField("email")} className={inputClass} placeholder="you@example.com" />
        </Field>
        <Field label="Phone" htmlFor="phone">
          <input id="phone" type="tel" autoComplete="tel" value={form.phone} onChange={updateField("phone")} className={inputClass} placeholder="98765xxxxx" />
        </Field>
        <Field label="Password" htmlFor="signup-password">
          <input
            id="signup-password"
            type="password"
            autoComplete="new-password"
            required
            value={form.password}
            onChange={updateField("password")}
            className={inputClass}
            placeholder="At least 6 characters"
          />
        </Field>

        <button
          type="submit"
          disabled={submitting || !form.name.trim() || !form.email.trim() || !form.password.trim()}
          className="rounded-full bg-primary py-3 text-sm font-semibold text-white hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Creating account..." : "Sign up"}
        </button>
      </form>
      <div className="my-5 flex items-center gap-3 text-xs text-ink-soft"><span className="h-px flex-1 bg-line" />or<span className="h-px flex-1 bg-line" /></div>
      <GoogleLoginButton onCredential={handleGoogleSignup} disabled={submitting} />
    </div>
  );
}
