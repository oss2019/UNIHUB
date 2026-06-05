import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { meQuery, forumsQuery } from "@/lib/queries";
import { userApi, subforumApi } from "@/lib/api";
import { SubForum } from "@/lib/types";

const BRANCH_MAP: Record<string, string> = {
  cs: "Computer Science and Engineering",
  ce: "Civil Engineering",
  ch: "Chemical and Biochemical Engineering",
  me: "Mechanical Engineering",
  ee: "Electrical Engineering",
  ep: "Engineering Physics",
  mn: "Mathematics and Computing",
};

export function OnboardingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: user } = useQuery(meQuery());
  const { data: forums = [] } = useQuery(forumsQuery());

  const [selectedSubForums, setSelectedSubForums] = useState<string[]>([]);
  const [subForums, setSubForums] = useState<SubForum[]>([]);
  const [isLoadingSubForums, setIsLoadingSubForums] = useState(false);

  // Infer branch from email
  const inferredBranch = useMemo(() => {
    if (!user?.email) return "General";
    const match = user.email.split("@")[0].match(/^([a-zA-Z]+)/);
    const code = match ? match[1].toLowerCase() : "";
    return BRANCH_MAP[code] || "General";
  }, [user?.email]);

  // Fetch subforums for the first forum (or all forums) to suggest to user
  useEffect(() => {
    if (forums.length > 0) {
      setIsLoadingSubForums(true);
      // Fetch subforums for all available forums
      Promise.all(forums.map((f) => subforumApi.byForum(f._id)))
        .then((results) => {
          const allSubForums = results.flat();
          setSubForums(allSubForums);

          // Auto-select based on branch or general
          const toSelect: string[] = [];
          allSubForums.forEach((sf) => {
            const name = sf.name.toLowerCase();
            if (
              name.includes(inferredBranch.toLowerCase()) ||
              (inferredBranch === "General" && name.includes("general"))
            ) {
              toSelect.push(sf._id);
            }
          });

          // If branch not found, find a general one
          if (toSelect.length === 0) {
            const generalSf = allSubForums.find((sf) =>
              sf.name.toLowerCase().includes("general"),
            );
            if (generalSf) toSelect.push(generalSf._id);
          }

          setSelectedSubForums(toSelect);
        })
        .finally(() => {
          setIsLoadingSubForums(false);
        });
    }
  }, [forums, inferredBranch]);

  const onboardMutation = useMutation({
    mutationFn: async () => {
      return userApi.onboard({
        branch: inferredBranch,
        joinedSubForums: selectedSubForums,
      });
    },
    onSuccess: () => {
      toast.success("Welcome aboard!");
      queryClient.invalidateQueries({ queryKey: ["me"] });
      navigate("/", { replace: true });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to complete onboarding");
    },
  });

  const toggleSubForum = (id: string) => {
    setSelectedSubForums((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto mt-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-border bg-card p-8 md:p-10 shadow-sm relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="relative">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-semibold mb-6">
            <Sparkles className="h-3.5 w-3.5" /> Welcome to PeerHive
          </div>

          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-3">
            Let's set up your profile
          </h1>

          <p className="text-muted-foreground text-base mb-8">
            We noticed you are from the{" "}
            <strong className="text-foreground">{inferredBranch}</strong>{" "}
            branch. Join some basic subforums to get started with the community.
          </p>

          <div className="space-y-4 mb-8">
            <h3 className="font-display font-semibold text-lg">
              Recommended Subforums
            </h3>

            {isLoadingSubForums ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-16 rounded-xl bg-card border border-border animate-pulse"
                  />
                ))}
              </div>
            ) : subForums.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                No subforums available yet.
              </p>
            ) : (
              <div className="grid gap-3">
                {subForums.slice(0, 6).map((sf) => {
                  const isSelected = selectedSubForums.includes(sf._id);
                  return (
                    <div
                      key={sf._id}
                      onClick={() => toggleSubForum(sf._id)}
                      className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border hover:border-primary/50 bg-background"
                      }`}
                    >
                      <div>
                        <h4 className="font-semibold">{sf.name}</h4>
                        {sf.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {sf.description}
                          </p>
                        )}
                      </div>
                      <div
                        className={`shrink-0 h-6 w-6 rounded-full border flex items-center justify-center ${
                          isSelected
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-muted-foreground/30"
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="h-4 w-4" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => onboardMutation.mutate()}
              disabled={onboardMutation.isPending}
              className="inline-flex items-center gap-2 px-6 h-12 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {onboardMutation.isPending ? "Setting up..." : "Complete Setup"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
