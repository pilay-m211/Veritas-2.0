import { useState } from "react";
import { useListClasses, useCreateClass, useUpdateClass, useDeleteClass, getListClassesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { BookOpen, Plus, Pencil, Trash2, Users } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

type ClassForm = { name: string; section: string; subject: string };
const empty: ClassForm = { name: "", section: "", subject: "" };

export default function Classes() {
  const { data: classes, isLoading } = useListClasses();
  const createClass = useCreateClass();
  const updateClass = useUpdateClass();
  const deleteClass = useDeleteClass();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<ClassForm>(empty);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListClassesQueryKey() });

  function openCreate() { setEditId(null); setForm(empty); setOpen(true); }
  function openEdit(cls: any) { setEditId(cls.id); setForm({ name: cls.name, section: cls.section ?? "", subject: cls.subject ?? "" }); setOpen(true); }

  function handleSave() {
    const data = { name: form.name, section: form.section || null, subject: form.subject || null };
    if (editId) {
      updateClass.mutate({ id: editId, data }, {
        onSuccess: () => { toast({ title: "Class updated" }); invalidate(); setOpen(false); },
        onError: () => toast({ title: "Error updating class", variant: "destructive" }),
      });
    } else {
      createClass.mutate({ data }, {
        onSuccess: () => { toast({ title: "Class created" }); invalidate(); setOpen(false); },
        onError: () => toast({ title: "Error creating class", variant: "destructive" }),
      });
    }
  }

  function handleDelete(id: number) {
    deleteClass.mutate({ id }, {
      onSuccess: () => { toast({ title: "Class deleted" }); invalidate(); },
      onError: () => toast({ title: "Error deleting class", variant: "destructive" }),
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Classes</h1>
          <p className="text-sm text-muted-foreground mt-1 font-mono">Manage class sections and subjects</p>
        </div>
        <Button data-testid="button-create-class" onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> New Class
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          <h2 className="font-semibold text-sm tracking-wide">All Classes</h2>
          <span className="ml-auto text-xs font-mono text-muted-foreground">{classes?.length ?? 0} total</span>
        </div>
        {isLoading ? (
          <div className="p-5 space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 rounded" />)}</div>
        ) : !classes?.length ? (
          <div className="py-16 text-center">
            <BookOpen className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">No classes yet</p>
            <p className="text-sm text-muted-foreground/60 mt-1">Create your first class to get started</p>
            <Button data-testid="button-create-class-empty" onClick={openCreate} className="mt-4 gap-2" variant="outline"><Plus className="h-4 w-4" /> New Class</Button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {classes.map((cls) => (
              <div key={cls.id} data-testid={`class-row-${cls.id}`} className="px-5 py-4 flex items-center justify-between hover:bg-secondary/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center">
                    <BookOpen className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{cls.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{[cls.section, cls.subject].filter(Boolean).join(" · ") || "No section/subject"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                    <Users className="h-3.5 w-3.5" />
                    {cls.studentCount ?? 0}
                  </div>
                  <Button data-testid={`button-edit-class-${cls.id}`} size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(cls)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button data-testid={`button-delete-class-${cls.id}`} size="icon" variant="ghost" className="h-8 w-8 text-destructive-foreground hover:bg-destructive/20" onClick={() => handleDelete(cls.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? "Edit Class" : "New Class"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Class Name</Label>
              <Input data-testid="input-class-name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Grade 10" />
            </div>
            <div className="space-y-1.5">
              <Label>Section</Label>
              <Input data-testid="input-class-section" value={form.section} onChange={e => setForm(f => ({ ...f, section: e.target.value }))} placeholder="e.g. Sampaguita" />
            </div>
            <div className="space-y-1.5">
              <Label>Subject</Label>
              <Input data-testid="input-class-subject" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="e.g. Mathematics" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button data-testid="button-save-class" onClick={handleSave} disabled={!form.name || createClass.isPending || updateClass.isPending}>
              {editId ? "Save Changes" : "Create Class"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
