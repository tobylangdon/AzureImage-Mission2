import { Router, Request, Response } from "express";
import * as controller from "../controllers/uploadCar";

const router: Router = Router();

router.post("/api/car-upload", controller.checkImage);

export default router;
