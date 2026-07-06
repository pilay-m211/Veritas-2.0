import { Router } from "express";
import { db, examsTable, classesTable, gradesTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { ListExamsQueryParams, CreateExamBody, UpdateExamBody, GetExamParams, UpdateExamParams, DeleteExamParams } from "@workspace/api-zod";

const router = Router();

router.get("/exams", async (req, res) => {
  const parsed = ListExamsQueryParams.safeParse(req.query);
  if (!parsed.success) { res.status(400).json({ error: "Invalid query" }); return; }
  const { classId } = parsed.data;

  const rows = await db
    .select({
      id: examsTable.id,
      title: examsTable.title,
      classId: examsTable.classId,
      className: classesTable.name,
      totalItems: examsTable.totalItems,
      createdAt: examsTable.createdAt,
      gradedCount: sql<number>`cast(count(${gradesTable.id}) as int)`,
      averageScore: sql<number | null>`avg(${gradesTable.score})`,
    })
    .from(examsTable)
    .leftJoin(classesTable, eq(examsTable.classId, classesTable.id))
    .leftJoin(gradesTable, eq(gradesTable.examId, examsTable.id))
    .where(classId ? eq(examsTable.classId, classId) : undefined)
    .groupBy(examsTable.id, classesTable.name)
    .orderBy(examsTable.createdAt);

  res.json(rows.map(r => ({
    ...r,
    averageScore: r.averageScore != null ? Math.round(Number(r.averageScore) * 10) / 10 : null,
    createdAt: r.createdAt.toISOString(),
  })));
});

router.post("/exams", async (req, res) => {
  const parsed = CreateExamBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid body" }); return; }
  const [exam] = await db.insert(examsTable).values(parsed.data).returning();
  res.status(201).json({ ...exam, className: null, gradedCount: 0, averageScore: null, createdAt: exam.createdAt.toISOString() });
});

router.get("/exams/:id", async (req, res) => {
  const p = GetExamParams.safeParse({ id: Number(req.params.id) });
  if (!p.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const [row] = await db
    .select({ id: examsTable.id, title: examsTable.title, classId: examsTable.classId, className: classesTable.name, totalItems: examsTable.totalItems, createdAt: examsTable.createdAt, gradedCount: sql<number>`cast(count(${gradesTable.id}) as int)`, averageScore: sql<number | null>`avg(${gradesTable.score})` })
    .from(examsTable).leftJoin(classesTable, eq(examsTable.classId, classesTable.id)).leftJoin(gradesTable, eq(gradesTable.examId, examsTable.id)).where(eq(examsTable.id, p.data.id)).groupBy(examsTable.id, classesTable.name);
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...row, averageScore: row.averageScore != null ? Math.round(Number(row.averageScore) * 10) / 10 : null, createdAt: row.createdAt.toISOString() });
});

router.patch("/exams/:id", async (req, res) => {
  const p = UpdateExamParams.safeParse({ id: Number(req.params.id) });
  const b = UpdateExamBody.safeParse(req.body);
  if (!p.success || !b.success) { res.status(400).json({ error: "Invalid" }); return; }
  const [updated] = await db.update(examsTable).set(b.data).where(eq(examsTable.id, p.data.id)).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...updated, className: null, gradedCount: 0, averageScore: null, createdAt: updated.createdAt.toISOString() });
});

router.delete("/exams/:id", async (req, res) => {
  const p = DeleteExamParams.safeParse({ id: Number(req.params.id) });
  if (!p.success) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(examsTable).where(eq(examsTable.id, p.data.id));
  res.json({ success: true });
});

export default router;
