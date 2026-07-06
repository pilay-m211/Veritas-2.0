import { Router } from "express";
import { db, classesTable, studentsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { CreateClassBody, UpdateClassBody, UpdateClassParams, DeleteClassParams } from "@workspace/api-zod";

const router = Router();

router.get("/classes", async (_req, res) => {
  const rows = await db
    .select({
      id: classesTable.id,
      name: classesTable.name,
      section: classesTable.section,
      subject: classesTable.subject,
      createdAt: classesTable.createdAt,
      studentCount: sql<number>`cast(count(${studentsTable.id}) as int)`,
    })
    .from(classesTable)
    .leftJoin(studentsTable, eq(studentsTable.classId, classesTable.id))
    .groupBy(classesTable.id)
    .orderBy(classesTable.name);

  res.json(rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

router.post("/classes", async (req, res) => {
  const parsed = CreateClassBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid body" }); return; }
  const [cls] = await db.insert(classesTable).values(parsed.data).returning();
  res.status(201).json({ ...cls, studentCount: 0, createdAt: cls.createdAt.toISOString() });
});

router.patch("/classes/:id", async (req, res) => {
  const p = UpdateClassParams.safeParse({ id: Number(req.params.id) });
  const b = UpdateClassBody.safeParse(req.body);
  if (!p.success || !b.success) { res.status(400).json({ error: "Invalid" }); return; }
  const [updated] = await db.update(classesTable).set(b.data).where(eq(classesTable.id, p.data.id)).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...updated, studentCount: 0, createdAt: updated.createdAt.toISOString() });
});

router.delete("/classes/:id", async (req, res) => {
  const p = DeleteClassParams.safeParse({ id: Number(req.params.id) });
  if (!p.success) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(classesTable).where(eq(classesTable.id, p.data.id));
  res.json({ success: true });
});

export default router;
