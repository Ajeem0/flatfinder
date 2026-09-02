import { useEffect, useState, type ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { useScrollReveal } from "./Reveal";

export default function Layout({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useScrollReveal();

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setReady(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <Navbar />
      <main className={`page-shell flex-1 ${ready ? "is-ready" : ""}`}>
        {children}
      </main>
      <Footer />
    </div>
  );
}
