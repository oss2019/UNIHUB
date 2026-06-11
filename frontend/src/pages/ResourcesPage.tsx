import { useState, useEffect, useMemo, ComponentType } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Folder,
  FolderOpen,
  Plus,
  ExternalLink,
  Download,
  ThumbsUp,
  Bookmark,
  Copy,
  FileText,
  FileArchive,
  Github,
  HardDrive,
  Link as LinkIcon,
  ChevronRight,
  Library,
  Sparkles,
  BookOpen,
  Briefcase,
  Terminal,
  ShieldCheck,
  UserCheck,
  X,
  Gauge,
  Trash2,
} from "lucide-react";
import { meQuery, resourcesQuery } from "@/lib/queries";
import { resourceApi } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/Modal";
import { Badge } from "@/components/ui/badge";
import {
  Resource,
  ResourceCategory,
  ResourceFileType,
  CreateResourceInput,
} from "@/lib/mockResources";

// Stream Types definition
export type StreamType =
  | "cs"
  | "electrical"
  | "mechanical"
  | "math-sciences"
  | "humanities"
  | "placement"
  | "other";

// Map course code prefix to streams
const getStreamFromCourseCode = (courseCode: string): StreamType => {
  if (!courseCode) return "other";
  const code = courseCode.toUpperCase();
  if (code.startsWith("CS")) return "cs";
  if (code.startsWith("EE") || code.startsWith("EC") || code.startsWith("EN"))
    return "electrical";
  if (code.startsWith("ME")) return "mechanical";
  if (code.startsWith("MA") || code.startsWith("PH") || code.startsWith("CH"))
    return "math-sciences";
  if (code.startsWith("HS")) return "humanities";
  if (code === "PLACEMENTS" || code.startsWith("PLACE")) return "placement";
  return "other";
};

// Stream display details mapping
const getStreamInfo = (stream: StreamType) => {
  const mapping: Record<
    StreamType,
    {
      label: string;
      icon: ComponentType<{ className?: string }>;
      color: string;
      description: string;
    }
  > = {
    cs: {
      label: "Computer Science & Engineering",
      icon: Terminal,
      color: "text-indigo-500 fill-indigo-500/10 border-indigo-500/20",
      description:
        "DSA, programming, networks, machine learning and systems core.",
    },
    electrical: {
      label: "Electrical & Electronics Engineering",
      icon: HardDrive,
      color: "text-amber-500 fill-amber-500/10 border-amber-500/20",
      description:
        "Circuit systems, signal processing, and electronics analysis.",
    },
    mechanical: {
      label: "Mechanical Engineering",
      icon: Gauge,
      color: "text-sky-500 fill-sky-500/10 border-sky-500/20",
      description:
        "Thermodynamics, fluid mechanics, design, and instrumentation.",
    },
    "math-sciences": {
      label: "Mathematics & Basic Sciences",
      icon: Library,
      color: "text-emerald-500 fill-emerald-500/10 border-emerald-500/20",
      description:
        "Linear algebra, multivariable calculus, physics, and chemistry.",
    },
    humanities: {
      label: "Humanities & Social Sciences",
      icon: BookOpen,
      color: "text-purple-500 fill-purple-500/10 border-purple-500/20",
      description:
        "Technical writing, communications, and economics curriculum.",
    },
    placement: {
      label: "Placements & Careers",
      icon: Briefcase,
      color: "text-red-500 fill-red-500/10 border-red-500/20",
      description:
        "Interview logs, coding sheets, resume templates, and prep logs.",
    },
    other: {
      label: "General & Miscellaneous",
      icon: Library,
      color:
        "text-muted-foreground fill-muted-foreground/10 border-muted-foreground/20",
      description:
        "General orientation guides, software guidelines, and student discounts.",
    },
  };
  return mapping[stream];
};

// Get style color for different file types
const getFileTypeStyle = (type: ResourceFileType) => {
  switch (type) {
    case "PDF":
      return {
        bg: "bg-red-500/10 text-red-500 border-red-500/20",
        icon: FileText,
      };
    case "ZIP":
      return {
        bg: "bg-amber-500/10 text-amber-500 border-amber-500/20",
        icon: FileArchive,
      };
    case "GitHub":
      return {
        bg: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
        icon: Github,
      };
    case "Drive":
      return {
        bg: "bg-green-500/10 text-green-500 border-green-500/20",
        icon: HardDrive,
      };
    default:
      return {
        bg: "bg-sky-500/10 text-sky-500 border-sky-500/20",
        icon: LinkIcon,
      };
  }
};

export function ResourcesPage() {
  useEffect(() => {
    document.title = "Resources — PeerHive";
  }, []);

  const queryClient = useQueryClient();

  // Fetch current user
  const { data: user } = useQuery(meQuery());

  // Bookmark states synchronized in LocalStorage (bookmarking is omitted from card actions, but we keep it for category filtering if active)
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    const saved = localStorage.getItem("ph_bookmarked_resources");
    return saved ? JSON.parse(saved) : [];
  });

  // Admin simulation toggle
  const [simulateAdmin, setSimulateAdmin] = useState(false);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStream, setSelectedStream] = useState<string>("all");

  // Debounce search query to prevent excessive API calls
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch Resources from backend via React Query
  const { data: resources = [], isLoading } = useQuery(
    resourcesQuery({
      category:
        selectedCategory !== "all" && selectedCategory !== "bookmarked"
          ? selectedCategory
          : undefined,
      search:
        debouncedSearch.trim() !== "" ? debouncedSearch.trim() : undefined,
    }),
  );

  // Add Resource Mutation
  const createMutation = useMutation({
    mutationFn: (newResource: CreateResourceInput) =>
      resourceApi.create(newResource),
    onSuccess: (data) => {
      toast.success("Resource uploaded successfully!");
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      setIsUploadOpen(false);

      // Expand the folder for the stream
      const targetStream = getStreamFromCourseCode(data.courseCode);
      setExpandedFolders((prev) => ({ ...prev, [targetStream]: true }));

      // Reset fields
      setNewTitle("");
      setNewDescription("");
      setNewUrl("");
      setNewCategory("course-material");
      setNewCourseCode("");
      setNewCourseName("");
      setNewSemester(3);
      setNewFileType("PDF");
      setNewFileSize("");
      setNewTagsString("");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to upload resource");
    },
  });

  // Download Trigger Mutation
  const downloadMutation = useMutation({
    mutationFn: (id: string) => resourceApi.incrementDownload(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
    },
  });

  // Delete Resource Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => resourceApi.remove(id),
    onSuccess: () => {
      toast.success("Resource deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["resources"] });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to delete resource");
    },
  });

  // Expanded folders state (stores stream keys like cs, electrical)
  const [expandedFolders, setExpandedFolders] = useState<
    Record<string, boolean>
  >(() => {
    return {
      cs: true,
      electrical: true,
      mechanical: true,
      "math-sciences": true,
      humanities: true,
      placement: true,
      other: true,
    };
  });

  // Add Resource Modal state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newCategory, setNewCategory] =
    useState<ResourceCategory>("course-material");
  const [newCourseCode, setNewCourseCode] = useState("");
  const [newCourseName, setNewCourseName] = useState("");
  const [newSemester, setNewSemester] = useState<number>(3);
  const [newFileType, setNewFileType] = useState<ResourceFileType>("PDF");
  const [newFileSize, setNewFileSize] = useState("");
  const [newTagsString, setNewTagsString] = useState("");

  const handleBookmarkToggle = (id: string) => {
    let updated;
    if (bookmarkedIds.includes(id)) {
      updated = bookmarkedIds.filter((x) => x !== id);
      toast.info("Removed from Bookmarks");
    } else {
      updated = [...bookmarkedIds, id];
      toast.success("Added to Bookmarks");
    }
    setBookmarkedIds(updated);
    localStorage.setItem("ph_bookmarked_resources", JSON.stringify(updated));
  };

  const handleDownloadTrigger = (id: string, url: string) => {
    downloadMutation.mutate(id);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("Resource link copied to clipboard!");
  };

  // Check if admin (either actual database role or UI simulation toggle)
  const isAdmin = useMemo(() => {
    return user?.role === "admin" || simulateAdmin;
  }, [user?.role, simulateAdmin]);

  // Sync simulation toggle with actual role when loaded
  useEffect(() => {
    if (user?.role === "admin") {
      setSimulateAdmin(true);
    }
  }, [user?.role]);

  // Handle Form Submission
  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newTitle.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!newUrl.trim() || !newUrl.startsWith("http")) {
      toast.error("Valid URL is required (must start with http/https)");
      return;
    }
    if (!newCourseCode.trim()) {
      toast.error("Course code is required (e.g. CS-201)");
      return;
    }
    if (!newCourseName.trim()) {
      toast.error("Course name is required");
      return;
    }

    const parsedTags = newTagsString
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);

    const newResourcePayload: CreateResourceInput = {
      title: newTitle.trim(),
      description: newDescription.trim() || "No description provided.",
      category: newCategory,
      tags: parsedTags.length > 0 ? parsedTags : ["academic"],
      url: newUrl.trim(),
      courseCode: newCourseCode.trim().toUpperCase(),
      courseName: newCourseName.trim(),
      semester: Number(newSemester),
      fileType: newFileType,
      fileSize: newFileSize.trim() || "Web Link",
    };

    createMutation.mutate(newResourcePayload);
  };

  // Filter & Sort Logic (mainly filtering by client-only options like bookmarks & streams)
  const filteredResources = useMemo(() => {
    return resources.filter((r) => {
      // Category Filter for bookmarks (others handled by API)
      if (selectedCategory === "bookmarked") {
        if (!bookmarkedIds.includes(r._id)) return false;
      }

      // Stream Filter (Sidebar Selector)
      if (selectedStream !== "all") {
        const stream = getStreamFromCourseCode(r.courseCode);
        if (stream !== selectedStream) return false;
      }

      return true;
    });
  }, [resources, selectedCategory, selectedStream, bookmarkedIds]);

  // Group Filtered Resources by Stream
  const groupedResources = useMemo(() => {
    const groups: Record<StreamType, Resource[]> = {
      cs: [],
      electrical: [],
      mechanical: [],
      "math-sciences": [],
      humanities: [],
      placement: [],
      other: [],
    };
    filteredResources.forEach((r) => {
      const stream = getStreamFromCourseCode(r.courseCode);
      groups[stream].push(r);
    });
    return groups;
  }, [filteredResources]);

  // Display only streams that have matching resources
  const activeStreams = useMemo(() => {
    const streams: StreamType[] = [
      "cs",
      "electrical",
      "mechanical",
      "math-sciences",
      "humanities",
      "placement",
      "other",
    ];
    return streams.filter((s) => {
      // If we are filtering by a specific stream in sidebar, only show that stream
      if (selectedStream !== "all" && s !== selectedStream) return false;
      // Show stream folder only if there are resources inside it
      return groupedResources[s].length > 0;
    });
  }, [groupedResources, selectedStream]);

  const toggleFolder = (stream: StreamType) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [stream]: !prev[stream],
    }));
  };

  const handleChipClick = (term: string) => {
    setSearchQuery(term);
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Hero Header Section */}
      <section className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 md:p-8">
        <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3">
                <Sparkles className="h-3.5 w-3.5" /> Curated Repository
              </span>
              <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
                PeerHive <span className="text-primary">Resources</span>
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Browse academic lecture slides, lab manuals, projects, and
                career documents categorized by streams.
              </p>
            </div>

            {isAdmin && (
              <Button
                size="sm"
                onClick={() => setIsUploadOpen(true)}
                className="bg-primary text-primary-foreground font-medium flex items-center gap-1.5 border-0 hover:opacity-95"
              >
                <Plus className="h-4 w-4" /> Upload Resource
              </Button>
            )}
          </div>

          {/* Search bar inside Hero */}
          <div data-tour="resources-search" className="mt-6 max-w-xl">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by subject code, title, tags (e.g. CS-201, calculus)..."
                className="w-full h-11 pl-10 pr-4 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {/* Quick tag suggestions */}
            <div className="mt-3 flex flex-wrap gap-1.5 items-center">
              <span className="text-xs text-muted-foreground mr-1.5">
                Quick search:
              </span>
              {["MA-201", "DSA", "MATLAB", "Signals", "Interview Prep"].map(
                (term) => (
                  <button
                    key={term}
                    onClick={() => handleChipClick(term)}
                    className="text-xs px-2 py-0.5 rounded-md bg-secondary hover:bg-accent text-muted-foreground hover:text-foreground border border-border/50 transition"
                  >
                    {term}
                  </button>
                ),
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Sidebar Filters */}
        <aside className="lg:col-span-1 space-y-6">
          {/* Categories Sidebar */}
          <div
            data-tour="resources-categories"
            className="bg-card rounded-2xl border border-border p-4 space-y-2"
          >
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2 mb-2">
              Categories
            </h3>
            <nav className="space-y-1">
              {[
                { id: "all", label: "All Resources", icon: Library },
                {
                  id: "course-material",
                  label: "Course Materials",
                  icon: BookOpen,
                },
                { id: "lab-manual", label: "Lab Manuals", icon: Terminal },
                { id: "project", label: "Student Projects", icon: Github },
                { id: "placement", label: "Placement Prep", icon: Briefcase },
                {
                  id: "bookmarked",
                  label: "Bookmarked",
                  icon: Bookmark,
                  badge: bookmarkedIds.length,
                },
              ].map((cat) => {
                const active = selectedCategory === cat.id;
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`w-full flex items-center justify-between px-3 h-10 rounded-xl text-xs font-medium transition ${
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground/70 hover:text-foreground hover:bg-secondary"
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon className="h-4 w-4" />
                      {cat.label}
                    </span>
                    {cat.badge !== undefined && cat.badge > 0 && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                          active
                            ? "bg-primary-foreground text-primary"
                            : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        {cat.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Stream-Wise Sidebar Filtering Selector */}
          <div className="bg-card rounded-2xl border border-border p-3.5 py-4 space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2 mb-2">
              Filter by Stream
            </h3>
            <nav className="space-y-1">
              {[
                { id: "all", label: "All Streams", icon: Library },
                { id: "cs", label: "Computer Science", icon: Terminal },
                {
                  id: "electrical",
                  label: "Electrical Engineering",
                  icon: HardDrive,
                },
                {
                  id: "mechanical",
                  label: "Mechanical Engineering",
                  icon: Gauge,
                },
                {
                  id: "math-sciences",
                  label: "Math & Sciences",
                  icon: Library,
                },
                {
                  id: "humanities",
                  label: "Humanities & Social",
                  icon: BookOpen,
                },
                {
                  id: "placement",
                  label: "Placements & Career",
                  icon: Briefcase,
                },
              ].map((stream) => {
                const active = selectedStream === stream.id;
                const Icon = stream.icon;
                return (
                  <button
                    key={stream.id}
                    onClick={() => setSelectedStream(stream.id)}
                    className={`w-full flex items-center justify-between px-3 h-9 rounded-lg text-xs font-medium transition ${
                      active
                        ? "bg-secondary text-primary font-medium border-l-2 border-primary"
                        : "text-foreground/70 hover:text-foreground hover:bg-secondary"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Icon className="h-2.5 w-2.5" />
                      {stream.label}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Right Content Listings */}
        <main className="lg:col-span-3 space-y-6">
          {/* Controls Bar */}
          {/* <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card rounded-2xl border border-border p-4">
            <div className="text-sm text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{filteredResources.length}</span> resources
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto">
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="h-9 px-3 rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="latest">Latest Uploads</option>
                <option value="upvotes">Top Upvoted</option>
                <option value="downloads">Most Visited/Downloaded</option>
              </select>

              {isAdmin && (
                <Button
                  size="sm"
                  onClick={() => setIsUploadOpen(true)}
                  className="bg-primary text-primary-foreground font-medium flex items-center gap-1.5 border-0 hover:opacity-95"
                >
                  <Plus className="h-4 w-4" /> Upload Resource
                </Button>
              )}
            </div>
          </div> */}

          {/* Empty State / Loading State */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-16 space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              <p className="text-sm text-muted-foreground">
                Loading resources...
              </p>
            </div>
          ) : filteredResources.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-card/40 p-16 text-center">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center mb-4">
                <Library className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-display font-bold text-lg">
                No resources match your filters
              </h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                Try resetting your search queries or selecting a different
                category/stream.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                  setSelectedStream("all");
                }}
                className="mt-4"
              >
                Clear all filters
              </Button>
            </div>
          ) : (
            /* Stream Folders Accordion List */
            <div data-tour="resources-list" className="space-y-4">
              {activeStreams.map((stream) => {
                const subResources = groupedResources[stream] || [];
                const expanded = expandedFolders[stream] ?? true;
                const streamInfo = getStreamInfo(stream);
                const StreamIcon = streamInfo.icon;

                return (
                  <div
                    key={stream}
                    className="border border-border rounded-2xl bg-card/60 overflow-hidden transition-all duration-300 hover:border-border/80"
                  >
                    {/* Folder Header */}
                    <button
                      onClick={() => toggleFolder(stream)}
                      className="w-full flex items-center justify-between p-4 bg-card/40 hover:bg-card transition duration-200 border-b border-border/20"
                    >
                      <div className="flex items-center gap-3 text-left">
                        <div
                          className={`p-2 rounded-xl border border-border bg-card ${streamInfo.color}`}
                        >
                          <StreamIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-display font-bold text-base leading-tight">
                            {streamInfo.label}
                          </h3>
                          <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">
                            {streamInfo.description} • {subResources.length}{" "}
                            {subResources.length === 1
                              ? "resource"
                              : "resources"}
                          </p>
                        </div>
                      </div>
                      <ChevronRight
                        className={`h-4 w-4 text-muted-foreground transition-transform duration-300 ${
                          expanded ? "rotate-90" : ""
                        }`}
                      />
                    </button>

                    {/* Folder Content Grid */}
                    <AnimatePresence initial={false}>
                      {expanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: "easeInOut" }}
                        >
                          <div className="p-4 bg-card/10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {subResources.map((res) => {
                                const isBookmarked = bookmarkedIds.includes(
                                  res._id,
                                );
                                const fileStyle = getFileTypeStyle(
                                  res.fileType,
                                );
                                const TypeIcon = fileStyle.icon;

                                return (
                                  <motion.div
                                    key={res._id}
                                    layout
                                    className="group flex flex-col justify-between p-5 rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-card transition duration-300 relative"
                                  >
                                    <div>
                                      {/* Card Top Row */}
                                      <div className="flex items-start justify-between gap-2 mb-3">
                                        <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                                          <Badge
                                            variant="outline"
                                            className="text-[10px] font-bold font-mono py-0 bg-secondary/30"
                                          >
                                            {res.courseCode}
                                          </Badge>
                                          <span
                                            className="text-[10px] text-muted-foreground truncate max-w-[120px]"
                                            title={res.courseName}
                                          >
                                            {res.courseName}
                                          </span>
                                        </div>

                                        {/* File Type Badge */}
                                        <div
                                          className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold uppercase shrink-0 ${fileStyle.bg}`}
                                          title={`File format: ${res.fileType}`}
                                        >
                                          <TypeIcon className="h-3 w-3" />
                                          <span>{res.fileType}</span>
                                          {res.fileSize && (
                                            <span className="opacity-60 pl-0.5 border-l border-current/20 ml-0.5">
                                              {res.fileSize}
                                            </span>
                                          )}
                                        </div>
                                      </div>

                                      {/* Card Title & Description */}
                                      <h4
                                        className="font-display font-bold text-base group-hover:text-primary transition duration-200 line-clamp-1 cursor-pointer"
                                        onClick={() =>
                                          handleDownloadTrigger(
                                            res._id,
                                            res.url,
                                          )
                                        }
                                        title={res.title}
                                      >
                                        {res.title}
                                      </h4>
                                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2 min-h-[32px]">
                                        {res.description}
                                      </p>

                                      {/* Card Tags */}
                                      <div className="mt-3 flex flex-wrap gap-1.5">
                                        {res.tags.map((tag) => (
                                          <span
                                            key={tag}
                                            className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground/80 hover:text-foreground transition cursor-pointer"
                                            onClick={() => handleChipClick(tag)}
                                          >
                                            #{tag}
                                          </span>
                                        ))}
                                      </div>
                                    </div>

                                    {/* Card Footer Actions */}
                                    <div className="mt-5 pt-3 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
                                      <span
                                        className="truncate max-w-[120px]"
                                        title={`Uploaded by ${res.uploadedBy?.name || "Admin"}`}
                                      >
                                        by{" "}
                                        {
                                          (
                                            res.uploadedBy?.name || "Admin"
                                          ).split(" ")[0]
                                        }
                                      </span>

                                      <div className="flex items-center gap-1">
                                        {/* Upvote (disabled/commented out) */}

                                        {/* Bookmark (disabled/commented out) */}

                                        {/* Copy Link (disabled/commented out) */}

                                        {/* Delete (Admin-only) */}
                                        {isAdmin && (
                                          <button
                                            onClick={() => {
                                              if (
                                                window.confirm(
                                                  "Are you sure you want to permanently delete this resource?",
                                                )
                                              ) {
                                                deleteMutation.mutate(res._id);
                                              }
                                            }}
                                            disabled={deleteMutation.isPending}
                                            className="p-1.5 rounded-lg border border-red-500/30 text-red-500 hover:bg-red-500/10 transition"
                                            title="Delete Resource"
                                          >
                                            <Trash2 className="h-3.5 w-3.5" />
                                          </button>
                                        )}

                                        {/* Download/Open */}
                                        <button
                                          onClick={() =>
                                            handleDownloadTrigger(
                                              res._id,
                                              res.url,
                                            )
                                          }
                                          className="p-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition font-medium flex items-center gap-0.5 ml-0.5 border-0"
                                          title="Open/Download resource"
                                        >
                                          {res.fileType === "PDF" ||
                                          res.fileType === "ZIP" ? (
                                            <Download className="h-3.5 w-3.5" />
                                          ) : (
                                            <ExternalLink className="h-3.5 w-3.5" />
                                          )}
                                        </button>
                                      </div>
                                    </div>
                                  </motion.div>
                                );
                              })}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Admin Upload Modal */}
      <Modal
        open={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        title="Upload Academic Resource"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleUploadSubmit} className="p-6 space-y-4">
          <div className="flex gap-4">
            <label className="flex-1 block">
              <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Course Code *
              </span>
              <input
                type="text"
                required
                value={newCourseCode}
                onChange={(e) => setNewCourseCode(e.target.value)}
                placeholder="e.g. CS-201, MA-101, ME-201"
                className="w-full h-11 px-3 rounded-xl bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </label>
            <label className="flex-1 block">
              <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Course Name *
              </span>
              <input
                type="text"
                required
                value={newCourseName}
                onChange={(e) => setNewCourseName(e.target.value)}
                placeholder="e.g. Data Structures, Thermodynamics"
                className="w-full h-11 px-3 rounded-xl bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </label>
          </div>

          <label className="block">
            <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Resource Title *
            </span>
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. End-Sem Solved PyQs 2024"
              className="w-full h-11 px-3 rounded-xl bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </label>

          <label className="block">
            <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Resource URL (Google Drive, GitHub, URL) *
            </span>
            <input
              type="url"
              required
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://drive.google.com/..."
              className="w-full h-11 px-3 rounded-xl bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </label>

          <label className="block">
            <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Description
            </span>
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Include helpful details about the resource contents..."
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl bg-secondary text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
              maxLength={250}
            />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Category
              </span>
              <select
                value={newCategory}
                onChange={(e) =>
                  setNewCategory(e.target.value as ResourceCategory)
                }
                className="w-full h-11 px-3 rounded-xl bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 border-0"
              >
                <option value="course-material">Course Material</option>
                <option value="lab-manual">Lab Manual</option>
                <option value="project">Student Project</option>
                <option value="placement">Placement Prep</option>
                <option value="other">Other</option>
              </select>
            </label>

            <label className="block">
              <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Target Semester
              </span>
              <select
                value={newSemester}
                onChange={(e) => setNewSemester(Number(e.target.value))}
                className="w-full h-11 px-3 rounded-xl bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 border-0"
              >
                {Array.from({ length: 8 }).map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Semester {i + 1}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                File / Reference Type
              </span>
              <select
                value={newFileType}
                onChange={(e) =>
                  setNewFileType(e.target.value as ResourceFileType)
                }
                className="w-full h-11 px-3 rounded-xl bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 border-0"
              >
                <option value="PDF">PDF Document</option>
                <option value="ZIP">ZIP Archive</option>
                <option value="Drive">Google Drive</option>
                <option value="GitHub">GitHub Link</option>
                <option value="Link">Web Link</option>
              </select>
            </label>

            <label className="block">
              <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Info (optional)
              </span>
              <input
                type="text"
                value={newFileSize}
                onChange={(e) => setNewFileSize(e.target.value)}
                placeholder="e.g. PDF, Web Link, Folder"
                className="w-full h-11 px-3 rounded-xl bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </label>
          </div>

          <label className="block">
            <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Tags (comma separated)
            </span>
            <input
              type="text"
              value={newTagsString}
              onChange={(e) => setNewTagsString(e.target.value)}
              placeholder="e.g. formulas, solved-papers, exam-prep"
              className="w-full h-11 px-3 rounded-xl bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </label>

          <div className="flex justify-end gap-2 pt-4 border-t border-border mt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsUploadOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-primary text-primary-foreground border-0 hover:opacity-90"
            >
              Submit Resource
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
