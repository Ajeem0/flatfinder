import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-line bg-surface pb-20 lg:pb-8" data-reveal>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 grid grid-cols-2 gap-8 md:grid-cols-4">
        <div className="col-span-2 md:col-span-1">
          <Link to="/" className="flex items-center gap-2 mb-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-white font-display font-bold text-sm">F</span>
            <span className="font-display text-base font-semibold text-ink">FlatFinder</span>
          </Link>
          <p className="text-sm text-ink-soft">Find a place you'll love to live — across every major Indian city.</p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-ink mb-3">Explore</h4>
          <ul className="space-y-2 text-sm text-ink-soft">
            <li><Link to="/properties" className="hover:text-primary">All properties</Link></li>
            <li><Link to="/pg" className="hover:text-primary">PG &amp; co-living</Link></li>
            <li><Link to="/flatmates" className="hover:text-primary">Flatmates</Link></li>
            <li><Link to="/properties?view=map" className="hover:text-primary">Map search</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-ink mb-3">For owners</h4>
          <ul className="space-y-2 text-sm text-ink-soft">
            <li><Link to="/post-property" className="hover:text-primary">Post a property</Link></li>
            <li><Link to="/dashboard" className="hover:text-primary">Owner dashboard</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-ink mb-3">Popular cities</h4>
          <ul className="space-y-2 text-sm text-ink-soft">
            {["Jaipur", "Delhi", "Mumbai", "Bangalore"].map((c) => (
              <li key={c}>
                <Link to={`/properties?city=${c}`} className="hover:text-primary">{c}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-line py-4 text-center text-xs text-ink-soft">
        © {new Date().getFullYear()} FlatFinder. Built as a demo marketplace MVP.
      </div>
    </footer>
  );
}
