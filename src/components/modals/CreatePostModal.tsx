import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUI } from "@/lib/uiStore";
import { Modal } from "../Modal";
import { Button } from "@/components/ui/button";
import { Bell, X, Paperclip } from "lucide-react";
import { toast } from "sonner";
import { forumsQuery, subforumsByForumQuery, qk } from "@/lib/queries";
import { threadApi, fileToDataURL } from "@/lib/api";

export function CreatePostModal() {
  const { createOpen, setCreateOpen, createDefaultSubforumId } = useUI();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: forums = [] } = useQuery(forumsQuery());
  const [forumId, setForumId] = useState<string>("");
  const [subforumId, setSubforumId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [notify, setNotify] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  const { data: subs = [] } = useQuery(subforumsByForumQuery(forumId));

  // initialise/sync forum selection when opening
  useEffect(() => {
    if (!createOpen) return;
    if (forums.length && !forumId) setForumId(forums[0]._id);
  }, [createOpen, forums, forumId]);

  // honour preselected subforum when modal opens
  useEffect(() => {
    if (!createOpen || !createDefaultSubforumId || !subs.length) return;
    const sub = subs.find((s) => s._id === createDefaultSubforumId);
    if (sub) setSubforumId(sub._id);
  }, [createOpen, createDefaultSubforumId, subs]);

  // when subforum list loads, pick first if none selected (or selection stale)
  useEffect(() => {
    if (!subs.length) {
      setSubforumId("");
      return;
    }
    if (!subs.find((s) => s._id === subforumId)) setSubforumId(subs[0]._id);
  }, [subs, subforumId]);

  const selectedForum = useMemo(() => forums.find((f) => f._id === forumId), [forums, forumId]);

  const addTag = () => {
    const t = tagInput.trim().toLowerCase().replace(/^#/, "");
    if (t && !tags.includes(t) && tags.length < 5) setTags([...tags, t]);
    setTagInput("");
  };

  const reset = () => {
    setTitle("");
    setContent("");
    setTags([]);
    setNotify(false);
    setFiles([]);
  };

  const createMut = useMutation({
    mutationFn: async () => {
      const attachments = files.length ? await Promise.all(files.map(fileToDataURL)) : undefined;
      return threadApi.create({
        title: title.trim(),
        content: content.trim(),
        subForumId: subforumId,
        tags,
        attachments,
        notifyAlumni: notify,
      });
    },
    onSuccess: (thread) => {
      toast.success("Posted");
      qc.invalidateQueries({ queryKey: qk.threadsBySubforum(subforumId) });
      qc.invalidateQueries({ queryKey: qk.threadsByForum(forumId) });
      reset();
      setCreateOpen(false);
      navigate({
        to: "/f/$slug/$subId/$threadId",
        params: { slug: forumId, subId: subforumId, threadId: thread._id },
      });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const submit = () => {
    if (!title.trim() || !content.trim() || !subforumId || tags.length === 0) {
      toast.error("Title, content, subforum, and at least one tag are required.");
      return;
    }
    createMut.mutate();
  };

  return (
    <Modal
      open={createOpen}
      onClose={() => setCreateOpen(false)}
      title="Create a post"
      maxWidth="max-w-2xl"
    >
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Forum">
            <select
              value={forumId}
              onChange={(e) => setForumId(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Select forum…</option>
              {forums.map((f) => (
                <option key={f._id} value={f._id}>
                  {f.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Subforum">
            <select
              value={subforumId}
              onChange={(e) => setSubforumId(e.target.value)}
              disabled={!subs.length}
              className="w-full h-10 px-3 rounded-xl bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
            >
              {subs.length === 0 && <option>No subforums in this forum</option>}
              {subs.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Title">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Sharp, specific titles get more replies"
            className="w-full h-11 px-3 rounded-xl bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            maxLength={200}
          />
        </Field>

        <Field label="Content">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            rows={6}
            className="w-full px-3 py-2.5 rounded-xl bg-secondary text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </Field>

        <Field label="Tags (1–5 required)">
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/15 text-primary text-xs font-medium"
              >
                #{t}
                <button onClick={() => setTags(tags.filter((x) => x !== t))}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder="Type and press enter"
            className="w-full h-9 px-3 rounded-lg bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </Field>

        <Field label="Attachments (images, optional)">
          <label className="flex items-center gap-2 px-3 h-10 rounded-xl bg-secondary text-sm cursor-pointer hover:bg-accent w-fit">
            <Paperclip className="h-4 w-4" /> Add files
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
            />
          </label>
          {files.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1">{files.length} file(s) selected</p>
          )}
        </Field>

        {selectedForum?.type === "normal" && (
          <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
            <input
              type="checkbox"
              checked={notify}
              onChange={(e) => setNotify(e.target.checked)}
              className="accent-primary"
            />
            <Bell className="h-3.5 w-3.5 text-muted-foreground" /> Notify alumni in this subforum
          </label>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button variant="ghost" onClick={() => setCreateOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={createMut.isPending}
            className="bg-primary text-primary-foreground border-0"
          >
            {createMut.isPending ? "Publishing…" : "Publish"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
        {label}
      </span>
      {children}
    </label>
  );
}
