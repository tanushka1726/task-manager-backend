import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getTasks = asyncHandler(async (req: any, res: any) => {
  const userId = req.user.userId;
  const { page = 1, search = "", status } = req.query;

  const tasks = await prisma.task.findMany({
    where: {
      userId,
      title: { contains: search },
      ...(status && { iscompleted: status === "true" }),
    },
    take: 10,
    skip: (page - 1) * 10,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, tasks, "Tasks fetched successfully"));
});

export const createTask = asyncHandler(async (req: any, res: any) => {
  const userId = req.user.userId;
  const title = String(req.body?.title ?? "").trim();
  const description = String(req.body?.description ?? "").trim();

  if (!title || !description) {
    throw new ApiError(400, "Title and description are required");
  }

  const task = await prisma.task.create({
    data: { title, userId, description },
  });

  return res
    .status(201)
    .json(new ApiResponse(201, task, "Task created successfully"));
});

export const updateTask = asyncHandler(async (req: any, res: any) => {
  const { id } = req.params;
  const title = req.body?.title ? String(req.body.title).trim() : undefined;
  const description = req.body?.description
    ? String(req.body.description).trim()
    : undefined;

  if (!title && !description) {
    throw new ApiError(400, "At least one field is required to update");
  }

  const task = await prisma.task.update({
    where: { id: Number(id) },
    data: {
      ...(title !== undefined ? { title } : {}),
      ...(description !== undefined ? { description } : {}),
    },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, task, "Task updated successfully"));
});

export const deleteTask = asyncHandler(async (req: any, res: any) => {
  const { id } = req.params;

  await prisma.task.delete({ where: { id: Number(id) } });

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Task deleted successfully"));
});

export const toggleTask = asyncHandler(async (req: any, res: any) => {
  const { id } = req.params;
  const task = await prisma.task.findUnique({ where: { id: Number(id) } });

  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  const updated = await prisma.task.update({
    where: { id: Number(id) },
    data: { iscompleted: !task.iscompleted },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, updated, "Task toggled successfully"));
});
