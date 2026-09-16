import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Modal } from "../Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { qk } from "@/lib/queries";
import { teamApi, fileToDataURL } from "@/lib/api";
import type { TeamMember, TeamCategory } from "@/lib/types";
import { ImagePlus, Loader2, X, User, Calendar, CheckCircle2 } from "lucide-react";

interface TeamMemberDialogProps {
  open: boolean;
  onClose: () => void;
  memberToEdit?: TeamMember | null;
  defaultCategory?: TeamCategory;
}

const CATEGORY_OPTIONS: { value: TeamCategory; label: string }[] = [
  { value: "dev-team", label: "Dev Team (Platform Engineers & Designers)" },
  { value: "academic-council", label: "Academic Council (Alumni & Advisors)" },
  { value: "current-academic-council", label: "Current Academic Council" },
];

export function TeamMemberDialog({
  open,
  onClose,
  memberToEdit,
  defaultCategory = "dev-team",
}: TeamMemberDialogProps) {
  const qc = useQueryClient();
  const currentYear = new Date().getFullYear();

  const [name, setName] = useState("");
  const [graduationYear, setGraduationYear] = useState<number>(currentYear);
  const [category, setCategory] = useState<TeamCategory>(defaultCategory);
  const [photo, setPhoto] = useState<string>("");
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  useEffect(() => {
    if (memberToEdit) {
      setName(memberToEdit.name || "");
      setGraduationYear(memberToEdit.graduationYear || currentYear);
      setCategory(memberToEdit.category || defaultCategory);
      setPhoto(memberToEdit.photo || "");
    } else {
      setName("");
      setGraduationYear(currentYear);
      setCategory(defaultCategory);
      setPhoto("");
    }
  }, [memberToEdit, defaultCategory, open, currentYear]);

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
      const payload = {
        name: name.trim(),
        graduationYear: Number(graduationYear),
        category,
        photo: photo || "",
      };

      if (memberToEdit) {
        return teamApi.update(memberToEdit._id, payload);
      } else {
        return teamApi.create({
          ...payload,
          photo: photo || undefined,
        });
      }
    },
    onSuccess: () => {
      toast.success(
        memberToEdit ? "Team member updated!" : "Team member added!"
      );
      qc.invalidateQueries({ queryKey: ["team"] });
      onClose();
    },
    onError: (e: Error) => {
      toast.error(e.message || "Failed to save team member.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Member name is required.");
      return;
    }
    if (name.length > 120) {
      toast.error("Name must be under 120 characters.");
      return;
    }
    const gradYearNum = Number(graduationYear);
    if (!gradYearNum || gradYearNum < 1960 || gradYearNum > currentYear + 10) {
      toast.error(`Graduation year must be between 1960 and ${currentYear + 10}.`);
      return;
    }
    saveMut.mutate();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={memberToEdit ? "Edit Team Member" : "Add Team Member"}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Full Name <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="e.g. Aditi Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={120}
              className="pl-9"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Graduation Year <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="number"
                min={1960}
                max={currentYear + 10}
                value={graduationYear}
                onChange={(e) => setGraduationYear(Number(e.target.value))}
                className="pl-9"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Category <span className="text-rose-500">*</span>
            </label>
            <Select
              value={category}
              onValueChange={(val) => setCategory(val as TeamCategory)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Photo (Optional)
          </label>
          {photo ? (
            <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-primary/20 group mx-auto bg-secondary/30">
              <img
                src={photo}
                alt="Member avatar"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => setPhoto("")}
                className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                title="Remove photo"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-4 cursor-pointer hover:border-primary/50 hover:bg-accent/40 transition-colors">
              <ImagePlus className="w-6 h-6 text-muted-foreground mb-1" />
              <span className="text-xs font-medium text-foreground">
                Upload member photo
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
            disabled={saveMut.isPending || !name.trim() || isProcessingImage}
            className="gap-1.5"
          >
            {saveMut.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" /> {memberToEdit ? "Update Member" : "Add Member"}
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
