import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useTourStore } from "@/lib/tourStore";
import { forumsQuery, forumQuery } from "@/lib/queries";

interface TourStep {
  target?: string;
  title: string;
  content: string;
  placement: "top" | "bottom" | "left" | "right" | "center";
  route: string;
}

const HiveyMascot = () => (
  <motion.svg
    width="64"
    height="64"
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    animate={{ y: [0, -3, 0] }}
    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
    className="drop-shadow-md select-none shrink-0"
  >
    {/* Wings */}
    <motion.path
      d="M25 35C15 25 10 35 25 45C30 48 35 48 38 45"
      fill="oklch(0.7 0.16 40 / 0.3)"
      stroke="oklch(0.7 0.16 40 / 0.7)"
      strokeWidth="2"
      animate={{ rotate: [-8, 12, -8] }}
      transition={{ repeat: Infinity, duration: 0.18, ease: "easeInOut" }}
      style={{ originX: "38px", originY: "45px" }}
    />
    <motion.path
      d="M75 35C85 25 90 35 75 45C70 48 65 48 62 45"
      fill="oklch(0.7 0.16 40 / 0.3)"
      stroke="oklch(0.7 0.16 40 / 0.7)"
      strokeWidth="2"
      animate={{ rotate: [8, -12, 8] }}
      transition={{ repeat: Infinity, duration: 0.18, ease: "easeInOut" }}
      style={{ originX: "62px", originY: "45px" }}
    />

    {/* Body */}
    <ellipse cx="50" cy="55" rx="26" ry="22" fill="oklch(0.72 0.16 65)" />

    {/* Stripes */}
    <path
      d="M36 40C43 37 57 37 64 40C62 43 55 45 50 45C45 45 38 43 36 40Z"
      fill="oklch(0.22 0.025 50)"
    />
    <path
      d="M28 55C36 50 64 50 72 55C70 61 60 64 50 64C40 64 30 61 28 55Z"
      fill="oklch(0.22 0.025 50)"
    />
    <path
      d="M34 70C40 67 60 67 66 70C64 73 57 75 50 75C43 75 36 73 34 70Z"
      fill="oklch(0.22 0.025 50)"
    />

    {/* Cheeks */}
    <circle cx="38" cy="58" r="3" fill="oklch(0.65 0.2 25)" opacity="0.4" />
    <circle cx="62" cy="58" r="3" fill="oklch(0.65 0.2 25)" opacity="0.4" />

    {/* Eyes */}
    <circle cx="44" cy="54" r="3" fill="oklch(0.17 0.012 50)" />
    <circle cx="56" cy="54" r="3" fill="oklch(0.17 0.012 50)" />
    <circle cx="45" cy="52.5" r="0.8" fill="white" />
    <circle cx="57" cy="52.5" r="0.8" fill="white" />

    {/* Glasses */}
    <circle
      cx="44"
      cy="54"
      r="6"
      stroke="oklch(0.55 0.16 35)"
      strokeWidth="2"
      fill="none"
    />
    <circle
      cx="56"
      cy="54"
      r="6"
      stroke="oklch(0.55 0.16 35)"
      strokeWidth="2"
      fill="none"
    />
    <line
      x1="50"
      y1="54"
      x2="48"
      y2="54"
      stroke="oklch(0.55 0.16 35)"
      strokeWidth="2"
    />

    {/* Smile */}
    <path
      d="M47 62C48 64 52 64 53 62"
      stroke="oklch(0.17 0.012 50)"
      strokeWidth="1.8"
      strokeLinecap="round"
    />

    {/* Antennae */}
    <path
      d="M46 34C44 26 41 24 38 26"
      stroke="oklch(0.22 0.025 50)"
      strokeWidth="1.8"
      fill="none"
      strokeLinecap="round"
    />
    <circle cx="38" cy="26" r="2" fill="oklch(0.72 0.16 65)" />
    <path
      d="M54 34C56 26 59 24 62 26"
      stroke="oklch(0.22 0.025 50)"
      strokeWidth="1.8"
      fill="none"
      strokeLinecap="round"
    />
    <circle cx="62" cy="26" r="2" fill="oklch(0.72 0.16 65)" />
  </motion.svg>
);

export function TutorialTour() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isActive, stepIndex, nextStep, prevStep, stopTour } = useTourStore();
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});
  const [width, setWidth] = useState(window.innerWidth);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Keep track of window width to determine responsive states
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch campus forums to make routes dynamic
  const { data: forums = [] } = useQuery(forumsQuery());
  const firstForumId = forums[0]?._id || "general";

  const { data: forumDetails } = useQuery({
    ...forumQuery(firstForumId),
    enabled: !!firstForumId && firstForumId !== "general",
  });
  const subForums = forumDetails?.subForums ?? [];
  const firstSubforumId = subForums[0]?._id || "general-sub";

  // Create condensed step items list dynamically
  const TOUR_STEPS = useMemo(
    (): TourStep[] => [
      {
        title: "👋 Welcome to PeerHive!",
        content:
          "PeerHive is the collaborative hub built specifically for the IIT Dharwad campus community. Let's take a quick tour to see how to discuss, find study files, and connect!",
        placement: "center",
        route: "/",
      },
      {
        target: '[data-tour="sidebar-forums"]',
        title: "Campus Forums",
        content:
          "Campus discussions are organized into official forums and collaboration spaces. Click any forum in the sidebar list to explore.",
        placement: "right",
        route: "/",
      },
      {
        target: '[data-tour="forum-subforums"]',
        title: "Explore Subforums",
        content:
          "Inside a forum, conversations are split into subforums dedicated to specific courses, project teams, or clubs.",
        placement: "bottom",
        route: `/f/${firstForumId}`,
      },
      {
        target: '[data-tour="subforum-new-post"]',
        title: "Threads & Post Creation",
        content:
          "This is a subforum thread board. If you have questions, updates, or announcements to share, click 'New post' to write a message here.",
        placement: "bottom",
        route: `/f/${firstForumId}/${firstSubforumId}`,
      },
      {
        target: '[data-tour="nav-post"]',
        title: "Global Post Creation",
        content:
          "Alternatively, you can write a post from anywhere on the platform using this global 'Post' button in the toolbar.",
        placement: "bottom",
        route: "/",
      },
      {
        target: '[data-tour="sidebar-resources"]',
        title: "Study Resources",
        content:
          "Access shared lecture slides, lab manuals, and career guides. Let's open the Resources center!",
        placement: "right",
        route: "/",
      },
      {
        target: '[data-tour="resources-categories"]',
        title: "Filter and Search Files",
        content:
          "Filter study materials by department stream and type, or use the search bar to locate files (e.g. searching 'MA-201').",
        placement: "right",
        route: "/resources",
      },
      {
        title: "🎉 You're All Set!",
        content:
          "You're now ready to ask questions, share files, and contribute to the community. Happy collaborating!",
        placement: "center",
        route: "/",
      },
    ],
    [firstForumId, firstSubforumId],
  );

  // Revert or stop tour immediately if screen size is smaller than desktop (1024px)
  useEffect(() => {
    if (isActive && width < 1024) {
      stopTour();
    }
  }, [isActive, width, stopTour]);

  // Auto-navigate and poll for elements
  useEffect(() => {
    if (!isActive || width < 1024) return;

    const step = TOUR_STEPS[stepIndex];
    if (!step) return;

    // Route transitions
    if (location.pathname !== step.route) {
      navigate(step.route);
    }

    setRect(null);

    // Poll for the target element
    let attempts = 0;
    const maxAttempts = 35; // 3.5 seconds
    const interval = setInterval(() => {
      if (step.placement === "center" || !step.target) {
        clearInterval(interval);
        setRect(null);
        return;
      }

      const element = document.querySelector(step.target);
      if (element) {
        clearInterval(interval);

        // Scroll into view first
        element.scrollIntoView({ behavior: "smooth", block: "center" });

        // Wait for scrolling to settle, then compute boundaries
        setTimeout(() => {
          setRect(element.getBoundingClientRect());
        }, 200);
      }

      attempts++;
      if (attempts >= maxAttempts) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [stepIndex, isActive, location.pathname, navigate, width, TOUR_STEPS]);

  // Recalculate coordinates on window events
  useEffect(() => {
    if (!isActive || width < 1024) return;

    const handleUpdate = () => {
      const step = TOUR_STEPS[stepIndex];
      if (!step || !step.target) return;

      const element = document.querySelector(step.target);
      if (element) {
        setRect(element.getBoundingClientRect());
      }
    };

    window.addEventListener("resize", handleUpdate);
    window.addEventListener("scroll", handleUpdate, { passive: true });

    return () => {
      window.removeEventListener("resize", handleUpdate);
      window.removeEventListener("scroll", handleUpdate);
    };
  }, [isActive, stepIndex, width, TOUR_STEPS]);

  // Compute popover placement dynamically
  useEffect(() => {
    if (width < 1024) return;

    const step = TOUR_STEPS[stepIndex];
    if (!step) return;

    const popoverWidth = 380;
    const popoverHeight = popoverRef.current?.offsetHeight || 180;
    const margin = 12;

    if (step.placement === "center" || !rect) {
      setPopoverStyle({
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: `${popoverWidth}px`,
        zIndex: 9999,
      });
      return;
    }

    let top = 0;
    let left = 0;

    switch (step.placement) {
      case "bottom":
        top = rect.bottom + margin;
        left = rect.left + rect.width / 2 - popoverWidth / 2;
        break;
      case "top":
        top = rect.top - popoverHeight - margin;
        left = rect.left + rect.width / 2 - popoverWidth / 2;
        break;
      case "left":
        top = rect.top + rect.height / 2 - popoverHeight / 2;
        left = rect.left - popoverWidth - margin;
        break;
      case "right":
        top = rect.top + rect.height / 2 - popoverHeight / 2;
        left = rect.right + margin;
        break;
    }

    // Keep layout within screen bounds
    left = Math.max(16, Math.min(left, width - popoverWidth - 16));
    top = Math.max(16, Math.min(top, window.innerHeight - popoverHeight - 16));

    setPopoverStyle({
      position: "fixed",
      top: `${top}px`,
      left: `${left}px`,
      width: `${popoverWidth}px`,
      zIndex: 9999,
    });
  }, [rect, stepIndex, width, TOUR_STEPS]);

  // Prevent scroll when center step dialog is visible
  useEffect(() => {
    if (
      isActive &&
      width >= 1024 &&
      TOUR_STEPS[stepIndex]?.placement === "center"
    ) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isActive, stepIndex, width, TOUR_STEPS]);

  if (!isActive || width < 1024) return null;

  const currentStep = TOUR_STEPS[stepIndex];
  if (!currentStep) return null;

  const handleSkip = () => {
    localStorage.setItem("ph_tour_completed", "true");
    stopTour();
  };

  const handleNext = () => {
    if (stepIndex === TOUR_STEPS.length - 1) {
      handleSkip();
    } else {
      nextStep();
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-[9990]">
      {/* Spotlight Mask overlay */}
      <svg className="fixed inset-0 w-full h-full pointer-events-none">
        <defs>
          <mask id="tour-spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {rect && currentStep.target && (
              <rect
                x={rect.left - 6}
                y={rect.top - 6}
                width={rect.width + 12}
                height={rect.height + 12}
                rx="12"
                ry="12"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.7)"
          mask="url(#tour-spotlight-mask)"
          className="pointer-events-auto cursor-default"
        />
      </svg>

      {/* Popover Step Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={stepIndex}
          ref={popoverRef}
          style={popoverStyle}
          initial={{
            opacity: 0,
            scale: 0.95,
            y: currentStep.placement === "center" ? -30 : 10,
          }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="pointer-events-auto glass border border-border/80 shadow-elevated rounded-2xl p-4 bg-card/95 text-card-foreground flex flex-col gap-3.5 backdrop-blur-md"
        >
          <div className="flex items-start gap-3.5">
            <div className="flex-shrink-0 bg-primary/10 rounded-2xl p-1 flex items-center justify-center border border-primary/20">
              <HiveyMascot />
            </div>
            <div className="space-y-1 flex-1 min-w-0">
              <h3 className="font-display font-bold text-base text-foreground leading-tight">
                {currentStep.title}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {currentStep.content}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2.5 border-t border-border/40 mt-0.5">
            <span className="text-[10px] font-bold text-muted-foreground bg-secondary px-2.5 py-1 rounded-full border border-border/30">
              {stepIndex + 1} / {TOUR_STEPS.length}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleSkip}
                className="px-2.5 h-7.5 rounded-xl text-[11px] font-semibold hover:bg-secondary text-muted-foreground hover:text-foreground transition duration-200"
              >
                Skip
              </button>
              {stepIndex > 0 && (
                <button
                  onClick={prevStep}
                  className="px-3 h-7.5 rounded-xl text-[11px] font-semibold bg-secondary hover:bg-accent border border-border/60 text-foreground transition duration-200"
                >
                  Back
                </button>
              )}
              <button
                onClick={handleNext}
                className="px-4 h-7.5 rounded-xl text-[11px] font-semibold bg-primary text-primary-foreground hover:opacity-90 transition duration-200 border-0 shadow-sm shadow-primary/20 cursor-pointer animate-pulse"
              >
                {stepIndex === TOUR_STEPS.length - 1 ? "Finish" : "Next"}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
