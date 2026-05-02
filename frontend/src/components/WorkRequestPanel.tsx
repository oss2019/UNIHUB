import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient, useQueries } from "@tanstack/react-query";
import { Plus, Briefcase, X, CheckCircle2 } from "lucide-react";
import type { WorkRequest } from "@/lib/types";
import { forumApi, workRequestApi, subforumApi } from "@/lib/api";
import { qk } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { timeAgo } from "@/lib/format";
import { toast } from "sonner";

export function WorkRequestPanel({
  subforumId,
  requests,
  canCreate,
  forumId,
  currentUserId,
}: {
  subforumId: string;
  requests: WorkRequest[];
  canCreate: boolean;
  /** when canCreate, sibling subforums of the same forum are loaded as targets */
  forumId?: string;
  currentUserId?: string;
}) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const closeMut = useMutation({
    mutationFn: (id: string) => workRequestApi.update(id, { status: "closed" }),
    onSuccess: () => {
      toast.success("Work request closed");
      qc.invalidateQueries({ queryKey: qk.workRequests(subforumId) });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-3">
      {canCreate && (
        <div className="flex justify-end">
          <Button size="sm" variant="outline" onClick={() => setShowForm((v) => !v)}>
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}{" "}
            {showForm ? "Cancel" : "Raise work request"}
          </Button>
        </div>
      )}

      {showForm && forumId && (
        <CreateWorkRequestForm
          forumId={forumId}
          subforumId={subforumId}
          onDone={() => setShowForm(false)}
        />
      )}

      <ul className="space-y-2">
        {requests.map((r) => (
          <li key={r._id} className="rounded-xl bg-secondary/40 p-4">
            <div className="flex items-start gap-3">
              <Briefcase className="h-4 w-4 text-primary mt-1" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-display font-bold">{r.title}</h3>
                  <span
                    className={`text-[10px] uppercase px-1.5 py-0.5 rounded font-bold ${r.status === "open" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}
                  >
                    {r.status}
                  </span>
                </div>
                {r.description && (
                  <p className="text-sm text-muted-foreground mt-1">{r.description}</p>
                )}
                {r.requiredSkills.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {r.requiredSkills.map((s) => (
                      <span
                        key={s}
                        className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-2 text-[11px] text-muted-foreground">
                  by {r.raisedBy.name} · {timeAgo(r.createdAt)}
                </div>
                {currentUserId === r.raisedBy._id && r.status === "open" && (
                  <div className="mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => closeMut.mutate(r._id)}
                      disabled={closeMut.isPending}
                    >
                      Close request
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
      {requests.length === 0 && (
        <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
          No open work requests yet.
        </div>
      )}
    </div>
  );
}

function CreateWorkRequestForm({
  forumId,
  subforumId,
  onDone,
}: {
  forumId: string;
  subforumId: string;
  onDone: () => void;
}) {
  const qc = useQueryClient();
  const { data: forums = [] } = useQuery({
    queryKey: qk.forums,
    queryFn: () => forumApi.list(),
  });
  const subforumLists = useQueries({
    queries: forums.map((f) => ({
      queryKey: qk.subforumsByForum(f._id),
      queryFn: () => subforumApi.byForum(f._id),
      enabled: !!f._id,
    })),
  });
  const allSubforums = subforumLists.flatMap((q) => q.data ?? []);
  const forumNameById = new Map(forums.map((f) => [f._id, f.name]));
  const targetable = allSubforums.filter((s) => s._id !== subforumId);

  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [targets, setTargets] = useState<string[]>(targetable.map((s) => s._id));
  useEffect(() => {
    setTargets((prev) => (prev.length > 0 ? prev : targetable.map((s) => s._id)));
  }, [targetable]);

  const mut = useMutation({
    mutationFn: () =>
      workRequestApi.create(subforumId, {
        title: title.trim(),
        description: desc.trim() || undefined,
        targetSubForumIds: targets,
        requiredSkills: skills,
      }),
    onSuccess: () => {
      toast.success("Work request raised");
      qc.invalidateQueries({ queryKey: qk.workRequests(subforumId) });
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addSkill = () => {
    const s = skillInput.trim().toLowerCase();
    if (s && !skills.includes(s)) setSkills([...skills, s]);
    setSkillInput("");
  };

  const submit = () => {
    if (!title.trim() || targets.length === 0) {
      toast.error("Title and at least one target subforum required.");
      return;
    }
    mut.mutate();
  };

  return (
    <div className="rounded-xl bg-secondary/40 p-4 space-y-3">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title (e.g. Need React dev for dashboard)"
        className="w-full h-10 px-3 rounded-lg bg-card text-sm"
        maxLength={200}
      />
      <textarea
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        rows={3}
        placeholder="Describe the work…"
        className="w-full p-3 rounded-lg bg-card text-sm resize-none"
        maxLength={2000}
      />
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
          Required skills
        </div>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {skills.map((s) => (
            <span key={s} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/15 text-primary text-xs">
              {s}
              <button onClick={() => setSkills(skills.filter((x) => x !== s))}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <input
          value={skillInput}
          onChange={(e) => setSkillInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              addSkill();
            }
          }}
          placeholder="Press enter to add"
          className="w-full h-9 px-3 rounded-lg bg-card text-sm"
        />
      </div>
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
          Notify which subforums?
        </div>
        <div className="flex flex-wrap gap-1.5">
          {targetable.length === 0 && (
            <span className="text-xs text-muted-foreground">No sibling subforums in this forum.</span>
          )}
          {targetable.map((s) => {
            const on = targets.includes(s._id);
            const forumRef = typeof s.forum === "string" ? s.forum : s.forum?._id;
            const forumName =
              (typeof s.forum === "object" && s.forum?.name) ||
              (forumRef ? forumNameById.get(forumRef) : undefined);
            return (
              <button
                key={s._id}
                onClick={() =>
                  setTargets(on ? targets.filter((x) => x !== s._id) : [...targets, s._id])
                }
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs ${on ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"}`}
              >
                {on && <CheckCircle2 className="h-3 w-3" />} {s.name}
                {forumName ? ` (${forumName})` : ""}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={submit}
          disabled={mut.isPending}
          className="bg-primary text-primary-foreground border-0"
        >
          {mut.isPending ? "Sending…" : "Raise request"}
        </Button>
      </div>
    </div>
  );
}
