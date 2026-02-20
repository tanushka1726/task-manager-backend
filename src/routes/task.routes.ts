import { Router } from "express";
import { getTasks, createTask, updateTask, deleteTask, toggleTask } from "../controllers/task.controller.js";
import authMiddleware  from "../midlleware/auth.middleware.js";

const router = Router();
router.get("/getTask", authMiddleware, getTasks);
router.post("/create", authMiddleware, createTask);
router.patch("/update/:id",authMiddleware,updateTask);
router.delete("/delete/:id",authMiddleware,deleteTask);
router.patch("/toggle/:id",authMiddleware,toggleTask)

export default router;
