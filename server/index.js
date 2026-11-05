import "dotenv/config";
import { randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { initializeDatabase, pool, withTransaction } from "./db.js";

const app = express();
const port = Number.parseInt(process.env.PORT || "3000", 10);
const isProduction = process.env.NODE_ENV === "production";
const origins = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const jwtSecret = process.env.JWT_SECRET;
const cookieName = "daymark_session";
const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax",
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set.");
}
if (!jwtSecret || jwtSecret.length < 32) {
  throw new Error("JWT_SECRET must be set to at least 32 characters.");
}

app.disable("x-powered-by");
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || origins.includes(origin)) return callback(null, true);
    return callback(new HttpError(403, "Origin is not allowed by CORS."));
  },
  credentials: true,
}));
app.use(express.json({ limit: "5mb" }));
app.use(cookieParser());
app.use("/api", (req, _res, next) => {
  const origin = req.get("origin");
  if (!["GET", "HEAD", "OPTIONS"].includes(req.method) && origin && !origins.includes(origin)) {
    return next(new HttpError(403, "Origin is not allowed."));
  }
  return next();
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function validate(schema, input) {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new HttpError(400, result.error.issues[0]?.message || "Invalid request.");
  }
  return result.data;
}

function asyncRoute(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

function issueSession(userId) {
  return jwt.sign({ sub: userId }, jwtSecret, { expiresIn: "7d", issuer: "daymark" });
}

function requireAuth(req, _res, next) {
  const token = req.cookies[cookieName];
  if (!token) return next(new HttpError(401, "Please sign in to continue."));
  try {
    const payload = jwt.verify(token, jwtSecret, { issuer: "daymark" });
    req.userId = payload.sub;
    return next();
  } catch {
    return next(new HttpError(401, "Your session has expired. Please sign in again."));
  }
}

const requireWorkspace = asyncRoute(async (req, _res, next) => {
  const requestedId = req.get("x-workspace-id");
  const membership = requestedId
    ? await pool.query(
      `SELECT w.id, w.name, wm.role
       FROM workspace_members wm
       JOIN workspaces w ON w.id = wm.workspace_id
       WHERE wm.user_id = $1 AND w.id = $2`,
      [req.userId, requestedId],
    )
    : await pool.query(
      `SELECT w.id, w.name, wm.role
       FROM workspace_members wm
       JOIN workspaces w ON w.id = wm.workspace_id
       WHERE wm.user_id = $1
       ORDER BY wm.created_at, w.id
       LIMIT 1`,
      [req.userId],
    );

  if (!membership.rowCount) throw new HttpError(403, "You do not have access to this workspace.");
  req.workspace = membership.rows[0];
  next();
});

const emailSchema = z.string().trim().email().max(254).transform((value) => value.toLowerCase());
const passwordSchema = z.string().min(12).max(128);
const colorSchema = z.enum(["violet", "blue", "orange", "green", "pink"]);
const prioritySchema = z.enum(["High", "Medium", "Low"]);
const dateSchema = z.iso.date();
const projectSchema = z.object({
  name: z.string().trim().min(1).max(70),
  color: colorSchema.default("violet"),
}).strict();
const taskSchema = z.object({
  title: z.string().trim().min(1).max(180),
  projectId: z.uuid(),
  due: dateSchema,
  priority: prioritySchema.default("Medium"),
  completed: z.boolean().default(false),
}).strict();
const importTaskSchema = z.object({
  title: z.string().trim().min(1).max(180),
  project: z.string().trim().min(1).max(70),
  due: dateSchema,
  priority: prioritySchema.default("Medium"),
  completed: z.boolean().default(false),
}).strict();
const taskUpdateSchema = taskSchema.partial().strict();

app.get("/api/health", asyncRoute(async (_req, res) => {
  await pool.query("SELECT 1");
  res.json({ status: "ok", database: "connected" });
}));

app.post("/api/auth/register", authLimiter, asyncRoute(async (req, res) => {
  const body = validate(z.object({
    name: z.string().trim().min(1).max(80),
    email: emailSchema,
    password: passwordSchema,
  }).strict(), req.body);
  const passwordHash = await bcrypt.hash(body.password, 12);

  const result = await withTransaction(async (client) => {
    const user = await client.query(
      "INSERT INTO users (email, display_name, password_hash) VALUES ($1, $2, $3) RETURNING id, email, display_name",
      [body.email, body.name, passwordHash],
    );
    const workspace = await client.query(
      "INSERT INTO workspaces (name) VALUES ($1) RETURNING id",
      [`${body.name}'s Workspace`],
    );
    await client.query(
      "INSERT INTO workspace_members (workspace_id, user_id, role) VALUES ($1, $2, 'owner')",
      [workspace.rows[0].id, user.rows[0].id],
    );
    await client.query(
      "INSERT INTO projects (workspace_id, name) VALUES ($1, 'Personal')",
      [workspace.rows[0].id],
    );
    return user.rows[0];
  });

  res.cookie(cookieName, issueSession(result.id), cookieOptions);
  res.status(201).json({ user: { id: result.id, email: result.email, name: result.display_name } });
}));

app.post("/api/auth/login", authLimiter, asyncRoute(async (req, res) => {
  const body = validate(z.object({ email: emailSchema, password: z.string().min(1).max(128) }).strict(), req.body);
  const result = await pool.query(
    "SELECT id, email, display_name, password_hash FROM users WHERE email = $1",
    [body.email],
  );
  const user = result.rows[0];
  if (!user || !(await bcrypt.compare(body.password, user.password_hash))) {
    throw new HttpError(401, "Email or password is incorrect.");
  }
  res.cookie(cookieName, issueSession(user.id), cookieOptions);
  res.json({ user: { id: user.id, email: user.email, name: user.display_name } });
}));

app.post("/api/auth/logout", (_req, res) => {
  res.clearCookie(cookieName, cookieOptions);
  res.status(204).end();
});

app.get("/api/auth/me", requireAuth, asyncRoute(async (req, res) => {
  const [userResult, workspacesResult] = await Promise.all([
    pool.query("SELECT id, email, display_name FROM users WHERE id = $1", [req.userId]),
    pool.query(
      `SELECT w.id, w.name, wm.role
       FROM workspace_members wm
       JOIN workspaces w ON w.id = wm.workspace_id
       WHERE wm.user_id = $1
       ORDER BY wm.created_at, w.id`,
      [req.userId],
    ),
  ]);
  if (!userResult.rowCount) throw new HttpError(401, "Your account is no longer available.");
  res.json({
    user: {
      id: userResult.rows[0].id,
      email: userResult.rows[0].email,
      name: userResult.rows[0].display_name,
    },
    workspaces: workspacesResult.rows,
  });
}));

app.use("/api", requireAuth);

app.get("/api/workspaces", asyncRoute(async (req, res) => {
  const result = await pool.query(
    `SELECT w.id, w.name, wm.role
     FROM workspace_members wm
     JOIN workspaces w ON w.id = wm.workspace_id
     WHERE wm.user_id = $1
     ORDER BY wm.created_at, w.id`,
    [req.userId],
  );
  res.json({ items: result.rows });
}));

app.post("/api/workspaces", asyncRoute(async (req, res) => {
  const { name } = validate(z.object({ name: z.string().trim().min(1).max(80) }).strict(), req.body);
  const workspace = await withTransaction(async (client) => {
    const created = await client.query("INSERT INTO workspaces (name) VALUES ($1) RETURNING id, name", [name]);
    await client.query(
      "INSERT INTO workspace_members (workspace_id, user_id, role) VALUES ($1, $2, 'owner')",
      [created.rows[0].id, req.userId],
    );
    await client.query("INSERT INTO projects (workspace_id, name) VALUES ($1, 'Personal')", [created.rows[0].id]);
    return { ...created.rows[0], role: "owner" };
  });
  res.status(201).json(workspace);
}));

app.get("/api/workspaces/:workspaceId/members", asyncRoute(async (req, res) => {
  const workspaceId = validate(z.uuid(), req.params.workspaceId);
  const result = await pool.query(
    `SELECT u.id, u.email, u.display_name AS name, wm.role, wm.created_at
     FROM workspace_members wm
     JOIN users u ON u.id = wm.user_id
     WHERE wm.workspace_id = $1 AND EXISTS (
       SELECT 1 FROM workspace_members access
       WHERE access.workspace_id = wm.workspace_id AND access.user_id = $2
     )
     ORDER BY wm.created_at`,
    [workspaceId, req.userId],
  );
  if (!result.rowCount) {
    const workspace = await pool.query("SELECT 1 FROM workspaces WHERE id = $1", [workspaceId]);
    if (workspace.rowCount) throw new HttpError(403, "You do not have access to this workspace.");
    throw new HttpError(404, "Workspace not found.");
  }
  res.json({ items: result.rows });
}));

app.post("/api/workspaces/:workspaceId/members", asyncRoute(async (req, res) => {
  const workspaceId = validate(z.uuid(), req.params.workspaceId);
  const { email } = validate(z.object({ email: emailSchema }).strict(), req.body);
  const owner = await pool.query(
    "SELECT 1 FROM workspace_members WHERE workspace_id = $1 AND user_id = $2 AND role = 'owner'",
    [workspaceId, req.userId],
  );
  if (!owner.rowCount) throw new HttpError(403, "Only workspace owners can add members.");
  const user = await pool.query("SELECT id, email, display_name FROM users WHERE email = $1", [email]);
  if (!user.rowCount) throw new HttpError(404, "That person needs to create an account before they can be added.");
  const membership = await pool.query(
    `INSERT INTO workspace_members (workspace_id, user_id, role)
     VALUES ($1, $2, 'member')
     ON CONFLICT (workspace_id, user_id) DO NOTHING
     RETURNING user_id`,
    [workspaceId, user.rows[0].id],
  );
  if (!membership.rowCount) throw new HttpError(409, "That person is already a workspace member.");
  res.status(201).json({ id: user.rows[0].id, email: user.rows[0].email, name: user.rows[0].display_name, role: "member" });
}));

app.get("/api/projects", requireWorkspace, asyncRoute(async (req, res) => {
  const result = await pool.query(
    `SELECT p.id, p.name, p.color,
       COUNT(t.id) FILTER (WHERE NOT t.completed)::int AS active_task_count
     FROM projects p
     LEFT JOIN tasks t ON t.project_id = p.id AND t.workspace_id = p.workspace_id
     WHERE p.workspace_id = $1
     GROUP BY p.id
     ORDER BY p.created_at, p.name`,
    [req.workspace.id],
  );
  res.json({ items: result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    color: row.color,
    activeTaskCount: row.active_task_count,
  })) });
}));

app.post("/api/projects", requireWorkspace, asyncRoute(async (req, res) => {
  const body = validate(projectSchema, req.body);
  const result = await pool.query(
    `INSERT INTO projects (workspace_id, name, color) VALUES ($1, $2, $3)
     RETURNING id, name, color`,
    [req.workspace.id, body.name, body.color],
  );
  res.status(201).json({ ...result.rows[0], activeTaskCount: 0 });
}));

app.patch("/api/projects/:projectId", requireWorkspace, asyncRoute(async (req, res) => {
  const projectId = validate(z.uuid(), req.params.projectId);
  const body = validate(projectSchema, req.body);
  const result = await pool.query(
    `UPDATE projects SET name = $1, color = $2, updated_at = NOW()
     WHERE id = $3 AND workspace_id = $4
     RETURNING id, name, color`,
    [body.name, body.color, projectId, req.workspace.id],
  );
  if (!result.rowCount) throw new HttpError(404, "Project not found.");
  res.json(result.rows[0]);
}));

app.delete("/api/projects/:projectId", requireWorkspace, asyncRoute(async (req, res) => {
  const projectId = validate(z.uuid(), req.params.projectId);
  const result = await pool.query(
    "DELETE FROM projects WHERE id = $1 AND workspace_id = $2",
    [projectId, req.workspace.id],
  );
  if (!result.rowCount) throw new HttpError(404, "Project not found.");
  res.status(204).end();
}));

app.get("/api/tasks", requireWorkspace, asyncRoute(async (req, res) => {
  const query = validate(z.object({
    view: z.enum(["My tasks", "Today", "Upcoming", "Completed", "Overdue"]).default("My tasks"),
    projectId: z.uuid().optional(),
    q: z.string().trim().max(120).default(""),
    priority: z.enum(["High", "Medium", "Low"]).optional(),
    sort: z.enum(["deadline", "priority", "title", "newest"]).default("deadline"),
    today: dateSchema,
    limit: z.coerce.number().int().min(1).max(100).default(50),
    offset: z.coerce.number().int().min(0).max(1_000_000).default(0),
  }).strict(), req.query);

  const filters = ["t.workspace_id = $1"];
  const values = [req.workspace.id];
  const addFilter = (sql, value) => {
    values.push(value);
    filters.push(sql.replace("?", `$${values.length}`));
  };
  if (query.projectId) addFilter("t.project_id = ?", query.projectId);
  if (query.priority) addFilter("t.priority = ?", query.priority);
  if (query.view === "My tasks" || query.view === "Upcoming" || query.view === "Overdue") {
    addFilter("t.completed = ?", false);
  } else if (query.view === "Completed") {
    addFilter("t.completed = ?", true);
  }
  if (query.view === "Today") addFilter("t.due_date = ?::date", query.today);
  if (query.view === "Upcoming") addFilter("t.due_date <> ?::date", query.today);
  if (query.view === "Overdue") addFilter("t.due_date < ?::date", query.today);
  if (query.q) {
    values.push(`%${query.q.replace(/[\\%_]/g, "\\$&")}%`);
    const position = values.length;
    filters.push(`(t.title ILIKE $${position} ESCAPE '\\' OR p.name ILIKE $${position} ESCAPE '\\' OR t.priority ILIKE $${position} ESCAPE '\\')`);
  }

  const where = filters.join(" AND ");
  const sortColumns = {
    deadline: "t.due_date ASC, t.created_at DESC",
    priority: "CASE t.priority WHEN 'High' THEN 1 WHEN 'Medium' THEN 2 ELSE 3 END ASC, t.due_date ASC",
    title: "t.title ASC",
    newest: "t.created_at DESC",
  };
  const countResult = await pool.query(
    `SELECT COUNT(*)::int AS total
     FROM tasks t JOIN projects p ON p.id = t.project_id AND p.workspace_id = t.workspace_id
     WHERE ${where}`,
    values,
  );
  const pageValues = [...values, query.limit, query.offset];
  const tasksResult = await pool.query(
    `SELECT t.id, t.title, t.project_id, p.name AS project, p.color AS project_color,
       t.due_date::text AS due, t.priority, t.completed, t.created_at, t.updated_at
     FROM tasks t
     JOIN projects p ON p.id = t.project_id AND p.workspace_id = t.workspace_id
     WHERE ${where}
     ORDER BY ${sortColumns[query.sort]}, t.id
     LIMIT $${pageValues.length - 1} OFFSET $${pageValues.length}`,
    pageValues,
  );
  const total = countResult.rows[0].total;
  res.json({
    items: tasksResult.rows.map((task) => ({
      id: task.id,
      title: task.title,
      projectId: task.project_id,
      project: task.project,
      projectColor: task.project_color,
      due: task.due,
      priority: task.priority,
      completed: task.completed,
      createdAt: task.created_at,
      updatedAt: task.updated_at,
    })),
    pagination: { total, limit: query.limit, offset: query.offset, hasMore: query.offset + tasksResult.rowCount < total },
  });
}));

app.post("/api/tasks", requireWorkspace, asyncRoute(async (req, res) => {
  const body = validate(taskSchema, req.body);
  const result = await pool.query(
    `INSERT INTO tasks (workspace_id, project_id, created_by, title, due_date, priority, completed)
     SELECT $1, p.id, $2, $4, $5::date, $6, $7
     FROM projects p WHERE p.id = $3 AND p.workspace_id = $1
     RETURNING id, title, project_id, due_date::text AS due, priority, completed, created_at, updated_at`,
    [req.workspace.id, req.userId, body.projectId, body.title, body.due, body.priority, body.completed],
  );
  if (!result.rowCount) throw new HttpError(400, "Choose a project in this workspace.");
  const task = await pool.query(
    `SELECT t.id, t.title, t.project_id, p.name AS project, p.color AS project_color,
      t.due_date::text AS due, t.priority, t.completed, t.created_at, t.updated_at
     FROM tasks t JOIN projects p ON p.id = t.project_id AND p.workspace_id = t.workspace_id
     WHERE t.id = $1`,
    [result.rows[0].id],
  );
  res.status(201).json(toTask(task.rows[0]));
}));

function toTask(task) {
  return {
    id: task.id,
    title: task.title,
    projectId: task.project_id,
    project: task.project,
    projectColor: task.project_color,
    due: task.due,
    priority: task.priority,
    completed: task.completed,
    createdAt: task.created_at,
    updatedAt: task.updated_at,
  };
}

app.patch("/api/tasks/:taskId", requireWorkspace, asyncRoute(async (req, res) => {
  const taskId = validate(z.uuid(), req.params.taskId);
  const body = validate(taskUpdateSchema, req.body);
  if (!Object.keys(body).length) throw new HttpError(400, "Provide at least one task field to update.");
  const result = await pool.query(
    `UPDATE tasks t SET
       title = COALESCE($1, t.title),
       project_id = COALESCE($2::uuid, t.project_id),
       due_date = COALESCE($3::date, t.due_date),
       priority = COALESCE($4, t.priority),
       completed = COALESCE($5, t.completed),
       updated_at = NOW()
     WHERE t.id = $6 AND t.workspace_id = $7
       AND ($2::uuid IS NULL OR EXISTS (
         SELECT 1 FROM projects p WHERE p.id = $2::uuid AND p.workspace_id = $7
       ))
     RETURNING t.id`,
    [
      body.title ?? null,
      body.projectId ?? null,
      body.due ?? null,
      body.priority ?? null,
      body.completed ?? null,
      taskId,
      req.workspace.id,
    ],
  );
  if (!result.rowCount) throw new HttpError(404, "Task not found or project is not in this workspace.");
  const task = await pool.query(
    `SELECT t.id, t.title, t.project_id, p.name AS project, p.color AS project_color,
      t.due_date::text AS due, t.priority, t.completed, t.created_at, t.updated_at
     FROM tasks t JOIN projects p ON p.id = t.project_id AND p.workspace_id = t.workspace_id
     WHERE t.id = $1 AND t.workspace_id = $2`,
    [taskId, req.workspace.id],
  );
  res.json(toTask(task.rows[0]));
}));

app.delete("/api/tasks/:taskId", requireWorkspace, asyncRoute(async (req, res) => {
  const taskId = validate(z.uuid(), req.params.taskId);
  const result = await pool.query(
    "DELETE FROM tasks WHERE id = $1 AND workspace_id = $2",
    [taskId, req.workspace.id],
  );
  if (!result.rowCount) throw new HttpError(404, "Task not found.");
  res.status(204).end();
}));

app.patch("/api/tasks/bulk", requireWorkspace, asyncRoute(async (req, res) => {
  const body = validate(z.object({
    ids: z.array(z.uuid()).min(1).max(100),
    completed: z.boolean().optional(),
  }).strict(), req.body);
  if (body.completed === undefined) throw new HttpError(400, "Provide a completed value.");
  const result = await pool.query(
    `UPDATE tasks SET completed = $1, updated_at = NOW()
     WHERE workspace_id = $2 AND id = ANY($3::uuid[])`,
    [body.completed, req.workspace.id, body.ids],
  );
  res.json({ updated: result.rowCount });
}));

app.delete("/api/tasks/bulk", requireWorkspace, asyncRoute(async (req, res) => {
  const { ids } = validate(z.object({ ids: z.array(z.uuid()).min(1).max(100) }).strict(), req.body);
  const result = await pool.query(
    "DELETE FROM tasks WHERE workspace_id = $1 AND id = ANY($2::uuid[])",
    [req.workspace.id, ids],
  );
  res.json({ deleted: result.rowCount });
}));

app.get("/api/stats", requireWorkspace, asyncRoute(async (req, res) => {
  const { today } = validate(z.object({ today: dateSchema }).strict(), req.query);
  const result = await pool.query(
    `SELECT
       COUNT(*)::int AS total,
       COUNT(*) FILTER (WHERE completed)::int AS completed,
       COUNT(*) FILTER (WHERE NOT completed AND due_date = $2::date)::int AS today,
       COUNT(*) FILTER (WHERE NOT completed AND due_date <> $2::date)::int AS upcoming,
       COUNT(*) FILTER (WHERE NOT completed AND due_date < $2::date)::int AS overdue,
       COUNT(*) FILTER (WHERE NOT completed AND priority = 'High')::int AS high_priority
     FROM tasks WHERE workspace_id = $1`,
    [req.workspace.id, today],
  );
  res.json(result.rows[0]);
}));

app.get("/api/export", requireWorkspace, asyncRoute(async (req, res) => {
  const [projectsResult, tasksResult] = await Promise.all([
    pool.query("SELECT id, name, color FROM projects WHERE workspace_id = $1 ORDER BY created_at", [req.workspace.id]),
    pool.query(
      `SELECT t.id, t.title, t.project_id, p.name AS project, p.color AS project_color,
        t.due_date::text AS due, t.priority, t.completed
       FROM tasks t
       JOIN projects p ON p.id = t.project_id AND p.workspace_id = t.workspace_id
       WHERE t.workspace_id = $1 ORDER BY t.created_at, t.id`,
      [req.workspace.id],
    ),
  ]);
  res.json({
    app: "Daymark Pro",
    version: 1,
    exportedAt: new Date().toISOString(),
    projects: projectsResult.rows,
    tasks: tasksResult.rows.map(toTask),
  });
}));

app.post("/api/import", requireWorkspace, asyncRoute(async (req, res) => {
  const body = validate(z.object({
    projects: z.array(projectSchema).max(500),
    tasks: z.array(importTaskSchema).max(5000),
  }).strict(), req.body);
  const normalizedProjects = new Map();
  for (const project of body.projects) {
    const key = project.name.toLocaleLowerCase();
    if (!normalizedProjects.has(key)) normalizedProjects.set(key, project);
  }
  if (body.tasks.length && !normalizedProjects.size) {
    throw new HttpError(400, "The backup must include at least one project.");
  }
  if (body.tasks.some((task) => !normalizedProjects.has(task.project.toLocaleLowerCase()))) {
    throw new HttpError(400, "Every task must refer to a project in the backup.");
  }

  const imported = await withTransaction(async (client) => {
    await client.query("DELETE FROM tasks WHERE workspace_id = $1", [req.workspace.id]);
    await client.query("DELETE FROM projects WHERE workspace_id = $1", [req.workspace.id]);

    const projectsByName = new Map();
    for (const project of normalizedProjects.values()) {
      const result = await client.query(
        `INSERT INTO projects (workspace_id, name, color) VALUES ($1, $2, $3) RETURNING id`,
        [req.workspace.id, project.name, project.color],
      );
      projectsByName.set(project.name.toLocaleLowerCase(), result.rows[0].id);
    }

    for (const task of body.tasks) {
      const projectId = projectsByName.get(task.project.toLocaleLowerCase());
      await client.query(
        `INSERT INTO tasks (workspace_id, project_id, created_by, title, due_date, priority, completed)
         VALUES ($1, $2, $3, $4, $5::date, $6, $7)`,
        [req.workspace.id, projectId, req.userId, task.title, task.due, task.priority, task.completed],
      );
    }
    return { projects: normalizedProjects.size, tasks: body.tasks.length };
  });
  res.json({ imported });
}));

const currentFile = fileURLToPath(import.meta.url);
const appRoot = path.resolve(path.dirname(currentFile), "..");
const distPath = path.join(appRoot, "dist");
if (isProduction && existsSync(distPath)) {
  app.use("/api", (_req, res) => res.status(404).json({ error: "API route not found." }));
  app.use(express.static(distPath, { maxAge: "1y", index: false }));
  app.get("*path", (req, res, next) => {
    if (req.path.startsWith("/api/")) return next();
    res.sendFile(path.join(distPath, "index.html"));
  });
}
if (!isProduction || !existsSync(distPath)) {
  app.use("/api", (_req, res) => res.status(404).json({ error: "API route not found." }));
}

app.use((error, _req, res, _next) => {
  if (error?.code === "23505") {
    return res.status(409).json({ error: "A record with that name or email already exists." });
  }
  if (error?.code === "23503") {
    return res.status(409).json({ error: "This record is still being used by other data." });
  }
  if (error instanceof SyntaxError && "body" in error) {
    return res.status(400).json({ error: "Request body must be valid JSON." });
  }
  if (error instanceof HttpError) {
    return res.status(error.status).json({ error: error.message });
  }
  if (error?.name === "ZodError") {
    return res.status(400).json({ error: error.issues[0]?.message || "Invalid request." });
  }
  console.error("Unhandled API error:", error);
  return res.status(500).json({ error: isProduction ? "An unexpected server error occurred." : error.message });
});

export { app };

if (process.argv[1] && path.resolve(process.argv[1]) === currentFile) {
  initializeDatabase()
    .then(() => app.listen(port, () => {
      console.log(`Daymark API listening on http://localhost:${port}`);
    }))
    .catch((error) => {
      console.error("Failed to initialize the database:", error);
      process.exitCode = 1;
    });
}
