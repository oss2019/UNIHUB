import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUI } from "@/lib/uiStore";
import { Modal } from "../Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { meQuery, qk } from "@/lib/queries";
import { reportApi, fileToDataURL } from "@/lib/api";
import type { ReportCategory } from "@/lib/types";
import { ImagePlus, Loader2, X, AlertCircle, CheckCircle2 } from "lucide-react";

const CATEGORIES: { value: ReportCategory; label: string; description: string }[] = [
  { value: "bug", label: "Bug / Defect", description: "Something is broken or producing an error" },
  { value: "ui", label: "UI / Design Issue", description: "Visual glitch, alignment, or layout problem" },
  { value: "performance", label: "Performance", description: "Slow loading or laggy interactions" },
  { value: "content", label: "Inappropriate Content", description: "Misleading or offensive content in the platform" },
  { value: "account", label: "Account Issue", description: "Profile, authentication, or permission problems" },
  { value: "other", label: "Other", description: "Any other feedback or problem" },
];

export function ReportIssueModal() {
  const { reportModalOpen, setReportModalOpen, setAuthOpen } = useUI();
  const qc = useQueryClient();
  const { data: user } = useQuery(meQuery());

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ReportCategory>("bug");
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  const reset = () => {
    setTitle("");
    setDescription("");
    setCategory("bug");
    setScreenshotPreview(null);
    setIsProcessingImage(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: keep base64 reasonable (< 4MB)
    if (file.size > 4 * 1024 * 1024) {
      toast.error("Screenshot image must be under 4MB.");
      return;
    }

    try {
      setIsProcessingImage(true);
      const base64 = await fileToDataURL(file);
      setScreenshotPreview(base64);
    } catch {
      toast.error("Failed to read image file.");
    } finally {
      setIsProcessingImage(false);
    }
  };

  const createMut = useMutation({
    mutationFn: async () => {
      return reportApi.create({
        title: title.trim(),
        description: description.trim(),
        category,
        screenshot: screenshotPreview || undefined,
      });
    },
    onSuccess: () => {
      toast.success("Issue report submitted. Our team will look into it!");
      qc.invalidateQueries({ queryKey: ["reports"] });
      reset();
      setReportModalOpen(false);
    },
    onError: (e: Error) => {
      toast.error(e.message || "Failed to submit report.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please sign in to submit a report.");
      setAuthOpen(true);
      return;
    }
    if (!title.trim()) {
      toast.error("Please enter a short title for the issue.");
      return;
    }
    if (!description.trim()) {
      toast.error("Please describe the issue in detail.");
      return;
    }
    if (title.length > 150) {
      toast.error("Title must be 150 characters or less.");
      return;
    }
    if (description.length > 2000) {
      toast.error("Description must be 2000 characters or less.");
      return;
    }
    createMut.mutate();
  };

  return (
    <Modal
      open={reportModalOpen}
      onClose={() => setReportModalOpen(false)}
      title="Report an Issue or Bug"
      maxWidth="max-w-lg"
    >
      <div className="p-6">
        {!user ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-foreground">Sign In Required</h4>
              <p className="text-sm text-muted-foreground">
                You must be logged in to your UNIHUB account to submit issue reports so we can track and follow up on your problem.
              </p>
            </div>
            <Button
              onClick={() => {
                setReportModalOpen(false);
                setAuthOpen(true);
              }}
              className="w-full"
            >
              Sign In to Continue
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Category
              </label>
              <Select
                value={category}
                onValueChange={(val) => setCategory(val as ReportCategory)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      <div className="flex flex-col text-left py-0.5">
                        <span className="font-medium text-foreground">{cat.label}</span>
                        <span className="text-xs text-muted-foreground">{cat.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Title <span className="text-rose-500">*</span>
              </label>
              <Input
                placeholder="Brief summary of what happened (e.g., Cannot download PDF notes)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={150}
                required
              />
              <div className="flex justify-end text-[11px] text-muted-foreground">
                {title.length}/150
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Description <span className="text-rose-500">*</span>
              </label>
              <Textarea
                placeholder="Describe what went wrong, steps to reproduce, or what you expected to happen..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                maxLength={2000}
                required
              />
              <div className="flex justify-end text-[11px] text-muted-foreground">
                {description.length}/2000
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Screenshot / Visual Attachment (Optional)
              </label>
              {screenshotPreview ? (
                <div className="relative rounded-xl overflow-hidden border border-border group bg-secondary/30">
                  <img
                    src={screenshotPreview}
                    alt="Issue screenshot preview"
                    className="w-full max-h-48 object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => setScreenshotPreview(null)}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 hover:bg-background text-foreground shadow transition-colors"
                    title="Remove image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-4 cursor-pointer hover:border-primary/50 hover:bg-accent/40 transition-colors">
                  <ImagePlus className="w-6 h-6 text-muted-foreground mb-1" />
                  <span className="text-xs font-medium text-foreground">
                    Upload screenshot
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    PNG, JPG, or WEBP up to 4MB
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
                onClick={() => setReportModalOpen(false)}
                disabled={createMut.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMut.isPending || !title.trim() || !description.trim() || isProcessingImage}
                className="gap-1.5"
              >
                {createMut.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Submit Report
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
