import { useState } from "react";
import { useListStudents, useCreateStudent, useUpdateStudent, useDeleteStudent, useListClasses, getListStudentsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Users, Plus, Pencil, Trash2, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

type StudentForm = { studentId: string; firstName: string; lastName: string; classId: string };
const empty: StudentForm = { studentId: "", firstName: "", lastName: "", classId: "" };

export default function Students() {
  const [search, setSearch] = useState("");
  const { data: students, isLoading } = useListStudents({ search: search || undefined });
  const { data: classes } = useListClasses();
  const createStudent = useCreateStudent();
  const updateStudent = useUpdateStudent();
  const deleteStudent = useDeleteStudent();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<StudentForm>(empty);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListStudentsQueryKey() });

  function openCreate() { setEditId(null); setForm(empty); setOpen(true); }
  function openEdit(s: any) {
    setEditId(s.id);
    setForm({ studentId: s.studentId, firstName: s.firstName, lastName: s.lastName, classId: s.classId?.toString() ?? "" });
    setOpen(true);
  }

  function handleSave() {
    const data = { studentId: form.studentId, firstName: form.firstName, lastName: form.lastName, classId: form.classId ? Number(form.classId) : null };
    if (editId) {
      updateStudent.mutate({ id: editId, data }, {
        onSuccess: () => { toast({ title: "Student updated" }); invalidate(); setOpen(false); },
        onError: () => toast({ title: "Error updating student", variant: "destructive" }),
      });
    } else {
      createStudent.mutate({ data }, {
        onSuccess: () => { toast({ title: "Student added" }); invalidate(); setOpen(false); },
        onError: () => toast({ title: "Error adding student", variant: "destructive" }),
      });
    }
  }

  function handleDelete(id: number) {
    deleteStudent.mutate({ id }, {
      onSuccess: () => { toast({ title: "Student removed" }); invalidate(); },
      onError: () => toast({ title: "Error removing student", variant: "destructive" }),
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Students</h1>
          <p className="text-sm text-muted-foreground mt-1 font-mono">Student roster and grade records</p>
        </div>
        <Button data-testid="button-add-student" onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> Add Student</Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input data-testid="input-search-students" className="pl-9" placeholder="Search by name or student ID..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <h2 className="font-semibold text-sm tracking-wide">Student Roster</h2>
          <span className="ml-auto text-xs font-mono text-muted-foreground">{students?.length ?? 0} students</span>
        </div>
        {isLoading ? (
          <div className="p-5 space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 rounded" />)}</div>
        ) : !students?.length ? (
          <div className="py-16 text-center">
            <Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">{search ? "No students match your search" : "No students yet"}</p>
            {!search && <Button data-testid="button-add-student-empty" onClick={openCreate} className="mt-4 gap-2" variant="outline"><Plus className="h-4 w-4" /> Add Student</Button>}
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-5 px-5 py-2 bg-secondary/50 text-xs font-mono text-muted-foreground uppercase tracking-wider">
              <span>Student ID</span><span className="col-span-2">Name</span><span>Class</span><span className="text-right">Actions</span>
            </div>
            <div className="divide-y divide-border">
              {students.map((s) => (
                <div key={s.id} data-testid={`student-row-${s.id}`} className="grid grid-cols-5 items-center px-5 py-3 hover:bg-secondary/30 transition-colors">
                  <span className="text-sm font-mono text-primary">{s.studentId}</span>
                  <span className="col-span-2 text-sm font-medium">{s.firstName} {s.lastName}</span>
                  <span className="text-sm text-muted-foreground">{s.className ?? "—"}</span>
                  <div className="flex justify-end gap-1">
                    <Button data-testid={`button-edit-student-${s.id}`} size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(s)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button data-testid={`button-delete-student-${s.id}`} size="icon" variant="ghost" className="h-7 w-7 text-destructive-foreground hover:bg-destructive/20" onClick={() => handleDelete(s.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? "Edit Student" : "Add Student"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Student ID</Label>
              <Input data-testid="input-student-id" value={form.studentId} onChange={e => setForm(f => ({ ...f, studentId: e.target.value }))} placeholder="e.g. 2024-00001" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>First Name</Label>
                <Input data-testid="input-first-name" value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} placeholder="Juan" />
              </div>
              <div className="space-y-1.5">
                <Label>Last Name</Label>
                <Input data-testid="input-last-name" value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} placeholder="Dela Cruz" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Class (optional)</Label>
              <Select value={form.classId} onValueChange={v => setForm(f => ({ ...f, classId: v === "none" ? "" : v }))}>
                <SelectTrigger data-testid="select-student-class"><SelectValue placeholder="Assign to class..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No class</SelectItem>
                  {classes?.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name} {c.section ?? ""}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button data-testid="button-save-student" onClick={handleSave} disabled={!form.studentId || !form.firstName || !form.lastName || createStudent.isPending || updateStudent.isPending}>
              {editId ? "Save Changes" : "Add Student"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
