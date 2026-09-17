import { useState } from "react";
import { Link } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import { inputClass } from "./Login";

export default function ForgotPassword() {
  const { notify } = useToast();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const address = email.trim();
    if (!address) return;

    setSubmitted(true);
    notify("Check your email for password reset instructions.", "success");
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      {submitted ? (
        <>
          <h1 className="font-display text-2xl font-semibold text-ink mb-2">Check your email</h1>
          <p className="text-sm leading-relaxed text-ink-soft">
            If an account exists for {email.trim()}, you will receive password reset instructions shortly.
          </p>
          <Link to="/login" className="mt-6 rounded-full bg-primary py-3 text-center text-sm font-semibold text-white hover:bg-primary-light">
            Back to log in
          </Link>
        </>
      ) : (
        <>
          <h1 className="font-display text-2xl font-semibold text-ink mb-2">Forgot your password?</h1>
          <p className="text-sm leading-relaxed text-ink-soft mb-6">
            Enter the email address connected to your FlatFinder account.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label htmlFor="reset-email" className="text-sm font-medium text-ink">Email</label>
            <input
              id="reset-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={inputClass}
              placeholder="you@example.com"
            />
            <button type="submit" className="rounded-full bg-primary py-3 text-sm font-semibold text-white hover:bg-primary-light">
              Send reset instructions
            </button>
          </form>

          <Link to="/login" className="mt-6 text-center text-sm font-medium text-primary hover:underline">
            Back to log in
          </Link>
        </>
      )}
    </div>
  );
}
