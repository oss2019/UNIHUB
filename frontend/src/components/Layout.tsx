import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Toaster, toast } from "sonner";
import { useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { LeftSidebar } from "@/components/layout/LeftSidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { ThemeController } from "@/components/ThemeController";
import { AuthModal } from "@/components/modals/AuthModal";
import { CreatePostModal } from "@/components/modals/CreatePostModal";
import { NotificationsModal } from "@/components/modals/NotificationsModal";
import { meQuery } from "@/lib/queries";
import { TutorialTour } from "@/components/TutorialTour";
import { useTourStore } from "@/lib/tourStore";

function AuthBootstrap() {
  // Trigger /auth/me on mount so cookies are validated and user is cached.
  const me = useQuery(meQuery());
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (
      me.data &&
      !me.data.onboardingCompleted &&
      location.pathname !== "/onboarding"
    ) {
      navigate("/onboarding", { replace: true });
    }
  }, [me.data, location.pathname, navigate]);

  const startTour = useTourStore((s) => s.startTour);
  const isTourActive = useTourStore((s) => s.isActive);

  useEffect(() => {
    if (
      me.data &&
      me.data.onboardingCompleted &&
      location.pathname === "/" &&
      window.innerWidth >= 1024 &&
      !localStorage.getItem("ph_tour_completed") &&
      !isTourActive
    ) {
      startTour();
    }
  }, [me, location.pathname, startTour, isTourActive]);

  // Handle ?auth=success / ?authError=... after Google OAuth redirect
  useEffect(() => {
    const url = new URL(window.location.href);
    const ok = url.searchParams.get("auth");
    const err =
      url.searchParams.get("authError") || url.searchParams.get("error");
    if (ok === "success") {
      me.refetch();
      toast.success("Signed in successfully");
    }
    if (err) {
      toast.error(decodeURIComponent(err));
    }
    if (ok || err) {
      url.searchParams.delete("auth");
      url.searchParams.delete("authError");
      url.searchParams.delete("error");
      window.history.replaceState(
        {},
        "",
        url.pathname + (url.search ? url.search : ""),
      );
    }
  }, [me]);

  return null;
}

export function Layout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <ThemeController />
      <AuthBootstrap />
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 md:px-6 py-6 pb-24 md:pb-10 flex gap-8">
        <LeftSidebar />
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
      <BottomNav />
      <AuthModal />
      <CreatePostModal />
      <NotificationsModal />
      <TutorialTour />
      <Toaster richColors position="top-right" theme="dark" />
    </div>
  );
}
