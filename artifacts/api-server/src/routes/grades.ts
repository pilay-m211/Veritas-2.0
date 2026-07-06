import { Router } from "express";
import { db, gradesTable, studentsTable, examsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { ListGradesQueryParams, UpsertGradeBody, BulkUpsertGradesBody } from "@workspace/api-zod";

const router = Router();

async function enrichGrades(rows: typeof gradesTable.$inferSelect[]) {
  const result = [];
  for (const g of rows) {
    const [student] = await db.select().from(studentsTable).where(eq(studentsTable.id, g.studentId));
    const [exam] = await db.select().from(examsTable).where(eq(examsTable.id, g.examId));
    result.push({
      id: g.id,
      studentId: g.studentId,
      examId: g.examId,
      studentSchoolId: student?.studentId ?? "",
      studentName: student ? `${student.firstName} ${student.lastName}` : "",
      examTitle: exam?.title ?? "",
      score: g.score,
      createdAt: g.createdAt.toISOString(),
    });
  }
  return result;
}

router.get("/grades", async (req, res) => {
  const parsed = ListGradesQueryParams.safeParse(req.query);
  if (!parsed.success) { res.status(400).json({ error: "Invalid query" }); return; }
  const { examId, studentId } = parsed.data;
  const conditions = [];
  if (examId) conditions.push(eq(gradesTable.examId, examId));
  if (studentId) conditions.push(eq(gradesTable.studentId, studentId));
  const rows = await db.select().from(gradesTable).where(conditions.length === 2 ? and(...conditions as [any, any]) : conditions[0]).orderBy(gradesTable.createdAt);
  res.json(await enrichGrades(rows));
});

router.post("/grades", async (req, res) => {
  const parsed = UpsertGradeBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid body" }); return; }
  const existing = await db.select().from(gradesTable).where(and(eq(gradesTable.studentId, parsed.data.studentId), eq(gradesTable.examId, parsed.data.examId)));
  let grade;
  if (existing.length) {
    [grade] = await db.update(gradesTable).set({ score: parsed.data.score }).where(eq(gradesTable.id, existing[0].id)).returning();
  } else {
    [grade] = await db.insert(gradesTable).values(parsed.data).returning();
  }
  const [student] = await db.select().from(studentsTable).where(eq(studentsTable.id, grade.studentId));
  const [exam] = await db.select().from(examsTable).where(eq(examsTable.id, grade.examId));
  res.json({ id: grade.id, studentId: grade.studentId, examId: grade.examId, studentSchoolId: student?.studentId ?? "", studentName: student ? `${student.firstName} ${student.lastName}` : "", examTitle: exam?.title ?? "", score: grade.score, createdAt: grade.createdAt.toISOString() });
});

router.post("/grades/bulk", async (req, res) => {
  const parsed = BulkUpsertGradesBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid body" }); return; }
  const { examId, records } = parsed.data;

  let updated = 0, notFound = 0;
  const notFoundIds: string[] = [];

  for (const rec of records) {
    const [student] = await db.select().from(studentsTable).where(eq(studentsTable.studentId, rec.studentSchoolId));
    if (!student) { notFound++; notFoundIds.push(rec.studentSchoolId); continue; }
    const existing = await db.select().from(gradesTable).where(and(eq(gradesTable.studentId, student.id), eq(gradesTable.examId, examId)));
    if (existing.length) {
      await db.update(gradesTable).set({ score: rec.score }).where(eq(gradesTable.id, existing[0].id));
    } else {
      await db.insert(gradesTable).values({ studentId: student.id, examId, score: rec.score });
    }
    updated++;
  }

  res.json({ updated, notFound, total: records.length, notFoundIds });
});

export default router;
