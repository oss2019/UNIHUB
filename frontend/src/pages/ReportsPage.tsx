import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  Bug,
  CheckCircle2,
  Clock,
  Filter,
  Layers,
  MessageSquare,
  Plus,
  Trash2,
  User,
  XCircle,
  Eye,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Search,
  Check,
  Edit3,
} from "lucide-react";
import {
  allReportsQuery,
  myReportsQuery,
  reportStatsQuery,
  meQuery,
  qk,
} from "@/lib/queries";
import { reportApi } from "@/lib/api";
import { useUI } from "@/lib/uiStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Modal } from "@/components/Modal";
import { toast } from "sonner";
import type {
  Report,
  ReportCategory,
  ReportStatus,
  ReportStats,
} from "@/lib/types";

const STATUS_CONFIG: Record<
  ReportStatus,
  { label: string; bg: string; text: string; border: string; icon: typeof Clock }
> = {
  open: {
    label: "Open",
    bg: "bg-amber-500/10",
    text: "text-amber-500",
    border: "border-amber-500/30",
    icon: Clock,
  },
  "in-progress": {
    label: "In Progress",
    bg: "bg-sky-500/10",
    text: "text-sky-500",
    border: "border-sky-500/30",
    icon: Bug,
  },
  resolved: {
    label: "Resolved",
    bg: "bg-emerald-500/10",
    text: "text-emerald-500",
    border: "border-emerald-500/30",
    icon: CheckCircle2,
  },
  dismissed: {
    label: "Dismissed",
    bg: "bg-slate-500/10",
    text: "text-slate-400",
    border: "border-slate-500/30",
    icon: XCircle,
  },
};

const CATEGORY_LABELS: Record<ReportCategory, string> = {
  bug: "Bug / Defect",
  ui: "UI / Layout",
  performance: "Performance",
  content: "Content",
  account: "Account",
  other: "Other",
};

export function ReportsPage() {
  const qc = useQueryClient();
  const { data: user } = useQuery(meQuery());
  const { setReportModalOpen, setAuthOpen } = useUI();
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    document.title = "Reports — PeerHive.IITDh";
  }, []);

  // Tab: for admins, allow switching between "all" (Triage) and "mine"
  const [activeTab, setActiveTab] = useState<"triage" | "mine">("mine");
  const [userToggledTab, setUserToggledTab] = useState(false);

  useEffect(() => {
    if (isAdmin && !userToggledTab) {
      setActiveTab("triage");
    }
  }, [isAdmin, userToggledTab]);

  // Admin filter states
  const [statusFilter, setStatusFilter] = useState<ReportStatus | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<ReportCategory | "all">(
    "all"
  );
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [triageReport, setTriageReport] = useState<Report | null>(null);
  const [triageStatus, setTriageStatus] = useState<ReportStatus>("open");
  const [adminNote, setAdminNote] = useState("");

  // Queries
  const { data: statsData } = useQuery(reportStatsQuery(isAdmin));
  const { data: myData, isLoading: myLoading } = useQuery(
    myReportsQuery(1, 50, !!user)
  );
  const { data: allData, isLoading: allLoading } = useQuery(
    allReportsQuery(
      {
        status: statusFilter === "all" ? undefined : statusFilter,
        category: categoryFilter === "all" ? undefined : categoryFilter,
        page: 1,
        limit: 50,
      },
      isAdmin && activeTab === "triage"
    )
  );

  const stats: ReportStats = statsData || {
    open: 0,
    "in-progress": 0,
    resolved: 0,
    dismissed: 0,
  };

  // Mutations
  const triageMut = useMutation({
    mutationFn: async ({
      id,
      status,
      adminNote,
    }: {
      id: string;
      status?: ReportStatus;
      adminNote?: string;
    }) => {
      return reportApi.triage(id, { status, adminNote });
    },
    onSuccess: () => {
      toast.success("Report updated successfully.");
      qc.invalidateQueries({ queryKey: ["reports"] });
      setTriageReport(null);
    },
    onError: (e: Error) => {
      toast.error(e.message || "Failed to update report.");
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => reportApi.remove(id),
    onSuccess: () => {
      toast.success("Report deleted.");
      qc.invalidateQueries({ queryKey: ["reports"] });
    },
    onError: (e: Error) => {
      toast.error(e.message || "Failed to delete report.");
    },
  });

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this report?")) {
      deleteMut.mutate(id);
    }
  };

  const handleOpenTriage = (r: Report) => {
    setTriageReport(r);
    setTriageStatus(r.status);
    setAdminNote(r.adminNote || "");
  };

  const handleSaveTriage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!triageReport) return;
    triageMut.mutate({
      id: triageReport._id,
      status: triageStatus,
      adminNote: adminNote.trim(),
    });
  };

  const displayedReports: Report[] = useMemo(() => {
    const list =
      activeTab === "triage" && isAdmin
        ? allData?.reports || []
        : myData?.reports || [];

    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q)
    );
  }, [activeTab, isAdmin, allData, myData, searchQuery]);

  const isLoading = activeTab === "triage" && isAdmin ? allLoading : myLoading;

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 md:p-8">
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-semibold">
              <Bug className="w-3.5 h-3.5" />
              <span>Platform Support</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-display text-foreground">
              {isAdmin && activeTab === "triage"
                ? "Issue Reports Triage Board"
                : "My Issue Reports"}
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
              {isAdmin && activeTab === "triage"
                ? "Review, prioritize, assign, and resolve user-submitted bugs, glitches, and feedback tickets across PeerHive.IITDh."
                : "Track the real-time status of bugs, layout glitches, and suggestions you've filed with the development team."}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              onClick={() => {
                if (!user) return setAuthOpen(true);
                setReportModalOpen(true);
              }}
              className="gap-2 shadow-md"
            >
              <Plus className="w-4 h-4" /> Report an Issue
            </Button>
          </div>
        </div>

        {/* Tab switcher for admins */}
        {isAdmin && (
          <div className="mt-6 flex gap-2 border-t border-border/50 pt-4">
            <button
              onClick={() => {
                setActiveTab("triage");
                setUserToggledTab(true);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 ${
                activeTab === "triage"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <Layers className="w-4 h-4" /> Admin Triage ({stats.open + stats["in-progress"] + stats.resolved + stats.dismissed})
            </button>
            <button
              onClick={() => {
                setActiveTab("mine");
                setUserToggledTab(true);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 ${
                activeTab === "mine"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <User className="w-4 h-4" /> My Filed Reports ({myData?.reports?.length || 0})
            </button>
          </div>
        )}
      </div>

      {/* Admin Stats Summary Cards */}
      {isAdmin && activeTab === "triage" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(
            [
              { status: "open", label: "Open Issues", count: stats.open, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" },
              { status: "in-progress", label: "In Progress", count: stats["in-progress"], color: "text-sky-500", bg: "bg-sky-500/10", border: "border-sky-500/20" },
              { status: "resolved", label: "Resolved", count: stats.resolved, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
              { status: "dismissed", label: "Dismissed", count: stats.dismissed, color: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/20" },
            ] as const
          ).map((item) => {
            const isSelected = statusFilter === item.status;
            return (
              <button
                key={item.status}
                type="button"
                onClick={() =>
                  setStatusFilter(statusFilter === item.status ? "all" : item.status)
                }
                className={`p-4 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? "ring-2 ring-primary border-transparent bg-secondary"
                    : "bg-card border-border hover:border-border/80"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    {item.label}
                  </span>
                  <div className={`p-1.5 rounded-lg ${item.bg} ${item.color}`}>
                    <span className="w-2 h-2 rounded-full block bg-current" />
                  </div>
                </div>
                <div className={`text-2xl font-bold mt-2 ${item.color}`}>
                  {item.count}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Filter Bar */}
      {isAdmin && activeTab === "triage" && (
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between p-3 rounded-2xl bg-card border border-border">
          <div className="flex flex-wrap gap-2 w-full sm:w-auto items-center">
            <div className="relative flex-1 sm:w-60">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search reports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as ReportStatus | "all")}
            >
              <SelectTrigger className="w-36 h-9 text-xs">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="dismissed">Dismissed</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={categoryFilter}
              onValueChange={(v) => setCategoryFilter(v as ReportCategory | "all")}
            >
              <SelectTrigger className="w-36 h-9 text-xs">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="bug">Bug / Defect</SelectItem>
                <SelectItem value="ui">UI / Layout</SelectItem>
                <SelectItem value="performance">Performance</SelectItem>
                <SelectItem value="content">Content</SelectItem>
                <SelectItem value="account">Account</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(statusFilter !== "all" || categoryFilter !== "all" || searchQuery) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStatusFilter("all");
                setCategoryFilter("all");
                setSearchQuery("");
              }}
              className="text-xs h-8 text-muted-foreground hover:text-foreground"
            >
              Reset Filters
            </Button>
          )}
        </div>
      )}

      {/* Reports List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-28 rounded-2xl bg-card/60 border border-border/50 animate-pulse"
            />
          ))}
        </div>
      ) : displayedReports.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-border bg-card/40">
          <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center mx-auto text-muted-foreground mb-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
          </div>
          <h3 className="font-semibold text-foreground text-base">
            No reports found
          </h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            {activeTab === "triage"
              ? "All caught up! There are no matching issue reports right now."
              : "You haven't filed any problem reports yet. If you encounter any bugs, let us know!"}
          </p>
          {activeTab === "mine" && (
            <Button
              onClick={() => {
                if (!user) return setAuthOpen(true);
                setReportModalOpen(true);
              }}
              variant="outline"
              className="mt-4 gap-2"
            >
              <Plus className="w-4 h-4" /> Report an Issue
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {displayedReports.map((r) => {
              const statusCfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.open;
              const StatusIcon = statusCfg.icon;
              const reporterName =
                typeof r.reportedBy === "object" && r.reportedBy
                  ? r.reportedBy.name
                  : "Anonymous / User";

              return (
                <motion.div
                  key={r._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="rounded-2xl border border-border bg-card p-5 hover:border-primary/30 transition-all shadow-sm space-y-3 group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                        >
                          <StatusIcon className="w-3.5 h-3.5" />
                          {statusCfg.label}
                        </span>

                        <Badge variant="outline" className="text-[11px] font-normal">
                          {CATEGORY_LABELS[r.category] || r.category}
                        </Badge>

                        <span className="text-xs text-muted-foreground">
                          {new Date(r.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      <h3 className="font-bold text-foreground text-base pt-1">
                        {r.title}
                      </h3>
                    </div>

                    {/* Admin Action Buttons */}
                    {isAdmin && (
                      <div className="flex items-center gap-1 shrink-0 self-end sm:self-start">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenTriage(r)}
                          className="h-8 text-xs gap-1.5"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Triage
                        </Button>
                        <button
                          onClick={() => handleDelete(r._id)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title="Delete report"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">
                    {r.description}
                  </p>

                  {/* Screenshot Thumbnail */}
                  {r.screenshot && (
                    <div className="pt-1">
                      <div
                        onClick={() => setPreviewImage(r.screenshot || null)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-secondary/80 hover:bg-secondary text-xs font-medium cursor-pointer border border-border/60 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 text-primary" />
                        <span>View Attached Screenshot</span>
                      </div>
                    </div>
                  )}

                  {/* Admin Note if present */}
                  {r.adminNote && (
                    <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-xs text-foreground/90 space-y-1 mt-2">
                      <div className="flex items-center gap-1.5 font-semibold text-primary">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Admin Resolution Note</span>
                      </div>
                      <p className="pl-5 leading-relaxed">{r.adminNote}</p>
                    </div>
                  )}

                  {/* Reporter info footer */}
                  <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>
                      Reported by: <strong className="font-semibold text-foreground/80">{reporterName}</strong>
                    </span>
                    {r.resolvedAt && (
                      <span>
                        Resolved {new Date(r.resolvedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Screenshot Preview Modal */}
      <Modal
        open={!!previewImage}
        onClose={() => setPreviewImage(null)}
        title="Report Screenshot Preview"
        maxWidth="max-w-3xl"
      >
        <div className="p-4 flex items-center justify-center bg-black/20">
          {previewImage && (
            <img
              src={previewImage}
              alt="Report screenshot attachment"
              className="max-h-[75vh] w-auto object-contain rounded-xl border border-border"
            />
          )}
        </div>
      </Modal>

      {/* Admin Triage Modal */}
      <Modal
        open={!!triageReport}
        onClose={() => setTriageReport(null)}
        title={`Triage Report: ${triageReport?.title || ""}`}
        maxWidth="max-w-lg"
      >
        {triageReport && (
          <form onSubmit={handleSaveTriage} className="p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Status
              </label>
              <Select
                value={triageStatus}
                onValueChange={(val) => setTriageStatus(val as ReportStatus)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open (Unresolved)</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="dismissed">Dismissed (Not a bug / won't fix)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Admin Note / Resolution Response
              </label>
              <Textarea
                placeholder="Explain the resolution or leave notes for the user and fellow admins..."
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                rows={4}
                maxLength={1000}
              />
              <div className="flex justify-end text-[11px] text-muted-foreground">
                {adminNote.length}/1000
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-border mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setTriageReport(null)}
                disabled={triageMut.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={triageMut.isPending}
                className="gap-1.5"
              >
                <Check className="w-4 h-4" /> Save Triage
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
