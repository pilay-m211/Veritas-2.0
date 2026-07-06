import { useState, useRef, useEffect } from "react";
import {
  useListExams, useListDrafts, useBulkUpsertGrades,
  useCreateDraft, useDeleteDraft, getListDraftsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ScanLine, RefreshCw, Save, Trash2, FileSpreadsheet,
  FileUp, CloudUpload, Upload, CheckCircle2, XCircle,
  Eye, FileText, ChevronDown, RotateCcw, ZoomIn, ZoomOut,
  Download, FilePlus,
} from "lucide-react";
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

// ─── Types ──────────────────────────────────────────────────────────────────

type ParsedRecord = { sid: string; score: number; raw: string };
type RightTab = "records" | "text";

declare global { interface Window { Tesseract: any; XLSX: any; } }

// ─── Helpers ─────────────────────────────────────────────────────────────────

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement("script");
    s.src = src; s.onload = () => resolve(); s.onerror = reject;
    document.head.appendChild(s);
  });
}

function parseLine(line: string): ParsedRecord | null {
  const trimmed = line.trim();
  const m = trimmed.match(/^(\d{4}-\d{5})\s+(\d+(?:\.\d+)?(?:\/\d+)?)$/);
  if (!m) return null;
  const sid = m[1];
  const raw = m[2];
  if (raw.includes("/")) {
    const [n, d] = raw.split("/").map(Number);
    if (!d) return null;
    return { sid, score: Math.round((n / d) * 100 * 10) / 10, raw };
  }
  const score = parseFloat(raw);
  return isNaN(score) ? null : { sid, score, raw };
}

function parseAllRecords(text: string): ParsedRecord[] {
  return text.split(/\r?\n/).map(parseLine).filter(Boolean) as ParsedRecord[];
}

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
      const d = ctx.getImageData(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < d.data.length; i += 4) {
        const g = d.data[i] * 0.299 + d.data[i + 1] * 0.587 + d.data[i + 2] * 0.114;
        const a = Math.max(0, Math.min(255, (g - 128) * 1.35 + 128));
        d.data[i] = a; d.data[i + 1] = a; d.data[i + 2] = a;
      }
      ctx.putImageData(d, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = reject;
    img.src = url;
  });
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function Scanner() {
  const { data: exams } = useListExams();
  const { data: drafts, isLoading: draftsLoading } = useListDrafts();
  const bulkUpsert = useBulkUpsertGrades();
  const createDraft = useCreateDraft();
  const deleteDraft = useDeleteDraft();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Image & OCR
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState("");
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [zoom, setZoom] = useState(1);

  // Right panel
  const [rightTab, setRightTab] = useState<RightTab>("records");
  // Editable records (allow inline correction)
  const [editableRecords, setEditableRecords] = useState<ParsedRecord[]>([]);
  const [recordsFromOCR, setRecordsFromOCR] = useState(false);

  // Actions
  const [examId, setExamId] = useState("");
  const [draftName, setDraftName] = useState("");
  const [draftOpen, setDraftOpen] = useState(false);
  const [updateXlsxOpen, setUpdateXlsxOpen] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const xlsxUpdateRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadScript("https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js").catch(() => {});
    loadScript("https://cdn.jsdelivr.net/npm/xlsx@0.18.1/dist/xlsx.full.min.js").catch(() => {});
  }, []);

  // Sync editable records when text changes manually
  useEffect(() => {
    if (!recordsFromOCR) {
      setEditableRecords(parseAllRecords(extractedText));
    }
  }, [extractedText, recordsFromOCR]);

  const records = editableRecords;
  const passing = records.filter(r => r.score >= 75).length;
  const avg = records.length ? (records.reduce((s, r) => s + r.score, 0) / records.length).toFixed(1) : null;

  // ── File handling ──
  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Please upload a valid image file", variant: "destructive" }); return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      setImageUrl(e.target!.result as string);
      setExtractedText(""); setEditableRecords([]); setRecordsFromOCR(false);
      setProgress(0); setProgressMsg(""); setZoom(1);
    };
    reader.readAsDataURL(file);
  }

  // ── OCR ──
  async function runOCR() {
    if (!imageUrl || !window.Tesseract) {
      toast({ title: "OCR engine not ready yet, try again shortly", variant: "destructive" }); return;
    }
    setIsExtracting(true); setProgress(0); setProgressMsg("Starting OCR engine...");
    setRecordsFromOCR(true);
    try {
      const processed = await preprocessImage(imageUrl);
      const result = await window.Tesseract.recognize(processed, "eng", {
        logger: (m: any) => {
          if (m.status === "recognizing text") {
            setProgress(Math.round(m.progress * 100)); setProgressMsg("Recognizing text...");
          } else {
            setProgressMsg(`${m.status.charAt(0).toUpperCase()}${m.status.slice(1)}...`);
          }
        },
      });
      const text = result.data.text.trim();
      setExtractedText(text);
      const parsed = parseAllRecords(text);
      setEditableRecords(parsed);
      setProgress(100); setProgressMsg("Complete");
      setRightTab(parsed.length > 0 ? "records" : "text");
      toast({ title: parsed.length > 0 ? `Found ${parsed.length} record(s)` : "Extraction complete — check raw text" });
    } catch {
      toast({ title: "OCR failed — try a clearer, well-lit image", variant: "destructive" });
    } finally {
      setIsExtracting(false); setRecordsFromOCR(false);
    }
  }

  function clearAll() {
    setImageUrl(null); setExtractedText(""); setEditableRecords([]);
    setProgress(0); setProgressMsg(""); setZoom(1);
    if (fileRef.current) fileRef.current.value = "";
  }

  // ── Inline record editing ──
  function updateRecord(i: number, field: "sid" | "score", val: string) {
    setEditableRecords(prev => {
      const next = [...prev];
      if (field === "sid") next[i] = { ...next[i], sid: val };
      else { const n = parseFloat(val); next[i] = { ...next[i], score: isNaN(n) ? next[i].score : n }; }
      return next;
    });
  }
  function removeRecord(i: number) {
    setEditableRecords(prev => prev.filter((_, idx) => idx !== i));
  }
  function addRecord() {
    setEditableRecords(prev => [...prev, { sid: "", score: 0, raw: "" }]);
  }

  // ── Excel ──
  function exportNewExcel() {
    if (!records.length || !window.XLSX) {
      toast({ title: "No records to export", variant: "destructive" }); return;
    }
    const rows = [
      ["Student ID", "Score", "Status"],
      ...records.map(r => [r.sid, r.score, r.score >= 75 ? "PASSED" : "FAILED"]),
    ];
    const ws = window.XLSX.utils.aoa_to_sheet(rows);
    // Style header row
    ws["!cols"] = [{ wch: 14 }, { wch: 8 }, { wch: 10 }];
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, "Veritas Grades");
    window.XLSX.writeFile(wb, `veritas-grades-${Date.now()}.xlsx`);
    toast({ title: `Downloaded ${records.length} records as Excel` });
  }

  async function handleUpdateExcel(file: File) {
    if (!window.XLSX) { toast({ title: "XLSX library not loaded", variant: "destructive" }); return; }
    const buffer = await file.arrayBuffer();
    const wb = window.XLSX.read(buffer, { type: "array" });
    const wsName = wb.SheetNames[0];
    const ws = wb.Sheets[wsName];
    const existing: any[][] = window.XLSX.utils.sheet_to_aoa(ws);
    for (const nr of records) {
      const idx = existing.findIndex((row, i) => i > 0 && row[0]?.toString() === nr.sid);
      if (idx !== -1) existing[idx][1] = nr.score;
      else existing.push([nr.sid, nr.score, nr.score >= 75 ? "PASSED" : "FAILED"]);
    }
    wb.Sheets[wsName] = window.XLSX.utils.aoa_to_sheet(existing);
    window.XLSX.writeFile(wb, `veritas-updated-${Date.now()}.xlsx`);
    toast({ title: `Merged ${records.length} records into existing Excel` });
    setUpdateXlsxOpen(false);
  }

  // ── DB sync ──
  function syncToDB() {
    if (!examId) { toast({ title: "Select an exam first", variant: "destructive" }); return; }
    if (!records.length) { toast({ title: "No records to sync", variant: "destructive" }); return; }
    bulkUpsert.mutate({
      data: { examId: Number(examId), records: records.map(r => ({ studentSchoolId: r.sid, score: r.score })) }
    }, {
      onSuccess: res => toast({ title: `Synced ${res.updated} grade(s)` + (res.notFound ? ` · ${res.notFound} ID(s) not found` : "") }),
      onError: () => toast({ title: "Sync failed", variant: "destructive" }),
    });
  }

  // ── Draft ──
  function saveDraft() {
    if (!extractedText.trim()) { toast({ title: "Nothing to save", variant: "destructive" }); return; }
    createDraft.mutate({
      data: { name: draftName || `Draft ${new Date().toLocaleDateString()}`, rawText: extractedText, recordCount: records.length }
    }, {
      onSuccess: () => {
        toast({ title: "Draft saved" });
        queryClient.invalidateQueries({ queryKey: getListDraftsQueryKey() });
        setDraftOpen(false); setDraftName("");
      },
      onError: () => toast({ title: "Error saving draft", variant: "destructive" }),
    });
  }

  function loadDraft(d: any) {
    setExtractedText(d.rawText);
    setEditableRecords(parseAllRecords(d.rawText));
    setRightTab("records");
    toast({ title: `Loaded: ${d.name}` });
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Answer Scanner</h1>
          <p className="text-sm text-muted-foreground mt-0.5 font-mono">OCR extraction · split-screen verification · Excel integration</p>
        </div>
        <Button data-testid="button-clear-all" variant="outline" onClick={clearAll} className="gap-2" size="sm">
          <RotateCcw className="h-3.5 w-3.5" /> Reset
        </Button>
      </div>

      {/* ── Split-screen workspace ── */}
      <div className="grid grid-cols-2 gap-0 rounded-xl border border-border overflow-hidden bg-card flex-shrink-0" style={{ minHeight: 520 }}>

        {/* LEFT — Image panel */}
        <div className="flex flex-col border-r border-border">
          {/* Panel header */}
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-secondary/40 flex-shrink-0">
            <Eye className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">Source Document</span>
            <span className="ml-auto text-xs font-mono text-muted-foreground/60">PNG · JPG · WEBP</span>
            {imageUrl && (
              <div className="flex items-center gap-1 ml-2 border border-border rounded-md overflow-hidden">
                <button onClick={() => setZoom(z => Math.max(0.3, z - 0.2))} className="px-1.5 py-0.5 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                  <ZoomOut className="h-3 w-3" />
                </button>
                <span className="text-xs font-mono text-muted-foreground px-1">{Math.round(zoom * 100)}%</span>
                <button onClick={() => setZoom(z => Math.min(3, z + 0.2))} className="px-1.5 py-0.5 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                  <ZoomIn className="h-3 w-3" />
                </button>
                <button onClick={() => setZoom(1)} className="px-1.5 py-0.5 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors text-xs">fit</button>
              </div>
            )}
          </div>

          {/* Image zone */}
          <div className="flex-1 relative overflow-hidden">
            <div
              data-testid="dropzone"
              className={cn(
                "absolute inset-0 flex items-center justify-center transition-colors",
                !imageUrl && (isDragOver ? "bg-primary/5" : "cursor-pointer hover:bg-secondary/20")
              )}
              onClick={() => !imageUrl && fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={e => {
                e.preventDefault(); setIsDragOver(false);
                const f = e.dataTransfer.files[0]; if (f) handleFile(f);
              }}
            >
              <input ref={fileRef} type="file" accept="image/*" className="hidden" data-testid="input-file"
                onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />

              {imageUrl ? (
                <div className="absolute inset-0 overflow-auto flex items-start justify-center bg-[#0a0a14]">
                  <img
                    src={imageUrl}
                    alt="Scanned document"
                    style={{ transform: `scale(${zoom})`, transformOrigin: "top center", transition: "transform 0.15s" }}
                    className="max-w-none mt-4"
                    draggable={false}
                  />
                </div>
              ) : (
                <div className="text-center pointer-events-none px-8">
                  <div className={cn("rounded-xl border-2 border-dashed px-10 py-12 transition-colors", isDragOver ? "border-primary" : "border-border/50")}>
                    <CloudUpload className="h-12 w-12 mx-auto mb-4 text-primary/30" />
                    <p className="font-semibold text-foreground">Drop image here</p>
                    <p className="text-sm text-muted-foreground mt-1">or click to browse</p>
                    <p className="text-xs text-muted-foreground/50 mt-3">PNG · JPG · WEBP · BMP</p>
                  </div>
                </div>
              )}

              {/* Replace image button overlay */}
              {imageUrl && (
                <button
                  onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}
                  className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm border border-border text-xs px-2 py-1 rounded-md text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all"
                >
                  Replace
                </button>
              )}
            </div>
          </div>

          {/* Extract button + progress */}
          <div className="flex-shrink-0 px-4 py-3 border-t border-border bg-secondary/20 space-y-2">
            {(isExtracting || progress > 0) && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground font-mono">
                  <span>{progressMsg}</span><span className={progress === 100 ? "text-primary" : ""}>{progress}%</span>
                </div>
                <Progress value={progress} className="h-1" />
              </div>
            )}
            <Button
              data-testid="button-extract"
              onClick={runOCR}
              disabled={!imageUrl || isExtracting}
              className="gap-2 w-full"
            >
              {isExtracting
                ? <><RefreshCw className="h-4 w-4 animate-spin" /> Extracting text...</>
                : <><ScanLine className="h-4 w-4" /> {extractedText ? "Re-extract" : "Extract Text"}</>}
            </Button>
          </div>
        </div>

        {/* RIGHT — Verification panel */}
        <div className="flex flex-col">
          {/* Tab bar */}
          <div className="flex items-center border-b border-border bg-secondary/40 flex-shrink-0">
            <button
              data-testid="tab-records"
              onClick={() => setRightTab("records")}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold tracking-wide uppercase transition-colors border-b-2 -mb-px",
                rightTab === "records" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Parsed Records
              {records.length > 0 && (
                <span className="ml-1 bg-primary/20 text-primary text-[10px] font-mono rounded px-1.5 py-0.5">{records.length}</span>
              )}
            </button>
            <button
              data-testid="tab-text"
              onClick={() => setRightTab("text")}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold tracking-wide uppercase transition-colors border-b-2 -mb-px",
                rightTab === "text" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <FileText className="h-3.5 w-3.5" />
              Raw OCR Text
            </button>

            {/* Stats badges */}
            {records.length > 0 && (
              <div className="ml-auto flex items-center gap-2 px-3 text-xs font-mono">
                <span className="text-green-400">{passing}✓</span>
                <span className="text-red-400">{records.length - passing}✗</span>
                {avg && <span className="text-muted-foreground">avg {avg}%</span>}
              </div>
            )}
          </div>

          {/* Panel content */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {rightTab === "records" ? (
              /* Records table */
              <div className="flex-1 overflow-y-auto">
                {records.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8">
                    <FileSpreadsheet className="h-10 w-10 text-muted-foreground/20 mb-3" />
                    <p className="text-muted-foreground font-medium">No records yet</p>
                    <p className="text-xs text-muted-foreground/60 mt-1 max-w-xs">
                      Extract text from an image, or switch to Raw OCR Text to type/paste records manually.
                    </p>
                    <p className="text-xs font-mono text-muted-foreground/40 mt-3">Format: 2024-00001 95</p>
                  </div>
                ) : (
                  <>
                    {/* Column headers */}
                    <div className="grid grid-cols-[2fr_1fr_80px_36px] gap-0 px-4 py-2 bg-secondary/50 text-xs font-mono text-muted-foreground uppercase tracking-wider border-b border-border sticky top-0">
                      <span>Student ID</span><span>Score</span><span className="text-center">Status</span><span></span>
                    </div>
                    {records.map((r, i) => (
                      <div
                        key={i}
                        data-testid={`parsed-row-${i}`}
                        className={cn(
                          "grid grid-cols-[2fr_1fr_80px_36px] items-center gap-0 px-4 py-1.5 border-b border-border/40 hover:bg-secondary/20 transition-colors group",
                          r.score >= 75 ? "border-l-2 border-l-green-500/30" : "border-l-2 border-l-red-500/30"
                        )}
                      >
                        {/* Editable SID */}
                        <input
                          className="bg-transparent text-xs font-mono text-primary outline-none border border-transparent rounded px-1 py-0.5 w-full focus:border-primary/50 focus:bg-secondary/40 transition-colors"
                          value={r.sid}
                          onChange={e => updateRecord(i, "sid", e.target.value)}
                          data-testid={`record-sid-${i}`}
                        />
                        {/* Editable score */}
                        <input
                          type="number"
                          className={cn(
                            "bg-transparent text-xs font-mono font-bold outline-none border border-transparent rounded px-1 py-0.5 w-20 focus:border-primary/50 focus:bg-secondary/40 transition-colors",
                            r.score >= 75 ? "text-green-400" : "text-red-400"
                          )}
                          value={r.score}
                          onChange={e => updateRecord(i, "score", e.target.value)}
                          data-testid={`record-score-${i}`}
                        />
                        {/* Status badge */}
                        <div className="flex justify-center">
                          {r.score >= 75
                            ? <span className="flex items-center gap-1 text-[10px] font-semibold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full"><CheckCircle2 className="h-2.5 w-2.5" />PASS</span>
                            : <span className="flex items-center gap-1 text-[10px] font-semibold text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full"><XCircle className="h-2.5 w-2.5" />FAIL</span>}
                        </div>
                        {/* Delete row */}
                        <button
                          onClick={() => removeRecord(i)}
                          className="opacity-0 group-hover:opacity-100 flex items-center justify-center h-6 w-6 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive-foreground transition-all"
                          data-testid={`button-remove-record-${i}`}
                        >
                          <XCircle className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                    {/* Add row */}
                    <button
                      onClick={addRecord}
                      className="w-full py-2 text-xs text-muted-foreground hover:text-primary hover:bg-secondary/30 transition-colors flex items-center justify-center gap-1.5"
                      data-testid="button-add-record"
                    >
                      <span className="text-base leading-none">+</span> Add row
                    </button>
                  </>
                )}
              </div>
            ) : (
              /* Raw OCR text */
              <div className="flex-1 p-3 flex flex-col gap-2">
                <Textarea
                  data-testid="textarea-extracted"
                  className="flex-1 min-h-0 h-full font-mono text-xs resize-none bg-secondary/20 leading-relaxed"
                  placeholder={"OCR output appears here after extraction.\nYou can also type or paste records directly.\n\nExpected format per line:\n2024-00001 95\n2024-00002 48/50"}
                  value={extractedText}
                  onChange={e => { setExtractedText(e.target.value); setRecordsFromOCR(false); }}
                />
                <p className="text-xs text-muted-foreground font-mono flex-shrink-0">
                  {records.length > 0
                    ? <span className="text-primary">{records.length} record(s) parsed from this text</span>
                    : "No parseable records yet — format: 2024-00001 95"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Integrated Action Bar ── */}
      <div className="rounded-xl border border-border bg-card overflow-hidden flex-shrink-0">
        <div className="px-5 py-3 border-b border-border bg-secondary/30 flex items-center gap-2">
          <Upload className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">Actions</span>
          {records.length > 0 && (
            <span className="ml-1 text-xs font-mono text-primary">{records.length} records ready</span>
          )}
        </div>

        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">

          {/* ── Sync to DB ── */}
          <div className="rounded-lg border border-border bg-secondary/20 p-3 flex flex-col gap-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <Upload className="h-3.5 w-3.5 text-primary" /> Sync to Database
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">Push grades to selected exam record.</p>
            <Select value={examId} onValueChange={setExamId}>
              <SelectTrigger data-testid="select-exam-sync" className="h-7 text-xs">
                <SelectValue placeholder="Choose exam..." />
              </SelectTrigger>
              <SelectContent>
                {exams?.map(e => <SelectItem key={e.id} value={e.id.toString()}>{e.title}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button
              data-testid="button-sync-db"
              onClick={syncToDB}
              disabled={!records.length || !examId || bulkUpsert.isPending}
              size="sm" className="gap-1.5 w-full"
            >
              {bulkUpsert.isPending ? <><RefreshCw className="h-3.5 w-3.5 animate-spin" />Syncing...</> : <><Upload className="h-3.5 w-3.5" />Sync Grades</>}
            </Button>
          </div>

          {/* ── New Excel ── */}
          <div className="rounded-lg border border-border bg-secondary/20 p-3 flex flex-col gap-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <FilePlus className="h-3.5 w-3.5 text-green-400" /> New Excel File
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">Download a fresh Excel with all {records.length || "parsed"} records. Includes pass/fail column.</p>
            <div className="flex-1" />
            <Button
              data-testid="button-export-excel"
              onClick={exportNewExcel}
              disabled={!records.length}
              size="sm" variant="outline" className="gap-1.5 w-full"
            >
              <Download className="h-3.5 w-3.5" /> Download .xlsx
            </Button>
          </div>

          {/* ── Update Excel ── */}
          <div className="rounded-lg border border-border bg-secondary/20 p-3 flex flex-col gap-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <FileUp className="h-3.5 w-3.5 text-blue-400" /> Update Existing Excel
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">Merge into your gradebook. Matching IDs are updated, new ones appended.</p>
            <div className="flex-1" />
            <label
              data-testid="label-update-excel"
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium cursor-pointer transition-colors w-full",
                records.length ? "hover:border-primary/50 hover:bg-secondary/40 text-foreground" : "opacity-40 pointer-events-none text-muted-foreground"
              )}
            >
              <FileUp className="h-3.5 w-3.5" /> Upload & Merge
              <input
                ref={xlsxUpdateRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                data-testid="input-xlsx-file"
                disabled={!records.length}
                onChange={e => { if (e.target.files?.[0]) { handleUpdateExcel(e.target.files[0]); e.target.value = ""; } }}
              />
            </label>
          </div>

          {/* ── Save Draft ── */}
          <div className="rounded-lg border border-border bg-secondary/20 p-3 flex flex-col gap-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <Save className="h-3.5 w-3.5 text-yellow-400" /> Save Draft
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">Save raw OCR text to continue grading later.</p>
            <Input
              value={draftName}
              onChange={e => setDraftName(e.target.value)}
              placeholder={`Draft ${new Date().toLocaleDateString()}`}
              className="h-7 text-xs"
              data-testid="input-draft-name-inline"
            />
            <Button
              data-testid="button-save-draft"
              onClick={saveDraft}
              disabled={!extractedText.trim() || createDraft.isPending}
              size="sm" variant="outline" className="gap-1.5 w-full"
            >
              <Save className="h-3.5 w-3.5" /> Save Draft
            </Button>
          </div>
        </div>
      </div>

      {/* ── Saved Drafts ── */}
      <div className="rounded-xl border border-border bg-card overflow-hidden flex-shrink-0">
        <div className="px-5 py-2.5 border-b border-border bg-secondary/30 flex items-center gap-2">
          <Save className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">Saved Drafts</span>
          <span className="ml-auto text-xs font-mono text-muted-foreground">{drafts?.length ?? 0}</span>
        </div>
        {draftsLoading ? (
          <div className="p-4 space-y-2">{[...Array(2)].map((_, i) => <Skeleton key={i} className="h-10 rounded" />)}</div>
        ) : !drafts?.length ? (
          <div className="py-6 text-center text-xs text-muted-foreground">No saved drafts — save one above to continue grading later.</div>
        ) : (
          <div className="divide-y divide-border">
            {drafts.map(d => (
              <div key={d.id} data-testid={`draft-row-${d.id}`} className="px-5 py-2.5 flex items-center justify-between hover:bg-secondary/30 transition-colors">
                <div>
                  <p className="text-sm font-medium">{d.name}</p>
                  <p className="text-xs font-mono text-muted-foreground">{d.recordCount} records · {new Date(d.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2">
                  <Button data-testid={`button-load-draft-${d.id}`} size="sm" variant="outline" className="text-xs h-7" onClick={() => loadDraft(d)}>Load</Button>
                  <Button
                    data-testid={`button-delete-draft-${d.id}`}
                    size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive-foreground hover:bg-destructive/20"
                    onClick={() => deleteDraft.mutate({ id: d.id }, {
                      onSuccess: () => { toast({ title: "Draft deleted" }); queryClient.invalidateQueries({ queryKey: getListDraftsQueryKey() }); }
                    })}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
