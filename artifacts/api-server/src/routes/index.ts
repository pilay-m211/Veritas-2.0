import { Router, type IRouter } from "express";
import healthRouter from "./health";
import studentsRouter from "./students";
import classesRouter from "./classes";
import examsRouter from "./exams";
import gradesRouter from "./grades";
import draftsRouter from "./drafts";
import statsRouter from "./stats";

const router: IRouter = Router();

router.use(healthRouter);
router.use(studentsRouter);
router.use(classesRouter);
router.use(examsRouter);
router.use(gradesRouter);
router.use(draftsRouter);
router.use(statsRouter);

export default router;
