import { Router } from "express";
import { createHomeConfig, deleteHomeConfig, getHomeConfigById, getHomeConfigList, getHomeScreen, updateHomeConfig } from "../../controllers/home/home.controller";

const router = Router();

router.get("/home", getHomeScreen);

// POST /api/home/config
router.post("/home/config", createHomeConfig);

// LIST
// GET /api/home/config
router.get("/home/config", getHomeConfigList);

// GET SINGLE
// GET /api/home/config/:id
router.get("/home/config/:id", getHomeConfigById);

// UPDATE
// PUT /api/home/config/:id
router.put("/home/config/:id", updateHomeConfig);

// DELETE
// DELETE /api/home/config/:id
router.delete("/home/config/:id", deleteHomeConfig);


export default router;
