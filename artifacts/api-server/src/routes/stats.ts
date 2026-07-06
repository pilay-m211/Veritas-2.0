import { Router } from "express";
import { db, studentsTable, classesTable, examsTable, gradesTable } from "@workspace/db";
import { eq, sql, desc } from "drizzle-orm";

const router = Router();

router.get("/stats/dashboard", async (_req, res) => {
  const [[{ totalStudents }], [{ totalClasses }], [{ totalExams }], [{ totalGrades, averageScore }]] = await Promise.all([
    db.select({ totalStudents: sql<number>`cast(count(*) as int)` }).from(studentsTable),
    db.select({ totalClasses: sql<number>`cast(count(*) as int)` }).from(classesTable),
    db.select({ totalExams: sql<number>`cast(count(*) as int)` }).from(examsTable),
    db.select({ totalGrades: sql<number>`cast(count(*) as int)`, averageScore: sql<number | null>`avg(score)` }).from(gradesTable),
  ]);

  const recentGradeRows = await db.select().from(gradesTable).orderBy(desc(gradesTable.createdAt)).limit(5);
  const recentGrades = await Promise.all(recentGradeRows.map(async g => {
    const [student] = await db.select().from(studentsTable).where(eq(studentsTable.id, g.studentId));
    const [exam] = await db.select().from(examsTable).where(eq(examsTable.id, g.examId));
    return { id: g.id, studentId: g.studentId, examId: g.examId, studentSchoolId: student?.studentId ?? "", studentName: student ? `${student.firstName} ${student.lastName}` : "", examTitle: exam?.title ?? "", score: g.score, createdAt: g.createdAt.toISOString() };
  }));

  const recentExamRows = await db
    .select({ id: examsTable.id, title: examsTable.title, classId: examsTable.classId, className: classesTable.name, totalItems: examsTable.totalItems, createdAt: examsTable.createdAt, gradedCount: sql<number>`cast(count(${gradesTable.id}) as int)`, averageScore: sql<number | null>`avg(${gradesTable.score})` })
    .from(examsTable).leftJoin(classesTable, eq(examsTable.classId, classesTable.id)).leftJoin(gradesTable, eq(gradesTable.examId, examsTable.id)).groupBy(examsTable.id, classesTable.name).orderBy(desc(examsTable.createdAt)).limit(5);

  res.json({
    totalStudents,
    totalClasses,
    totalExams,
    totalGrades,
    averageScore: averageScore != null ? Math.round(Number(averageScore) * 10) / 10 : null,
    recentGrades,
    recentExams: recentExamRows.map(r => ({ ...r, averageScore: r.averageScore != null ? Math.round(Number(r.averageScore) * 10) / 10 : null, createdAt: r.createdAt.toISOString() })),
  });
});

export default router;
