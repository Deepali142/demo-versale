import { Router } from "express";
import { getHomeScreen } from "../../controllers/home/home.controller";

const router = Router();

router.get("/home", getHomeScreen);

export default router;
