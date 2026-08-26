import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <p className="font-display text-6xl font-semibold text-primary mb-2">404</p>
      <h1 className="font-display text-xl font-semibold text-ink mb-2">Page not found</h1>
      <p className="text-sm text-ink-soft mb-6">The page you're looking for doesn't exist or has moved.</p>
      <Link to="/" className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white">
        Back to home
      </Link>
    </div>
  );
}
