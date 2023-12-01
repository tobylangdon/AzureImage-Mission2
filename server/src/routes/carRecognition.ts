import { Router, Request, Response } from "express";
import * as controller from "../controllers/carRecognitionController";

const router: Router = Router();

router.post("/api/car-recognition", controller.checkImage);

export default router;
