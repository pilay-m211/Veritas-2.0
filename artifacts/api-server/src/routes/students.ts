import { Router } from "express";
import { db, studentsTable, classesTable, gradesTable } from "@workspace/db";
import { eq, ilike, or, desc, sql } from "drizzle-orm";
import { ListStudentsQueryParams, CreateStudentBody, UpdateStudentBody, GetStudentParams, UpdateStudentParams, DeleteStudentParams, ImportStudentsBody } from "@workspace/api-zod";

const router = Router();

router.get("/students", async (req, res) => {
  const parsed = ListStudentsQueryParams.safeParse(req.query);
  if (!parsed.success) { res.status(400).json({ error: "Invalid query" }); return; }
  const { classId, search } = parsed.data;

  const conditions = [];
  if (classId) conditions.push(eq(studentsTable.classId, classId));
  if (search) conditions.push(or(ilike(studentsTable.firstName, `%${search}%`), ilike(studentsTable.lastName, `%${search}%`), ilike(studentsTable.studentId, `%${search}%`)));

  const rows = await db
    .select({
      id: studentsTable.id,
      studentId: studentsTable.studentId,
      firstName: studentsTable.firstName,
      lastName: studentsTable.lastName,
      classId: studentsTable.classId,
      className: classesTable.name,
      createdAt: studentsTable.createdAt,
    })
    .from(studentsTable)
    .leftJoin(classesTable, eq(studentsTable.classId, classesTable.id))
    .where(conditions.length ? (conditions.length === 1 ? conditions[0] : sql`${conditions[0]} AND ${conditions[1]}`) : undefined)
    .orderBy(studentsTable.lastName, studentsTable.firstName);

  res.json(rows.map(r => ({ ...r, latestScore: null, createdAt: r.createdAt.toISOString() })));
});

router.post("/students", async (req, res) => {
  const parsed = CreateStudentBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid body" }); return; }
  const [student] = await db.insert(studentsTable).values(parsed.data).returning();
  res.status(201).json({ ...student, className: null, latestScore: null, createdAt: student.createdAt.toISOString() });
});

router.post("/students/import", async (req, res) => {
  const parsed = ImportStudentsBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid body" }); return; }
  const { students, classId, skipDuplicates } = parsed.data;

  let imported = 0, skipped = 0, errors = 0;
  const errorDetails: string[] = [];

  for (const s of students) {
    try {
      if (skipDuplicates) {
        const existing = await db.select({ id: studentsTable.id }).from(studentsTable).where(eq(studentsTable.studentId, s.studentId));
        if (existing.length) { skipped++; continue; }
      }
      await db.insert(studentsTable).values({ studentId: s.studentId, firstName: s.firstName, lastName: s.lastName, classId: classId ?? s.classId ?? null });
      imported++;
    } catch (err: any) {
      errors++;
      errorDetails.push(`${s.studentId}: ${err?.message ?? "unknown error"}`);
    }
  }

  res.json({ imported, skipped, errors, total: students.length, errorDetails });
});

router.get("/students/:id", async (req, res) => {
  const p = GetStudentParams.safeParse({ id: Number(req.params.id) });
  if (!p.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const [row] = await db
    .select({ id: studentsTable.id, studentId: studentsTable.studentId, firstName: studentsTable.firstName, lastName: studentsTable.lastName, classId: studentsTable.classId, className: classesTable.name, createdAt: studentsTable.createdAt })
    .from(studentsTable).leftJoin(classesTable, eq(studentsTable.classId, classesTable.id)).where(eq(studentsTable.id, p.data.id));
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...row, latestScore: null, createdAt: row.createdAt.toISOString() });
});

router.patch("/students/:id", async (req, res) => {
  const p = UpdateStudentParams.safeParse({ id: Number(req.params.id) });
  const b = UpdateStudentBody.safeParse(req.body);
  if (!p.success || !b.success) { res.status(400).json({ error: "Invalid" }); return; }
  const [updated] = await db.update(studentsTable).set(b.data).where(eq(studentsTable.id, p.data.id)).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...updated, className: null, latestScore: null, createdAt: updated.createdAt.toISOString() });
});

router.delete("/students/:id", async (req, res) => {
  const p = DeleteStudentParams.safeParse({ id: Number(req.params.id) });
  if (!p.success) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(studentsTable).where(eq(studentsTable.id, p.data.id));
  res.json({ success: true });
});

export default router;
