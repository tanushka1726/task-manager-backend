import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";
import taskRoutes from "./routes/task.routes.js";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use("/auth", authRoutes);
app.use("/tasks", taskRoutes);

export default app;
