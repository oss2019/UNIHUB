import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import appCss from "../styles.css?url";
import { Navbar } from "@/components/layout/Navbar";
import { LeftSidebar } from "@/components/layout/LeftSidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { ThemeController } from "@/components/ThemeController";
import { PageTransition } from "@/components/PageTransition";
import { AuthModal } from "@/components/modals/AuthModal";
import { CreatePostModal } from "@/components/modals/CreatePostModal";
import { NotificationsModal } from "@/components/modals/NotificationsModal";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-display font-bold text-gradient">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link to="/" className="inline-flex items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground px-5 py-2.5 text-sm font-medium hover:opacity-90">
            Back to PeerHive
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "PeerHive — IIT Dharwad community" },
      { name: "description", content: "The campus community platform for IIT Dharwad. Forums, collaborations, events, and resources." },
      { property: "og:title", content: "PeerHive" },
      { property: "og:description", content: "Where IIT Dharwad meets, talks, and builds." },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <ThemeController />
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 md:px-6 py-6 pb-24 md:pb-10 flex gap-8">
        <LeftSidebar />
        <main className="flex-1 min-w-0">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>
      </div>
      <BottomNav />
      <AuthModal />
      <CreatePostModal />
      <NotificationsModal />
    </div>
  );
}
