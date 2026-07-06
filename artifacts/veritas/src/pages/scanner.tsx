import { useState, useRef, useEffect, useCallback } from "react";
import { useListExams, useListDrafts, useBulkUpsertGrades, useCreateDraft, useDeleteDraft, getListDraftsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ScanLine, Upload, RefreshCw, Save, Trash2, FileSpreadsheet, FileUp, CloudUpload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// Parse a line like "2024-00001 95" or "2024-00001 48/50"
function parseLine(line: string): { sid: string; score: number } | null {
  const trimmed = line.trim();
  const match = trimmed.match(/^(\d{4}-\d{5})\s+(\d+(?:\.\d+)?(?:\/\d+)?)$/);
  if (!match) return null;
  const sidPart = match[1];
  const scorePart = match[2];
  if (scorePart.includes("/")) {
    const [num, den] = scorePart.split("/").map(Number);
    if (!den) return null;
    return { sid: sidPart, score: Math.round((num / den) * 100 * 10) / 10 };
  }
  const score = parseFloat(scorePart);
  if (isNaN(score)) return null;
  return { sid: sidPart, score };
}

function parseAllRecords(text: string) {
  return text.split(/\r?\n/).map(parseLine).filter(Boolean) as { sid: string; score: number }[];
}

declare global {
  interface Window {
    Tesseract: any;
    XLSX: any;
  }
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => resolve();
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

export default function Scanner() {
  const { data: exams } = useListExams();
  const { data: drafts, isLoading: draftsLoading } = useListDrafts();
  const bulkUpsert = useBulkUpsertGrades();
  const createDraft = useCreateDraft();
  const deleteDraft = useDeleteDraft();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState("");
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [examId, setExamId] = useState("");
  const [draftName, setDraftName] = useState("");
  const [draftOpen, setDraftOpen] = useState(false);
  const [updateXlsxOpen, setUpdateXlsxOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const xlsxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadScript("https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js").catch(() => {});
    loadScript("https://cdn.jsdelivr.net/npm/xlsx@0.18.1/dist/xlsx.full.min.js").catch(() => {});
  }, []);

  const records = parseAllRecords(extractedText);

  function preprocessImage(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;
        const scale = Math.min(2, 1800 / Math.max(img.width, img.height));
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < data.data.length; i += 4) {
          const gray = data.data[i] * 0.299 + data.data[i + 1] * 0.587 + data.data[i + 2] * 0.114;
          const adj = Math.max(0, Math.min(255, (gray - 128) * 1.3 + 128));
          data.data[i] = adj; data.data[i + 1] = adj; data.data[i + 2] = adj;
        }
        ctx.putImageData(data, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) { toast({ title: "Please upload a valid image", variant: "destructive" }); return; }
    const reader = new FileReader();
    reader.onload = e => { setImageUrl(e.target!.result as string); toast({ title: "Image loaded" }); };
    reader.readAsDataURL(file);
  }

  async function runOCR() {
    if (!imageUrl) return;
    if (!window.Tesseract) { toast({ title: "OCR engine not loaded yet, try again", variant: "destructive" }); return; }
    setIsExtracting(true); setProgress(0); setProgressMsg("Starting OCR engine...");
    try {
      const processed = await preprocessImage(imageUrl);
      const result = await window.Tesseract.recognize(processed, "eng", {
        logger: (m: any) => {
          if (m.status === "recognizing text") { setProgress(Math.round(m.progress * 100)); setProgressMsg("Recognizing text..."); }
          else setProgressMsg(`${m.status.charAt(0).toUpperCase()}${m.status.slice(1)}...`);
        },
      });
      setExtractedText(result.data.text.trim());
      setProgress(100); setProgressMsg("Complete");
      toast({ title: "Text extraction complete!" });
    } catch {
      toast({ title: "OCR failed. Try a clearer image.", variant: "destructive" });
    } finally {
      setIsExtracting(false);
    }
  }

  function clearAll() {
    setImageUrl(null); setExtractedText(""); setProgress(0); setProgressMsg(""); setIsExtracting(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  // Export: Create new Excel
  function exportNewExcel() {
    if (!records.length) { toast({ title: "No records to export", variant: "destructive" }); return; }
    if (!window.XLSX) { toast({ title: "XLSX library not loaded", variant: "destructive" }); return; }
    const rows = [["Student ID", "Score"], ...records.map(r => [r.sid, r.score])];
    const ws = window.XLSX.utils.aoa_to_sheet(rows);
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, "Veritas Grades");
    window.XLSX.writeFile(wb, `veritas-grades-${Date.now()}.xlsx`);
    toast({ title: `Exported ${records.length} records to Excel` });
  }

  // Export: Update existing Excel
  async function handleUpdateExcel(file: File) {
    if (!window.XLSX) { toast({ title: "XLSX library not loaded", variant: "destructive" }); return; }
    const buffer = await file.arrayBuffer();
    const wb = window.XLSX.read(buffer, { type: "array" });
    const wsName = wb.SheetNames[0];
    const ws = wb.Sheets[wsName];
    const existing: any[][] = window.XLSX.utils.sheet_to_aoa(ws);
    const newRows = records.map(r => [r.sid, r.score]);
    // Find existing SID rows and update, otherwise append
    const sidCol = 0, scoreCol = 1;
    for (const nr of newRows) {
      const idx = existing.findIndex((row, i) => i > 0 && row[sidCol] === nr[0]);
      if (idx !== -1) existing[idx][scoreCol] = nr[1];
      else existing.push(nr);
    }
    const newWs = window.XLSX.utils.aoa_to_sheet(existing);
    wb.Sheets[wsName] = newWs;
    window.XLSX.writeFile(wb, `veritas-updated-${Date.now()}.xlsx`);
    toast({ title: `Updated Excel with ${records.length} records` });
    setUpdateXlsxOpen(false);
  }

  // Save draft
  function saveDraft() {
    if (!extractedText.trim()) { toast({ title: "Nothing to save", variant: "destructive" }); return; }
    createDraft.mutate({ data: { name: draftName || `Draft ${new Date().toLocaleDateString()}`, rawText: extractedText, recordCount: records.length } }, {
      onSuccess: () => { toast({ title: "Draft saved" }); queryClient.invalidateQueries({ queryKey: getListDraftsQueryKey() }); setDraftOpen(false); setDraftName(""); },
      onError: () => toast({ title: "Error saving draft", variant: "destructive" }),
    });
  }

  // Sync to DB
  function syncToDB() {
    if (!examId) { toast({ title: "Select an exam first", variant: "destructive" }); return; }
    if (!records.length) { toast({ title: "No parseable records found", variant: "destructive" }); return; }
    bulkUpsert.mutate({ data: { examId: Number(examId), records: records.map(r => ({ studentSchoolId: r.sid, score: r.score })) } }, {
      onSuccess: (res) => {
        toast({ title: `Synced ${res.updated} grade(s)${res.notFound ? `, ${res.notFound} ID(s) not found` : ""}` });
      },
      onError: () => toast({ title: "Sync failed", variant: "destructive" }),
    });
  }

  function loadDraft(d: any) {
    setExtractedText(d.rawText);
    toast({ title: `Loaded draft: ${d.name}` });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Answer Scanner</h1>
          <p className="text-sm text-muted-foreground mt-1 font-mono">OCR extraction — scan graded papers and sync scores</p>
        </div>
        <Button data-testid="button-clear-all" variant="outline" onClick={clearAll} className="gap-2"><Trash2 className="h-4 w-4" /> Clear</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Image dropzone */}
        <div className="rounded-lg border border-border bg-card overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <ScanLine className="h-4 w-4 text-primary" />
            <h2 className="font-semibold text-sm tracking-wide">Source Document</h2>
            <span className="ml-auto text-xs text-muted-foreground font-mono">PNG · JPG · WEBP</span>
          </div>
          <div className="flex-1 p-4 flex flex-col gap-3">
            <div
              data-testid="dropzone"
              className={cn("flex-1 rounded-md border-2 border-dashed min-h-72 flex flex-col items-center justify-center cursor-pointer transition-all relative overflow-hidden", isDragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-secondary/20")}
              onClick={() => fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={e => { e.preventDefault(); setIsDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            >
              <input ref={fileRef} type="file" accept="image/*" className="hidden" data-testid="input-file" onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
              {imageUrl ? (
                <img src={imageUrl} alt="Preview" className="absolute inset-0 w-full h-full object-contain bg-black" />
              ) : (
                <div className="text-center text-muted-foreground pointer-events-none">
                  <CloudUpload className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p className="font-medium text-foreground">Drop image here</p>
                  <p className="text-sm mt-1">or click to browse</p>
                  <p className="text-xs mt-2 opacity-60">Also supports paste (Ctrl+V)</p>
                </div>
              )}
            </div>
            <Button data-testid="button-extract" onClick={runOCR} disabled={!imageUrl || isExtracting} className="gap-2 w-full">
              {isExtracting ? <><RefreshCw className="h-4 w-4 animate-spin" /> Extracting...</> : <><ScanLine className="h-4 w-4" /> Extract Text</>}
            </Button>
            {(isExtracting || progress > 0) && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground font-mono">
                  <span>{progressMsg}</span><span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-1.5" />
              </div>
            )}
          </div>
        </div>

        {/* Right: Extracted text */}
        <div className="rounded-lg border border-border bg-card overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-primary" />
            <h2 className="font-semibold text-sm tracking-wide">Extracted Text</h2>
          </div>
          <div className="flex-1 p-4 flex flex-col gap-3">
            <Textarea
              data-testid="textarea-extracted"
              className="flex-1 min-h-52 font-mono text-sm resize-none bg-secondary/20"
              placeholder="Your extracted text will appear here. You can edit it directly.&#10;&#10;Expected format:&#10;2024-00001 95&#10;2024-00001 48/50"
              value={extractedText}
              onChange={e => setExtractedText(e.target.value)}
            />
            <p className="text-xs text-muted-foreground font-mono">
              {records.length > 0 ? <span className="text-primary">{records.length} parseable record(s) found</span> : "No records parsed yet — format: 2024-00001 95"}
            </p>
          </div>
        </div>
      </div>

      {/* Parsed Records Table */}
      {records.length > 0 && (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-primary" />
            <h2 className="font-semibold text-sm tracking-wide">Parsed Records</h2>
            <span className="ml-auto text-xs font-mono text-primary">{records.length} records</span>
          </div>
          <div className="max-h-60 overflow-y-auto">
            <div className="grid grid-cols-2 px-5 py-2 bg-secondary/50 text-xs font-mono text-muted-foreground uppercase tracking-wider sticky top-0">
              <span>Student ID</span><span>Score</span>
            </div>
            {records.map((r, i) => (
              <div key={i} data-testid={`parsed-row-${i}`} className="grid grid-cols-2 px-5 py-2 border-t border-border/50 text-sm">
                <span className="font-mono text-primary">{r.sid}</span>
                <span className={r.score >= 75 ? "text-green-400 font-mono" : "text-red-400 font-mono"}>{r.score}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="rounded-lg border border-border bg-card p-5">
        <h2 className="font-semibold text-sm tracking-wide mb-4">Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Sync to DB */}
          <div className="space-y-2">
            <Select value={examId} onValueChange={setExamId}>
              <SelectTrigger data-testid="select-exam-sync" className="text-xs"><SelectValue placeholder="Select exam..." /></SelectTrigger>
              <SelectContent>{exams?.map(e => <SelectItem key={e.id} value={e.id.toString()}>{e.title}</SelectItem>)}</SelectContent>
            </Select>
            <Button data-testid="button-sync-db" onClick={syncToDB} disabled={!records.length || !examId || bulkUpsert.isPending} className="w-full gap-2" variant="outline">
              <Upload className="h-4 w-4" /> Sync to DB
            </Button>
          </div>

          {/* New Excel */}
          <Button data-testid="button-export-excel" onClick={exportNewExcel} disabled={!records.length} className="gap-2 h-auto py-3" variant="outline">
            <FileSpreadsheet className="h-4 w-4" />
            <div className="text-left"><div className="text-xs font-semibold">New Excel</div><div className="text-xs text-muted-foreground">Download fresh file</div></div>
          </Button>

          {/* Update Excel */}
          <Button data-testid="button-update-excel" onClick={() => setUpdateXlsxOpen(true)} disabled={!records.length} className="gap-2 h-auto py-3" variant="outline">
            <FileUp className="h-4 w-4" />
            <div className="text-left"><div className="text-xs font-semibold">Update Excel</div><div className="text-xs text-muted-foreground">Merge into existing file</div></div>
          </Button>

          {/* Save Draft */}
          <Button data-testid="button-save-draft" onClick={() => setDraftOpen(true)} disabled={!extractedText.trim()} className="gap-2 h-auto py-3" variant="outline">
            <Save className="h-4 w-4" />
            <div className="text-left"><div className="text-xs font-semibold">Save Draft</div><div className="text-xs text-muted-foreground">Keep for later</div></div>
          </Button>
        </div>
      </div>

      {/* Saved Drafts */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <Save className="h-4 w-4 text-primary" />
          <h2 className="font-semibold text-sm tracking-wide">Saved Drafts</h2>
          <span className="ml-auto text-xs font-mono text-muted-foreground">{drafts?.length ?? 0}</span>
        </div>
        {draftsLoading ? (
          <div className="p-4 space-y-2">{[...Array(2)].map((_, i) => <Skeleton key={i} className="h-12 rounded" />)}</div>
        ) : !drafts?.length ? (
          <div className="py-10 text-center text-muted-foreground text-sm">No saved drafts</div>
        ) : (
          <div className="divide-y divide-border">
            {drafts.map(d => (
              <div key={d.id} data-testid={`draft-row-${d.id}`} className="px-5 py-3 flex items-center justify-between hover:bg-secondary/30 transition-colors">
                <div>
                  <p className="text-sm font-medium">{d.name}</p>
                  <p className="text-xs font-mono text-muted-foreground">{d.recordCount} records · {new Date(d.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2">
                  <Button data-testid={`button-load-draft-${d.id}`} size="sm" variant="outline" className="text-xs" onClick={() => loadDraft(d)}>Load</Button>
                  <Button data-testid={`button-delete-draft-${d.id}`} size="icon" variant="ghost" className="h-8 w-8 text-destructive-foreground hover:bg-destructive/20" onClick={() => deleteDraft.mutate({ id: d.id }, { onSuccess: () => { toast({ title: "Draft deleted" }); queryClient.invalidateQueries({ queryKey: getListDraftsQueryKey() }); } })}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Save Draft Dialog */}
      <Dialog open={draftOpen} onOpenChange={setDraftOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Save Draft</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <Label>Draft Name</Label>
            <Input data-testid="input-draft-name" value={draftName} onChange={e => setDraftName(e.target.value)} placeholder={`Draft ${new Date().toLocaleDateString()}`} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDraftOpen(false)}>Cancel</Button>
            <Button data-testid="button-confirm-save-draft" onClick={saveDraft} disabled={createDraft.isPending}>Save Draft</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Excel Dialog */}
      <Dialog open={updateXlsxOpen} onOpenChange={setUpdateXlsxOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Update Existing Excel</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">Upload an existing .xlsx file. Records with matching Student IDs will be updated; new IDs will be appended.</p>
            <input ref={xlsxRef} type="file" accept=".xlsx,.xls" data-testid="input-xlsx-file" className="block w-full text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-secondary file:text-foreground file:text-sm cursor-pointer" onChange={e => { if (e.target.files?.[0]) handleUpdateExcel(e.target.files[0]); }} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpdateXlsxOpen(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
