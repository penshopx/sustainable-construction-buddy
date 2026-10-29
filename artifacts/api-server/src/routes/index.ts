import { Router, type IRouter } from "express";
import healthRouter from "./health";
import chatRouter from "./chat";
import smapPilotRouter from "./smap-pilot";
import operatorPilotRouter from "./operator-pilot";
import schemeReferenceRouter from "./scheme-references";
import hermesLocalCheckRouter from "./hermes-local-check";

const router: IRouter = Router();

router.use(healthRouter);
router.use(chatRouter);
router.use(smapPilotRouter);
router.use(operatorPilotRouter);
router.use(schemeReferenceRouter);
router.use(hermesLocalCheckRouter);

export default router;
