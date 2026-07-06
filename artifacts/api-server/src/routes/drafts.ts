import { Router } from "express";
import { db, draftsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateDraftBody, DeleteDraftParams } from "@workspace/api-zod";

const router = Router();

router.get("/drafts", async (_req, res) => {
  const rows = await db.select().from(draftsTable).orderBy(draftsTable.createdAt);
  res.json(rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

router.post("/drafts", async (req, res) => {
  const parsed = CreateDraftBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid body" }); return; }
  const [draft] = await db.insert(draftsTable).values({ ...parsed.data, recordCount: parsed.data.recordCount ?? 0 }).returning();
  res.status(201).json({ ...draft, createdAt: draft.createdAt.toISOString() });
});

router.delete("/drafts/:id", async (req, res) => {
  const p = DeleteDraftParams.safeParse({ id: Number(req.params.id) });
  if (!p.success) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(draftsTable).where(eq(draftsTable.id, p.data.id));
  res.json({ success: true });
});

export default router;
