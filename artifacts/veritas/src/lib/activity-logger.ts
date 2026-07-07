import { collection, addDoc, query, orderBy, limit, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type ActivityType =
  | "ocr_scan"
  | "grade_sync"
  | "excel_export_new"
  | "excel_export_merge"
  | "draft_save"
  | "draft_load"
  | "draft_delete"
  | "student_import"
  | "class_create"
  | "exam_create";

export type AuthEventType = "login" | "logout";

export interface ActivityEntry {
  id: string;
  type: ActivityType;
  details: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

export interface AuthEvent {
  id: string;
  type: AuthEventType;
  userAgent: string;
  timestamp: Date;
}

// ── Write an auth event (login / logout) ─────────────────────────────────────
export async function logAuthEvent(uid: string, type: AuthEventType): Promise<void> {
  try {
    await addDoc(collection(db, "users", uid, "auth_log"), {
      type,
      userAgent: navigator.userAgent,
      timestamp: serverTimestamp(),
    });
  } catch {
    // Firestore may be unavailable — fail silently
  }
}

// ── Write an activity entry ───────────────────────────────────────────────────
export async function logActivity(
  uid: string,
  type: ActivityType,
  details: string,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  try {
    await addDoc(collection(db, "users", uid, "activity_log"), {
      type,
      details,
      metadata,
      timestamp: serverTimestamp(),
    });
  } catch {
    // Firestore may be unavailable — fail silently
  }
}

// ── Read recent activity entries ──────────────────────────────────────────────
export async function fetchActivityLog(uid: string, count = 30): Promise<ActivityEntry[]> {
  try {
    const q = query(
      collection(db, "users", uid, "activity_log"),
      orderBy("timestamp", "desc"),
      limit(count)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({
      id: d.id,
      ...d.data(),
      timestamp: d.data().timestamp?.toDate?.() ?? new Date(),
    })) as ActivityEntry[];
  } catch {
    return [];
  }
}

// ── Read recent auth events ───────────────────────────────────────────────────
export async function fetchAuthLog(uid: string, count = 20): Promise<AuthEvent[]> {
  try {
    const q = query(
      collection(db, "users", uid, "auth_log"),
      orderBy("timestamp", "desc"),
      limit(count)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({
      id: d.id,
      ...d.data(),
      timestamp: d.data().timestamp?.toDate?.() ?? new Date(),
    })) as AuthEvent[];
  } catch {
    return [];
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
export const ACTIVITY_LABELS: Record<ActivityType, string> = {
  ocr_scan:           "OCR Scan Completed",
  grade_sync:         "Grades Synced to Database",
  excel_export_new:   "New Excel File Downloaded",
  excel_export_merge: "Excel File Updated & Merged",
  draft_save:         "Draft Saved",
  draft_load:         "Draft Loaded",
  draft_delete:       "Draft Deleted",
  student_import:     "Students Imported from Excel",
  class_create:       "Class Created",
  exam_create:        "Exam Created",
};

export const ACTIVITY_COLORS: Record<ActivityType, string> = {
  ocr_scan:           "#2dd4bf",
  grade_sync:         "#818cf8",
  excel_export_new:   "#34d399",
  excel_export_merge: "#22d3ee",
  draft_save:         "#f59e0b",
  draft_load:         "#f59e0b",
  draft_delete:       "#f87171",
  student_import:     "#a78bfa",
  class_create:       "#2dd4bf",
  exam_create:        "#818cf8",
};
