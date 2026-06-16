"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Plus,
  Trash2,
  GripVertical,
  Upload,
  CheckCircle2,
  Save,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RichTextEditor } from "@/components/rich-text-editor";
import { uploadToR2, getVideoDuration } from "@/lib/upload-client";
import { formatDuration } from "@/lib/utils";
import { toast } from "sonner";

type EditorLesson = {
  _id?: string;
  title: string;
  videoKey?: string;
  duration: number;
  isPreview: boolean;
  order: number;
};
type EditorModule = { _id?: string; title: string; order: number; lessons: EditorLesson[] };

type Meta = {
  _id: string;
  title: string;
  shortDescription: string;
  description: string;
  thumbnail: string;
  price: number;
  discount: number;
  subject: string;
  category: string;
  targetExam: string;
  classLevel: string;
  language: string;
  approvalStatus: string;
  isPublished: boolean;
  rejectionReason: string;
};

export function CourseEditor({
  initial,
  initialCurriculum,
}: {
  initial: Meta;
  initialCurriculum: EditorModule[];
}) {
  const router = useRouter();
  const [meta, setMeta] = useState<Meta>(initial);
  const [modules, setModules] = useState<EditorModule[]>(initialCurriculum);
  const [savingDetails, setSavingDetails] = useState(false);
  const [savingCurriculum, setSavingCurriculum] = useState(false);
  const [thumbBusy, setThumbBusy] = useState(false);

  const dragModule = useRef<number | null>(null);
  const dragLesson = useRef<{ m: number; l: number } | null>(null);

  const set = <K extends keyof Meta>(key: K, value: Meta[K]) => setMeta((p) => ({ ...p, [key]: value }));

  /* ----------------------------- Details ----------------------------- */
  async function saveDetails(submitForReview = false) {
    setSavingDetails(true);
    const res = await fetch(`/api/courses/${meta._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...meta, submitForReview }),
    });
    setSavingDetails(false);
    if (!res.ok) return toast.error("Could not save details");
    toast.success(submitForReview ? "Submitted for admin review" : "Details saved");
    if (submitForReview) router.refresh();
  }

  async function onThumbnail(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbBusy(true);
    try {
      const { publicUrl } = await uploadToR2(file, "thumbnail");
      if (publicUrl) set("thumbnail", publicUrl);
      toast.success("Thumbnail uploaded");
    } catch {
      toast.error("Thumbnail upload failed");
    } finally {
      setThumbBusy(false);
    }
  }

  /* ---------------------------- Curriculum ---------------------------- */
  const addModule = () =>
    setModules((p) => [...p, { title: `Module ${p.length + 1}`, order: p.length, lessons: [] }]);

  const removeModule = (mi: number) => setModules((p) => p.filter((_, i) => i !== mi));

  const renameModule = (mi: number, title: string) =>
    setModules((p) => p.map((m, i) => (i === mi ? { ...m, title } : m)));

  const addLesson = (mi: number) =>
    setModules((p) =>
      p.map((m, i) =>
        i === mi
          ? { ...m, lessons: [...m.lessons, { title: "New lesson", duration: 0, isPreview: false, order: m.lessons.length }] }
          : m
      )
    );

  const updateLesson = (mi: number, li: number, patch: Partial<EditorLesson>) =>
    setModules((p) =>
      p.map((m, i) =>
        i === mi ? { ...m, lessons: m.lessons.map((l, j) => (j === li ? { ...l, ...patch } : l)) } : m
      )
    );

  const removeLesson = (mi: number, li: number) =>
    setModules((p) => p.map((m, i) => (i === mi ? { ...m, lessons: m.lessons.filter((_, j) => j !== li) } : m)));

  async function onLessonVideo(mi: number, li: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    updateLesson(mi, li, { title: file.name.replace(/\.[^.]+$/, "") });
    try {
      const duration = await getVideoDuration(file);
      const { key } = await uploadToR2(file, "video", (pct) =>
        // lightweight progress feedback in the title field
        toast.loading(`Uploading… ${pct}%`, { id: `up-${mi}-${li}` })
      );
      toast.dismiss(`up-${mi}-${li}`);
      updateLesson(mi, li, { videoKey: key, duration });
      toast.success("Video uploaded");
    } catch {
      toast.dismiss(`up-${mi}-${li}`);
      toast.error("Video upload failed");
    }
  }

  // Drag & drop reordering for modules.
  const dropModule = (target: number) => {
    const from = dragModule.current;
    if (from === null || from === target) return;
    setModules((p) => {
      const next = [...p];
      const [moved] = next.splice(from, 1);
      next.splice(target, 0, moved);
      return next.map((m, i) => ({ ...m, order: i }));
    });
    dragModule.current = null;
  };

  // Drag & drop reordering for lessons within the same module.
  const dropLesson = (mi: number, target: number) => {
    const from = dragLesson.current;
    if (!from || from.m !== mi || from.l === target) return;
    setModules((p) =>
      p.map((m, i) => {
        if (i !== mi) return m;
        const ls = [...m.lessons];
        const [moved] = ls.splice(from.l, 1);
        ls.splice(target, 0, moved);
        return { ...m, lessons: ls.map((l, j) => ({ ...l, order: j })) };
      })
    );
    dragLesson.current = null;
  };

  async function saveCurriculum() {
    setSavingCurriculum(true);
    const payload = {
      modules: modules.map((m, i) => ({
        _id: m._id,
        title: m.title,
        order: i,
        lessons: m.lessons.map((l, j) => ({
          _id: l._id,
          title: l.title,
          videoKey: l.videoKey,
          duration: l.duration,
          isPreview: l.isPreview,
          order: j,
        })),
      })),
    };
    const res = await fetch(`/api/courses/${meta._id}/curriculum`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSavingCurriculum(false);
    if (!res.ok) return toast.error("Could not save curriculum");
    toast.success("Curriculum saved");
    router.refresh();
  }

  return (
    <div className="container max-w-4xl space-y-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{meta.title}</h1>
          <div className="mt-1 flex items-center gap-2 text-sm">
            <Badge variant={meta.isPublished ? "success" : "secondary"}>
              {meta.isPublished ? "Published" : meta.approvalStatus}
            </Badge>
            {meta.approvalStatus === "rejected" && meta.rejectionReason && (
              <span className="text-destructive">Rejected: {meta.rejectionReason}</span>
            )}
          </div>
        </div>
        <Button onClick={() => saveDetails(true)} disabled={savingDetails}>
          <Send className="h-4 w-4" /> Submit for review
        </Button>
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
        </TabsList>

        {/* ---------------- Details tab ---------------- */}
        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardContent className="space-y-4 p-6">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={meta.title} onChange={(e) => set("title", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Short description</Label>
                <Textarea value={meta.shortDescription} maxLength={280} onChange={(e) => set("shortDescription", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Full description</Label>
                <RichTextEditor value={meta.description} onChange={(html) => set("description", html)} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Price (₹)</Label>
                  <Input type="number" value={meta.price} onChange={(e) => set("price", Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label>Discount (%)</Label>
                  <Input type="number" value={meta.discount} onChange={(e) => set("discount", Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Input value={meta.subject} onChange={(e) => set("subject", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Language</Label>
                  <Input value={meta.language} onChange={(e) => set("language", e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Thumbnail</Label>
                <div className="flex items-center gap-3">
                  {meta.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={meta.thumbnail} alt="thumbnail" className="h-20 w-32 rounded object-cover" />
                  ) : (
                    <div className="flex h-20 w-32 items-center justify-center rounded border border-dashed text-xs text-muted-foreground">
                      No image
                    </div>
                  )}
                  <label className="cursor-pointer">
                    <input type="file" accept="image/*" className="hidden" onChange={onThumbnail} />
                    <span className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-accent">
                      {thumbBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      Upload thumbnail
                    </span>
                  </label>
                </div>
              </div>

              <Button onClick={() => saveDetails(false)} disabled={savingDetails}>
                {savingDetails ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save details
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------- Curriculum tab ---------------- */}
        <TabsContent value="curriculum" className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Drag the <GripVertical className="inline h-3 w-3" /> handles to reorder. Don&apos;t forget to save.
          </p>

          {modules.map((mod, mi) => (
            <Card
              key={mi}
              draggable
              onDragStart={() => (dragModule.current = mi)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => dropModule(mi)}
            >
              <CardContent className="space-y-3 p-4">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 cursor-grab text-muted-foreground" />
                  <Input value={mod.title} onChange={(e) => renameModule(mi, e.target.value)} className="font-semibold" />
                  <Button variant="ghost" size="icon" onClick={() => removeModule(mi)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>

                <div className="space-y-2 pl-6">
                  {mod.lessons.map((lesson, li) => (
                    <div
                      key={li}
                      draggable
                      onDragStart={(e) => {
                        e.stopPropagation();
                        dragLesson.current = { m: mi, l: li };
                      }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.stopPropagation();
                        dropLesson(mi, li);
                      }}
                      className="flex items-center gap-2 rounded-md border bg-background p-2"
                    >
                      <GripVertical className="h-4 w-4 cursor-grab text-muted-foreground" />
                      <Input
                        value={lesson.title}
                        onChange={(e) => updateLesson(mi, li, { title: e.target.value })}
                        className="h-8"
                      />
                      {lesson.videoKey ? (
                        <span className="flex items-center gap-1 whitespace-nowrap text-xs text-green-600">
                          <CheckCircle2 className="h-3 w-3" /> {formatDuration(lesson.duration)}
                        </span>
                      ) : (
                        <label className="cursor-pointer whitespace-nowrap text-xs text-primary">
                          <input type="file" accept="video/*" className="hidden" onChange={(e) => onLessonVideo(mi, li, e)} />
                          Upload video
                        </label>
                      )}
                      <label className="flex items-center gap-1 whitespace-nowrap text-xs">
                        <input
                          type="checkbox"
                          checked={lesson.isPreview}
                          onChange={(e) => updateLesson(mi, li, { isPreview: e.target.checked })}
                        />
                        Free
                      </label>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeLesson(mi, li)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => addLesson(mi)}>
                    <Plus className="h-4 w-4" /> Add lesson
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          <div className="flex gap-3">
            <Button variant="outline" onClick={addModule}>
              <Plus className="h-4 w-4" /> Add module
            </Button>
            <Button onClick={saveCurriculum} disabled={savingCurriculum}>
              {savingCurriculum ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save curriculum
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
