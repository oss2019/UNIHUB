import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  Search,
  Plus,
  Edit2,
  Trash2,
  Quote,
  Sparkles,
  Award,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { facultyReviewsQuery, meQuery, qk } from "@/lib/queries";
import { facultyReviewApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FacultyReviewDialog } from "@/components/modals/FacultyReviewDialog";
import { toast } from "sonner";
import type { FacultyReview } from "@/lib/types";

export function FacultyReviewsPage() {
  const qc = useQueryClient();
  const { data: user } = useQuery(meQuery());
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    document.title = "Course Review — PeerHive.IITDh";
  }, []);

  const { data: reviews = [], isLoading } = useQuery(facultyReviewsQuery());

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<FacultyReview | null>(null);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const deleteMut = useMutation({
    mutationFn: (id: string) => facultyReviewApi.remove(id),
    onSuccess: () => {
      toast.success("Course review deleted.");
      qc.invalidateQueries({ queryKey: qk.facultyReviews });
    },
    onError: (e: Error) => {
      toast.error(e.message || "Failed to delete review.");
    },
  });

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete the review for "${name}"?`)) {
      deleteMut.mutate(id);
    }
  };

  const handleEdit = (rev: FacultyReview) => {
    setSelectedReview(rev);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedReview(null);
    setDialogOpen(true);
  };

  const filteredReviews = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return reviews;
    return reviews.filter(
      (r) =>
        r.facultyName.toLowerCase().includes(q) ||
        r.review.toLowerCase().includes(q)
    );
  }, [reviews, search]);

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 md:p-8">
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Course & Academic Directory</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-display text-foreground">
              Course Review
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
              Verified campus assessments and student guidance covering course rigor, grading patterns, syllabus coverage, and academic mentorship.
            </p>
          </div>

          {isAdmin && (
            <div className="shrink-0">
              <Button onClick={handleCreate} className="gap-2 shadow-md">
                <Plus className="w-4 h-4" /> Add Review
              </Button>
            </div>
          )}
        </div>

        {/* Search Input */}
        <div className="mt-6 max-w-md relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by course code, professor name, or keyword..."
            className="pl-10 h-11 bg-background/80 border-border/80 rounded-xl focus:border-primary/50"
          />
        </div>
      </div>

      {/* Reviews Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-48 rounded-2xl bg-card/60 border border-border/50 animate-pulse p-6"
            />
          ))}
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-border bg-card/40">
          <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center mx-auto text-muted-foreground mb-3">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-foreground text-base">
            {search ? "No reviews match your search" : "No course reviews published yet"}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            {search
              ? "Try tweaking your search term or clear the filter."
              : "Course reviews will appear here once published by academic administrators."}
          </p>
          {isAdmin && !search && (
            <Button onClick={handleCreate} variant="outline" className="mt-4 gap-2">
              <Plus className="w-4 h-4" /> Add the First Review
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <AnimatePresence>
            {filteredReviews.map((rev) => {
              const isExpanded = !!expandedIds[rev._id];
              const isLong = rev.review.length > 280;

              return (
                <motion.div
                  key={rev._id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="rounded-2xl border border-border bg-card hover:border-primary/30 transition-all p-5 shadow-sm flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    {/* Header: Photo + Name + Admin Actions */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3.5 min-w-0">
                        {rev.photo ? (
                          <img
                            src={rev.photo}
                            alt={rev.facultyName}
                            className="w-12 h-12 rounded-full object-cover border-2 border-primary/20 shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-base shrink-0 border border-primary/20">
                            {rev.facultyName.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-semibold text-foreground text-base truncate">
                              {rev.facultyName}
                            </h3>
                            <Award className="w-3.5 h-3.5 text-primary shrink-0" />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            Faculty Member
                          </span>
                        </div>
                      </div>

                      {isAdmin && (
                        <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEdit(rev)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                            title="Edit Review"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(rev._id, rev.facultyName)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            title="Delete Review"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Review text */}
                    <div className="relative text-sm text-foreground/90 leading-relaxed pl-3 border-l-2 border-primary/40 bg-secondary/20 p-3 rounded-r-xl">
                      <Quote className="w-4 h-4 text-primary/40 mb-1" />
                      <p className={`whitespace-pre-line ${!isExpanded && isLong ? "line-clamp-4" : ""}`}>
                        {rev.review}
                      </p>
                      {isLong && (
                        <button
                          type="button"
                          onClick={() => toggleExpand(rev._id)}
                          className="mt-2 text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
                        >
                          {isExpanded ? (
                            <>Show less <ChevronUp className="w-3 h-3" /></>
                          ) : (
                            <>Read full review <ChevronDown className="w-3 h-3" /></>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  {rev.createdAt && (
                    <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>Verified Course Review</span>
                      <span>
                        {new Date(rev.createdAt).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Admin Dialog */}
      <FacultyReviewDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        reviewToEdit={selectedReview}
      />
    </div>
  );
}
