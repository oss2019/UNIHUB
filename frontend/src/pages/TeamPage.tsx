import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Code2,
  GraduationCap,
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  ShieldCheck,
} from "lucide-react";
import { teamGroupedQuery, meQuery, qk } from "@/lib/queries";
import { teamApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TeamMemberDialog } from "@/components/modals/TeamMemberDialog";
import { toast } from "sonner";
import type { TeamMember, TeamCategory, TeamGrouped } from "@/lib/types";

interface SectionMeta {
  title: string;
  category: TeamCategory;
  subtitle: string;
  icon: typeof Code2;
  badgeColor: string;
}

const SECTIONS: SectionMeta[] = [
  {
    category: "dev-team",
    title: "Development Team",
    subtitle: "Engineers, architects, and designers crafting the digital campus ecosystem.",
    icon: Code2,
    badgeColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  },
  {
    category: "current-academic-council",
    title: "Current Academic Council",
    subtitle: "Active department delegates, student council leads, and forum stewards.",
    icon: GraduationCap,
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  {
    category: "academic-council",
    title: "Academic Council & Alumni Advisors",
    subtitle: "Distinguished alumni and founding academic council members driving mentorship.",
    icon: ShieldCheck,
    badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
];

export function TeamPage() {
  const qc = useQueryClient();
  const { data: user } = useQuery(meQuery());
  const isAdmin = user?.role === "admin";

  const { data: teamData, isLoading } = useQuery(teamGroupedQuery());

  const [activeTab, setActiveTab] = useState<"all" | TeamCategory>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [targetCategory, setTargetCategory] = useState<TeamCategory>("dev-team");

  const deleteMut = useMutation({
    mutationFn: (id: string) => teamApi.remove(id),
    onSuccess: () => {
      toast.success("Team member removed.");
      qc.invalidateQueries({ queryKey: ["team"] });
    },
    onError: (e: Error) => {
      toast.error(e.message || "Failed to remove member.");
    },
  });

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove "${name}" from the team?`)) {
      deleteMut.mutate(id);
    }
  };

  const handleEdit = (m: TeamMember) => {
    setSelectedMember(m);
    setTargetCategory(m.category);
    setDialogOpen(true);
  };

  const handleCreate = (cat: TeamCategory = "dev-team") => {
    setSelectedMember(null);
    setTargetCategory(cat);
    setDialogOpen(true);
  };

  const grouped: TeamGrouped = teamData || {
    "dev-team": [],
    "academic-council": [],
    "current-academic-council": [],
  };

  const totalMembers =
    (grouped["dev-team"]?.length || 0) +
    (grouped["academic-council"]?.length || 0) +
    (grouped["current-academic-council"]?.length || 0);

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 md:p-8">
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>The People Behind PeerHive.IITDh</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-display text-foreground">
              Our Community & Council
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
              Meet the student developers, council delegates, and alumni leaders who build, curate, and maintain PeerHive.IITDh for the entire institution.
            </p>
          </div>

          {isAdmin && (
            <div className="shrink-0">
              <Button onClick={() => handleCreate("dev-team")} className="gap-2 shadow-md">
                <Plus className="w-4 h-4" /> Add Member
              </Button>
            </div>
          )}
        </div>

        {/* Tab Filters */}
        <div className="mt-6 flex flex-wrap gap-2 pt-2 border-t border-border/50">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-colors ${
              activeTab === "all"
                ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                : "bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            All Members ({totalMembers})
          </button>
          {SECTIONS.map((sec) => {
            const count = grouped[sec.category]?.length || 0;
            return (
              <button
                key={sec.category}
                onClick={() => setActiveTab(sec.category)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  activeTab === sec.category
                    ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                    : "bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <span>{sec.title}</span>
                <span className="text-[11px] opacity-75">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sections Content */}
      {isLoading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-3">
              <div className="h-6 w-48 bg-card/60 rounded-md animate-pulse" />
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((j) => (
                  <div
                    key={j}
                    className="h-44 rounded-2xl bg-card/60 border border-border/50 animate-pulse"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-10">
          {SECTIONS.filter((sec) => activeTab === "all" || activeTab === sec.category).map(
            (sec) => {
              const members = grouped[sec.category] || [];
              const Icon = sec.icon;

              return (
                <section key={sec.category} className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-secondary text-primary">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-foreground tracking-tight">
                          {sec.title}
                        </h2>
                        <p className="text-xs text-muted-foreground">
                          {sec.subtitle}
                        </p>
                      </div>
                    </div>

                    {isAdmin && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCreate(sec.category)}
                        className="gap-1 text-xs self-start sm:self-auto"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add to {sec.title.split(" ")[0]}
                      </Button>
                    )}
                  </div>

                  {members.length === 0 ? (
                    <div className="p-8 text-center rounded-2xl border border-dashed border-border bg-card/30">
                      <p className="text-sm text-muted-foreground">
                        No members added to this category yet.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      <AnimatePresence>
                        {members.map((member) => (
                          <motion.div
                            key={member._id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative group rounded-2xl border border-border bg-card p-5 hover:border-primary/40 transition-all flex flex-col items-center text-center shadow-sm"
                          >
                            {/* Admin quick controls */}
                            {isAdmin && (
                              <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm rounded-lg p-0.5 border border-border shadow-sm">
                                <button
                                  onClick={() => handleEdit(member)}
                                  className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                                  title="Edit member"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(member._id, member.name)}
                                  className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                  title="Remove member"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}

                            {/* Avatar */}
                            <div className="relative mb-3">
                              {member.photo ? (
                                <img
                                  src={member.photo}
                                  alt={member.name}
                                  className="w-20 h-20 rounded-full object-cover border-2 border-primary/30 group-hover:scale-105 transition-transform"
                                />
                              ) : (
                                <div className="w-20 h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xl border-2 border-primary/20 group-hover:scale-105 transition-transform">
                                  {member.name.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                            </div>

                            {/* Info */}
                            <h3 className="font-bold text-foreground text-sm line-clamp-1">
                              {member.name}
                            </h3>

                            <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Calendar className="w-3.5 h-3.5 text-primary/70" />
                              <span>Class of {member.graduationYear}</span>
                            </div>

                            <Badge
                              variant="outline"
                              className={`mt-3 text-[11px] font-medium ${sec.badgeColor}`}
                            >
                              {sec.title.split(" ")[0]}
                            </Badge>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </section>
              );
            }
          )}
        </div>
      )}

      {/* Admin Dialog */}
      <TeamMemberDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        memberToEdit={selectedMember}
        defaultCategory={targetCategory}
      />
    </div>
  );
}
