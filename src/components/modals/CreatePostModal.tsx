import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { Modal } from "../Modal";
import { Button } from "@/components/ui/button";
import { Bell, X } from "lucide-react";

export function CreatePostModal() {
  const { createOpen, setCreateOpen, forums, createThread } = useStore();
  const navigate = useNavigate();
  const [forumId, setForumId] = useState(forums[0]?.id ?? "");
  const [subforumId, setSubforumId] = useState(forums[0]?.subforums[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [notify, setNotify] = useState(false);

  const subs = forums.find((f) => f.id === forumId)?.subforums ?? [];

  const addTag = () => {
    const t = tagInput.trim().toLowerCase().replace(/^#/, "");
    if (t && !tags.includes(t) && tags.length < 5) setTags([...tags, t]);
    setTagInput("");
  };

  const submit = () => {
    if (!title.trim() || !content.trim() || !subforumId) return;
    const thread = createThread({ forumId, subforumId, title: title.trim(), content: content.trim(), tags });
    setTitle(""); setContent(""); setTags([]); setNotify(false);
    const slug = forums.find((f) => f.id === forumId)?.slug ?? "";
    navigate({ to: "/f/$slug/$subId/$threadId", params: { slug, subId: subforumId, threadId: thread.id } });
  };

  return (
    <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create a post" maxWidth="max-w-2xl">
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Forum">
            <select
              value={forumId}
              onChange={(e) => { setForumId(e.target.value); setSubforumId(forums.find((f) => f.id === e.target.value)?.subforums[0]?.id ?? ""); }}
              className="w-full h-10 px-3 rounded-xl bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {forums.map((f) => <option key={f.id} value={f.id}>{f.icon} {f.name}</option>)}
            </select>
          </Field>
          <Field label="Subforum">
            <select
              value={subforumId}
              onChange={(e) => setSubforumId(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {subs.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Title">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Sharp, specific titles get more replies"
            className="w-full h-11 px-3 rounded-xl bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            maxLength={140}
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

        <Field label="Tags (up to 5)">
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map((t) => (
              <span key={t} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/15 text-primary text-xs font-medium">
                #{t}
                <button onClick={() => setTags(tags.filter((x) => x !== t))}><X className="h-3 w-3" /></button>
              </span>
            ))}
          </div>
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); } }}
            placeholder="Type and press enter"
            className="w-full h-9 px-3 rounded-lg bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </Field>

        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="accent-primary" />
          <Bell className="h-3.5 w-3.5 text-muted-foreground" /> Notify alumni in this subforum
        </label>

        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!title.trim() || !content.trim()} className="bg-gradient-primary text-primary-foreground border-0">
            Publish
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">{label}</span>
      {children}
    </label>
  );
}
