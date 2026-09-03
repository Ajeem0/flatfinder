import { useEffect, useRef, useState } from "react";

const GOOGLE_CLIENT_ID = import.meta.env.GOOGLE_CLIENT_ID || "1065632607057-06hb80t0ua8109981ntj17ts7dgsopt0.apps.googleusercontent.com";
const GOOGLE_SCRIPT_ID = "google-identity-services";

type GoogleCredentialResponse = { credential: string };
type GoogleAccounts = { id: { initialize: (options: { client_id: string; callback: (response: GoogleCredentialResponse) => void }) => void; renderButton: (element: HTMLElement, options: { theme: string; size: string; width: number }) => void } };

declare global {
  interface Window { google?: { accounts: GoogleAccounts } }
}

export default function GoogleLoginButton({ onCredential, disabled = false }: { onCredential: (credential: string) => Promise<void>; disabled?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(Boolean(window.google));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (window.google) return;
    const existing = document.getElementById(GOOGLE_SCRIPT_ID) as HTMLScriptElement | null;
    const script = existing || document.createElement("script");
    if (!existing) {
      script.id = GOOGLE_SCRIPT_ID;
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
    const onLoad = () => setReady(true);
    script.addEventListener("load", onLoad);
    return () => script.removeEventListener("load", onLoad);
  }, []);

  useEffect(() => {
    if (!ready || !containerRef.current || !window.google) return;
    containerRef.current.replaceChildren();
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: async ({ credential }) => {
        setLoading(true);
        try { await onCredential(credential); } finally { setLoading(false); }
      },
    });
    window.google.accounts.id.renderButton(containerRef.current, { theme: "outline", size: "large", width: 360 });
  }, [ready, onCredential]);

  return <div aria-busy={loading || disabled} className={loading || disabled ? "pointer-events-none opacity-50" : ""}><div ref={containerRef} className="flex min-h-10 justify-center" />{!ready && <p className="text-center text-xs text-ink-soft">Loading Google sign-in...</p>}</div>;
}
