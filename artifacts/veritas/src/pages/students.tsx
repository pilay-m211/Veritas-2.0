import { useState, useRef, useEffect } from "react";
import { useListStudents, useCreateStudent, useUpdateStudent, useDeleteStudent, useListClasses, useImportStudents, getListStudentsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Users, Plus, Pencil, Trash2, Search, FileUp, CheckCircle2, AlertCircle, Download } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

declare global { interface Window { XLSX: any; } }

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement("script");
    s.src = src; s.onload = () => resolve(); s.onerror = reject;
    document.head.appendChild(s);
  });
}

type StudentForm = { studentId: string; firstName: string; lastName: string; classId: string };
type ImportRow = { studentId: string; firstName: string; lastName: string; valid: boolean; error?: string };
const empty: StudentForm = { studentId: "", firstName: "", lastName: "", classId: "" };

const TEMPLATE_HEADERS = ["Student ID", "First Name", "Last Name"];

export default function Students() {
  const [search, setSearch] = useState("");
  const { data: students, isLoading } = useListStudents({ search: search || undefined });
  const { data: classes } = useListClasses();
  const createStudent = useCreateStudent();
  const updateStudent = useUpdateStudent();
  const deleteStudent = useDeleteStudent();
  const importStudents = useImportStudents();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Single add/edit state
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<StudentForm>(empty);

  // Import state
  const [importOpen, setImportOpen] = useState(false);
  const [importRows, setImportRows] = useState<ImportRow[]>([]);
  const [importClassId, setImportClassId] = useState("");
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; errors: number } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const importFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadScript("https://cdn.jsdelivr.net/npm/xlsx@0.18.1/dist/xlsx.full.min.js").catch(() => {});
  }, []);

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

  // ── Import helpers ──────────────────────────────────────────────────────────

  function validateRow(raw: Record<string, string>): ImportRow {
    const studentId = (raw["Student ID"] ?? raw["student_id"] ?? raw["studentid"] ?? "").toString().trim();
    const firstName = (raw["First Name"] ?? raw["first_name"] ?? raw["firstname"] ?? "").toString().trim();
    const lastName  = (raw["Last Name"]  ?? raw["last_name"]  ?? raw["lastname"]  ?? "").toString().trim();
    const errors: string[] = [];
    if (!studentId) errors.push("Student ID required");
    if (!firstName) errors.push("First name required");
    if (!lastName)  errors.push("Last name required");
    if (studentId && !/^\d{4}-\d{5}$/.test(studentId)) errors.push("ID format: YYYY-NNNNN");
    return { studentId, firstName, lastName, valid: errors.length === 0, error: errors.join("; ") };
  }

  function parseFile(file: File) {
    if (!window.XLSX) { toast({ title: "Spreadsheet library not loaded yet, try again", variant: "destructive" }); return; }
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const wb = window.XLSX.read(e.target!.result, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: Record<string, string>[] = window.XLSX.utils.sheet_to_json(ws, { defval: "" });
        if (!rows.length) { toast({ title: "Spreadsheet is empty", variant: "destructive" }); return; }
        setImportRows(rows.map(validateRow));
        setImportResult(null);
      } catch {
        toast({ title: "Could not read file — must be .xlsx or .csv", variant: "destructive" });
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function downloadTemplate() {
    if (!window.XLSX) { toast({ title: "Library not loaded yet", variant: "destructive" }); return; }
    const ws = window.XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS, ["2024-00001", "Maria", "Santos"], ["2024-00002", "Juan", "Dela Cruz"]]);
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, "Students");
    window.XLSX.writeFile(wb, "veritas-student-template.xlsx");
  }

  function openImport() {
    setImportRows([]); setImportClassId(""); setImportResult(null); setImportOpen(true);
  }

  function handleImport() {
    const valid = importRows.filter(r => r.valid);
    if (!valid.length) { toast({ title: "No valid rows to import", variant: "destructive" }); return; }
    importStudents.mutate({
      data: {
        students: valid.map(r => ({ studentId: r.studentId, firstName: r.firstName, lastName: r.lastName, classId: importClassId ? Number(importClassId) : null })),
        skipDuplicates: true,
      }
    }, {
      onSuccess: (res) => {
        setImportResult(res);
        invalidate();
        toast({ title: `Imported ${res.imported} student(s)` + (res.skipped ? `, ${res.skipped} skipped` : "") });
      },
      onError: () => toast({ title: "Import failed", variant: "destructive" }),
    });
  }

  const validCount = importRows.filter(r => r.valid).length;
  const invalidCount = importRows.filter(r => !r.valid).length;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Students</h1>
          <p className="text-sm text-muted-foreground mt-1 font-mono">Student roster and grade records</p>
        </div>
        <div className="flex gap-2">
          <Button data-testid="button-import-students" onClick={openImport} variant="outline" className="gap-2">
            <FileUp className="h-4 w-4" /> Import Excel
          </Button>
          <Button data-testid="button-add-student" onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" /> Add Student
          </Button>
        </div>
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
            {!search && (
              <div className="flex justify-center gap-3 mt-4">
                <Button data-testid="button-import-students-empty" onClick={openImport} variant="outline" className="gap-2"><FileUp className="h-4 w-4" /> Import Excel</Button>
                <Button data-testid="button-add-student-empty" onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> Add Student</Button>
              </div>
            )}
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

      {/* ── Single Add/Edit Dialog ── */}
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

      {/* ── Import Dialog ── */}
      <Dialog open={importOpen} onOpenChange={v => { if (!importStudents.isPending) setImportOpen(v); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><FileUp className="h-4 w-4 text-primary" /> Import Students from Excel</DialogTitle>
            <DialogDescription>
              Upload an .xlsx or .csv file. Rows with duplicate Student IDs will be skipped.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Template download */}
            <div className="flex items-center justify-between rounded-md border border-border bg-secondary/30 px-4 py-3">
              <div>
                <p className="text-sm font-medium">Need a template?</p>
                <p className="text-xs text-muted-foreground mt-0.5">Download the sample Excel file with the correct column headers</p>
              </div>
              <Button data-testid="button-download-template" size="sm" variant="outline" onClick={downloadTemplate} className="gap-2 flex-shrink-0">
                <Download className="h-3.5 w-3.5" /> Template
              </Button>
            </div>

            {/* Dropzone */}
            {!importResult && (
              <div
                data-testid="import-dropzone"
                className={cn(
                  "rounded-md border-2 border-dashed py-10 flex flex-col items-center gap-2 cursor-pointer transition-colors",
                  isDragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-secondary/20"
                )}
                onClick={() => importFileRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={e => { e.preventDefault(); setIsDragOver(false); const f = e.dataTransfer.files[0]; if (f) parseFile(f); }}
              >
                <input ref={importFileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" data-testid="input-import-file"
                  onChange={e => { if (e.target.files?.[0]) { parseFile(e.target.files[0]); e.target.value = ""; } }} />
                <FileUp className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm font-medium text-foreground">{importRows.length ? "Drop a new file to replace" : "Drop your Excel file here"}</p>
                <p className="text-xs text-muted-foreground">or click to browse — .xlsx, .xls, .csv accepted</p>
              </div>
            )}

            {/* Preview table */}
            {importRows.length > 0 && !importResult && (
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className="text-primary flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" />{validCount} valid</span>
                  {invalidCount > 0 && <span className="text-destructive-foreground flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5" />{invalidCount} with errors</span>}
                </div>
                <div className="rounded-md border border-border overflow-hidden max-h-56 overflow-y-auto">
                  <div className="grid grid-cols-4 px-3 py-1.5 bg-secondary/60 text-xs font-mono text-muted-foreground uppercase tracking-wider sticky top-0">
                    <span>Status</span><span>Student ID</span><span>First Name</span><span>Last Name</span>
                  </div>
                  {importRows.map((row, i) => (
                    <div key={i} data-testid={`import-preview-row-${i}`} className={cn("grid grid-cols-4 px-3 py-2 text-xs border-t border-border/50", row.valid ? "" : "bg-destructive/10")}>
                      <span>
                        {row.valid
                          ? <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                          : <span title={row.error}><AlertCircle className="h-3.5 w-3.5 text-destructive-foreground" /></span>}
                      </span>
                      <span className="font-mono truncate">{row.studentId || <span className="text-muted-foreground/50">—</span>}</span>
                      <span className="truncate">{row.firstName || <span className="text-muted-foreground/50">—</span>}</span>
                      <span className="truncate">{row.lastName || <span className="text-muted-foreground/50">—</span>}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Class assignment */}
            {importRows.length > 0 && !importResult && (
              <div className="space-y-1.5">
                <Label>Assign all to class (optional)</Label>
                <Select value={importClassId} onValueChange={v => setImportClassId(v === "none" ? "" : v)}>
                  <SelectTrigger data-testid="select-import-class"><SelectValue placeholder="No class assignment" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No class</SelectItem>
                    {classes?.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name} {c.section ?? ""}</SelectItem>)}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Individual rows' class data is overridden by this selection if set.</p>
              </div>
            )}

            {/* Result */}
            {importResult && (
              <div className="rounded-md border border-primary/30 bg-primary/5 px-5 py-4 space-y-2">
                <div className="flex items-center gap-2 text-primary font-semibold"><CheckCircle2 className="h-5 w-5" /> Import Complete</div>
                <div className="grid grid-cols-3 gap-3 mt-2">
                  {[
                    { label: "Imported", value: importResult.imported, color: "text-primary" },
                    { label: "Skipped", value: importResult.skipped, color: "text-muted-foreground" },
                    { label: "Errors", value: importResult.errors, color: importResult.errors > 0 ? "text-destructive-foreground" : "text-muted-foreground" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="text-center">
                      <p className={`text-2xl font-bold ${color}`}>{value}</p>
                      <p className="text-xs text-muted-foreground">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            {importResult ? (
              <Button data-testid="button-close-import" onClick={() => setImportOpen(false)}>Done</Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setImportOpen(false)} disabled={importStudents.isPending}>Cancel</Button>
                <Button
                  data-testid="button-confirm-import"
                  onClick={handleImport}
                  disabled={validCount === 0 || importStudents.isPending}
                  className="gap-2"
                >
                  {importStudents.isPending ? "Importing..." : `Import ${validCount} Student${validCount !== 1 ? "s" : ""}`}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
