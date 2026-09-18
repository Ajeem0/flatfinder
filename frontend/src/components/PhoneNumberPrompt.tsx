import { useEffect, useState } from "react";
import { api, ApiError } from "../lib/api";
import { useAuth } from "../context/AuthContext";

declare global {
  interface Window {
    initSendOTP?: (configuration: {
      widgetId: string;
      tokenAuth: string;
      identifier: string;
      exposeMethods: boolean;
      success: (data: unknown) => void;
      failure: (error: unknown) => void;
    }) => void;
  }
}

const MSG91_WIDGET_ID = import.meta.env.MSG91_WIDGET_ID || "366972724836363133393536";
const MSG91_TOKEN_AUTH = import.meta.env.MSG91_TOKEN_AUTH || "";
let msg91ScriptPromise: Promise<void> | null = null;

function loadMsg91Widget() {
  if (window.initSendOTP) return Promise.resolve();
  if (msg91ScriptPromise) return msg91ScriptPromise;

  msg91ScriptPromise = new Promise((resolve, reject) => {
    const urls = ["https://verify.msg91.com/otp-provider.js", "https://verify.phone91.com/otp-provider.js"];
    let index = 0;
    const load = () => {
      const script = document.createElement("script");
      script.src = urls[index];
      script.async = true;
      script.onload = () => window.initSendOTP ? resolve() : reject(new Error("MSG91 widget could not initialize"));
      script.onerror = () => {
        index += 1;
        if (index < urls.length) load();
        else reject(new Error("MSG91 widget could not load"));
      };
      document.head.appendChild(script);
    };
    load();
  });
  return msg91ScriptPromise;
}

function getMsg91AccessToken(data: unknown): string {
  if (typeof data === "string") {
    try {
      return getMsg91AccessToken(JSON.parse(data));
    } catch {
      return data.length > 20 && !/^(success|ok|verified|otp verified)$/i.test(data.trim()) ? data : "";
    }
  }
  if (!data || typeof data !== "object") return "";

  const value = data as Record<string, unknown>;
  const tokenKey = Object.keys(value).find((key) =>
    ["access-token", "access_token", "accesstoken", "accessToken", "token", "verificationToken", "message"].includes(key)
  );
  if (tokenKey && typeof value[tokenKey] === "string") {
    const token = getMsg91AccessToken(value[tokenKey]);
    if (token) return token;
  }

  for (const nestedValue of Object.values(value)) {
    const token: string = getMsg91AccessToken(nestedValue);
    if (token) return token;
  }
  return "";
}

export default function PhoneNumberPrompt() {
  const { user, refreshUser } = useAuth();
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [widgetStarted, setWidgetStarted] = useState(false);
  const [visibleFor, setVisibleFor] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setVisibleFor(null);
      return;
    }
    setPhone(user.userType === "ADMIN" ? user.adminPhone || "" : user.phone || "");
    setWidgetStarted(false);
    setVisibleFor(user.id);
  }, [user?.id]);

  if (!user || visibleFor !== user.id) return null;
  const currentUser = user;
  const currentPhone = currentUser.userType === "ADMIN" ? currentUser.adminPhone : currentUser.phone;
  if (currentPhone && currentUser.isPhoneVerified) return null;

  async function startVerification(event: React.FormEvent) {
    event.preventDefault();
    const value = phone.trim();
    if (value.length < 7) {
      setError("Enter a valid phone number.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await api.auth.requestPhoneOtp(value);
      if (!MSG91_TOKEN_AUTH) throw new Error("MSG91 OTP widget is not configured");
      await loadMsg91Widget();
      if (typeof window.initSendOTP !== "function") {
        throw new Error("MSG91 OTP widget did not load. Check the browser network connection.");
      }
      setWidgetStarted(true);
      window.initSendOTP({
        widgetId: MSG91_WIDGET_ID,
        tokenAuth: MSG91_TOKEN_AUTH,
        identifier: value,
        exposeMethods: false,
        success: async (data) => {
          const accessToken = getMsg91AccessToken(data);
          if (!accessToken) {
            setError("MSG91 verification succeeded, but no access token was returned. Please try again.");
            setWidgetStarted(false);
            return;
          }
          try {
            await api.auth.verifyPhoneOtp({ phone: value, accessToken });
            await refreshUser();
            setVisibleFor(null);
          } catch (err) {
            setError(err instanceof ApiError ? err.message : "Could not verify your phone number.");
            setWidgetStarted(false);
          }
        },
        failure: (widgetError) => {
          setError(typeof widgetError === "string" ? widgetError : "Phone verification was cancelled or failed.");
          setWidgetStarted(false);
        },
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not send a verification code.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="phone-prompt-title">
      <form onSubmit={startVerification} className="w-full max-w-md rounded-2xl border border-line bg-white p-6 shadow-xl">
        <h2 id="phone-prompt-title" className="font-display text-xl font-semibold text-ink">Add your phone number</h2>
        <p className="mt-2 text-sm text-ink-soft">Verify your phone number so other users can contact you on FlatFinder.</p>
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
        {widgetStarted && <p className="mt-3 text-sm text-ink-soft">Complete the OTP verification in the MSG91 window.</p>}
        {error && <p role="alert" className="mt-2 text-sm text-danger">{error}</p>}
        <button type="submit" disabled={saving} className="mt-5 w-full rounded-full bg-primary py-3 text-sm font-semibold text-white disabled:opacity-60">
          {saving ? "Opening verification..." : widgetStarted ? "Verification window open" : "Verify phone number"}
        </button>
      </form>
    </div>
  );
}