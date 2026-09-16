import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Modal } from "../Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { qk } from "@/lib/queries";
import { facultyReviewApi, fileToDataURL } from "@/lib/api";
import type { FacultyReview } from "@/lib/types";
import { ImagePlus, Loader2, X, GraduationCap, CheckCircle2 } from "lucide-react";

interface FacultyReviewDialogProps {
  open: boolean;
  onClose: () => void;
  reviewToEdit?: FacultyReview | null;
}

export function FacultyReviewDialog({
  open,
  onClose,
  reviewToEdit,
}: FacultyReviewDialogProps) {
  const qc = useQueryClient();
  const [facultyName, setFacultyName] = useState("");
  const [review, setReview] = useState("");
  const [photo, setPhoto] = useState<string>("");
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  useEffect(() => {
    if (reviewToEdit) {
      setFacultyName(reviewToEdit.facultyName || "");
      setReview(reviewToEdit.review || "");
      setPhoto(reviewToEdit.photo || "");
    } else {
      setFacultyName("");
      setReview("");
      setPhoto("");
    }
  }, [reviewToEdit, open]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      toast.error("Photo size must be under 3MB.");
      return;
    }

    try {
      setIsProcessingImage(true);
      const base64 = await fileToDataURL(file);
      setPhoto(base64);
    } catch {
      toast.error("Failed to read image.");
    } finally {
      setIsProcessingImage(false);
    }
  };

  const saveMut = useMutation({
    mutationFn: async () => {
      if (reviewToEdit) {
        return facultyReviewApi.update(reviewToEdit._id, {
          facultyName: facultyName.trim(),
          review: review.trim(),
          photo: photo || "",
        });
      } else {
        return facultyReviewApi.create({
          facultyName: facultyName.trim(),
          review: review.trim(),
          photo: photo || undefined,
        });
      }
    },
    onSuccess: () => {
      toast.success(
        reviewToEdit ? "Faculty review updated!" : "Faculty review published!"
      );
      qc.invalidateQueries({ queryKey: qk.facultyReviews });
      onClose();
    },
    onError: (e: Error) => {
      toast.error(e.message || "Failed to save faculty review.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!facultyName.trim()) {
      toast.error("Faculty name is required.");
      return;
    }
    if (!review.trim()) {
      toast.error("Review content is required.");
      return;
    }
    if (facultyName.length > 120) {
      toast.error("Faculty name must be under 120 characters.");
      return;
    }
    if (review.length > 5000) {
      toast.error("Review content must be under 5000 characters.");
      return;
    }
    saveMut.mutate();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={reviewToEdit ? "Edit Faculty Review" : "Add Faculty Review"}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Faculty Member Name <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <GraduationCap className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="e.g. Prof. Arvind Sharma"
              value={facultyName}
              onChange={(e) => setFacultyName(e.target.value)}
              maxLength={120}
              className="pl-9"
              required
            />
          </div>
          <div className="flex justify-end text-[11px] text-muted-foreground">
            {facultyName.length}/120
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Review / Assessment <span className="text-rose-500">*</span>
          </label>
          <Textarea
            placeholder="Teaching methodology, grading approach, research areas, student guidance, and practical advice..."
            value={review}
            onChange={(e) => setReview(e.target.value)}
            rows={6}
            maxLength={5000}
            required
          />
          <div className="flex justify-end text-[11px] text-muted-foreground">
            {review.length}/5000
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Faculty Photo (Optional)
          </label>
          {photo ? (
            <div className="relative w-28 h-28 rounded-2xl overflow-hidden border border-border group bg-secondary/30">
              <img
                src={photo}
                alt="Faculty preview"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => setPhoto("")}
                className="absolute top-1.5 right-1.5 p-1 rounded-full bg-background/80 hover:bg-background text-foreground shadow transition-colors"
                title="Remove photo"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-4 cursor-pointer hover:border-primary/50 hover:bg-accent/40 transition-colors">
              <ImagePlus className="w-6 h-6 text-muted-foreground mb-1" />
              <span className="text-xs font-medium text-foreground">
                Upload faculty photo
              </span>
              <span className="text-[11px] text-muted-foreground">
                PNG, JPG or WEBP up to 3MB
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
                disabled={isProcessingImage}
              />
            </label>
          )}
        </div>

        <div className="pt-2 flex justify-end gap-2 border-t border-border mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={saveMut.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={saveMut.isPending || !facultyName.trim() || !review.trim() || isProcessingImage}
            className="gap-1.5"
          >
            {saveMut.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" /> {reviewToEdit ? "Update Review" : "Publish Review"}
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
