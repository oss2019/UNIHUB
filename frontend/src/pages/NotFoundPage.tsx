import { Link } from "react-router-dom";
import { useEffect } from "react";

export function NotFoundPage() {
  useEffect(() => {
    document.title = "404 — PeerHive";
  }, []);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-display font-bold text-primary">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium hover:opacity-90"
          >
            Back to PeerHive
          </Link>
        </div>
      </div>
    </div>
  );
}
