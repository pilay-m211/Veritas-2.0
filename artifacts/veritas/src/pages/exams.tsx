import { useState } from "react";
import { useListExams, useCreateExam, useUpdateExam, useDeleteExam, useListClasses, getListExamsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { GraduationCap, Plus, Pencil, Trash2, TrendingUp } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

type ExamForm = { title: string; classId: string; totalItems: string };
const empty: ExamForm = { title: "", classId: "", totalItems: "" };

export default function Exams() {
  const { data: exams, isLoading } = useListExams();
  const { data: classes } = useListClasses();
  const createExam = useCreateExam();
  const updateExam = useUpdateExam();
  const deleteExam = useDeleteExam();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<ExamForm>(empty);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListExamsQueryKey() });

  function openCreate() { setEditId(null); setForm(empty); setOpen(true); }
  function openEdit(e: any) {
    setEditId(e.id);
    setForm({ title: e.title, classId: e.classId?.toString() ?? "", totalItems: e.totalItems?.toString() ?? "" });
    setOpen(true);
  }

  function handleSave() {
    const data = { title: form.title, classId: form.classId ? Number(form.classId) : null, totalItems: form.totalItems ? Number(form.totalItems) : null };
    if (editId) {
      updateExam.mutate({ id: editId, data }, {
        onSuccess: () => { toast({ title: "Exam updated" }); invalidate(); setOpen(false); },
        onError: () => toast({ title: "Error updating exam", variant: "destructive" }),
      });
    } else {
      createExam.mutate({ data }, {
        onSuccess: () => { toast({ title: "Exam created" }); invalidate(); setOpen(false); },
        onError: () => toast({ title: "Error creating exam", variant: "destructive" }),
      });
    }
  }

  function handleDelete(id: number) {
    deleteExam.mutate({ id }, {
      onSuccess: () => { toast({ title: "Exam deleted" }); invalidate(); },
      onError: () => toast({ title: "Error deleting exam", variant: "destructive" }),
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Exams</h1>
          <p className="text-sm text-muted-foreground mt-1 font-mono">Manage exam records and grade summaries</p>
        </div>
        <Button data-testid="button-create-exam" onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> New Exam</Button>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-primary" />
          <h2 className="font-semibold text-sm tracking-wide">All Exams</h2>
          <span className="ml-auto text-xs font-mono text-muted-foreground">{exams?.length ?? 0} total</span>
        </div>
        {isLoading ? (
          <div className="p-5 space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 rounded" />)}</div>
        ) : !exams?.length ? (
          <div className="py-16 text-center">
            <GraduationCap className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">No exams yet</p>
            <p className="text-sm text-muted-foreground/60 mt-1">Create your first exam to start grading</p>
            <Button data-testid="button-create-exam-empty" onClick={openCreate} className="mt-4 gap-2" variant="outline"><Plus className="h-4 w-4" /> New Exam</Button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {exams.map((exam) => (
              <div key={exam.id} data-testid={`exam-row-${exam.id}`} className="px-5 py-4 flex items-center justify-between hover:bg-secondary/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="h-9 w-9 rounded-md bg-blue-500/10 flex items-center justify-center">
                    <GraduationCap className="h-4 w-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{exam.title}</p>
                    <p className="text-xs text-muted-foreground font-mono">{exam.className ?? "No class"}{exam.totalItems ? ` · ${exam.totalItems} items` : ""}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-mono text-primary">{exam.averageScore != null ? `${exam.averageScore.toFixed(1)}%` : "—"}</p>
                    <p className="text-xs text-muted-foreground">{exam.gradedCount} graded</p>
                  </div>
                  <div className="flex gap-1">
                    <Button data-testid={`button-edit-exam-${exam.id}`} size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(exam)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button data-testid={`button-delete-exam-${exam.id}`} size="icon" variant="ghost" className="h-8 w-8 text-destructive-foreground hover:bg-destructive/20" onClick={() => handleDelete(exam.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? "Edit Exam" : "New Exam"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Exam Title</Label>
              <Input data-testid="input-exam-title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Midterm Exam Q1" />
            </div>
            <div className="space-y-1.5">
              <Label>Class (optional)</Label>
              <Select value={form.classId} onValueChange={v => setForm(f => ({ ...f, classId: v === "none" ? "" : v }))}>
                <SelectTrigger data-testid="select-exam-class"><SelectValue placeholder="Assign to class..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No class</SelectItem>
                  {classes?.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name} {c.section ?? ""}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Total Items (optional)</Label>
              <Input data-testid="input-exam-total" type="number" value={form.totalItems} onChange={e => setForm(f => ({ ...f, totalItems: e.target.value }))} placeholder="e.g. 50" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button data-testid="button-save-exam" onClick={handleSave} disabled={!form.title || createExam.isPending || updateExam.isPending}>
              {editId ? "Save Changes" : "Create Exam"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
