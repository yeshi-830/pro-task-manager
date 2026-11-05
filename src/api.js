const API_BASE = import.meta.env.VITE_API_URL || "";
const WORKSPACE_STORAGE_KEY = "daymark-active-workspace";

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const workspaceId = localStorage.getItem(WORKSPACE_STORAGE_KEY);
  if (workspaceId) headers.set("x-workspace-id", workspaceId);
  if (options.body !== undefined) headers.set("content-type", "application/json");

  let response;
  try {
    response = await fetch(`${API_BASE}/api${path}`, {
      ...options,
      headers,
      credentials: "include",
    });
  } catch {
    throw new ApiError("The server could not be reached. Check your connection and try again.", 0);
  }

  if (response.status === 204) return null;
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(payload.error || "The request could not be completed.", response.status);
  }
  return payload;
}

function jsonBody(value) {
  return JSON.stringify(value);
}

export const api = {
  me: () => request("/auth/me"),
  register: (body) => request("/auth/register", { method: "POST", body: jsonBody(body) }),
  login: (body) => request("/auth/login", { method: "POST", body: jsonBody(body) }),
  logout: () => request("/auth/logout", { method: "POST" }),
  setWorkspaceId(id) {
    if (id) localStorage.setItem(WORKSPACE_STORAGE_KEY, id);
    else localStorage.removeItem(WORKSPACE_STORAGE_KEY);
  },
  getWorkspaceId: () => localStorage.getItem(WORKSPACE_STORAGE_KEY),
  workspaces: () => request("/workspaces"),
  createWorkspace: (name) => request("/workspaces", { method: "POST", body: jsonBody({ name }) }),
  addWorkspaceMember: (workspaceId, email) => request(
    `/workspaces/${encodeURIComponent(workspaceId)}/members`,
    { method: "POST", body: jsonBody({ email }) },
  ),
  projects: () => request("/projects"),
  createProject: (body) => request("/projects", { method: "POST", body: jsonBody(body) }),
  updateProject: (id, body) => request(
    `/projects/${encodeURIComponent(id)}`,
    { method: "PATCH", body: jsonBody(body) },
  ),
  deleteProject: (id) => request(`/projects/${encodeURIComponent(id)}`, { method: "DELETE" }),
  tasks: (params) => request(`/tasks?${new URLSearchParams(params)}`),
  createTask: (body) => request("/tasks", { method: "POST", body: jsonBody(body) }),
  updateTask: (id, body) => request(
    `/tasks/${encodeURIComponent(id)}`,
    { method: "PATCH", body: jsonBody(body) },
  ),
  deleteTask: (id) => request(`/tasks/${encodeURIComponent(id)}`, { method: "DELETE" }),
  updateTasks: (ids, completed) => request("/tasks/bulk", {
    method: "PATCH",
    body: jsonBody({ ids, completed }),
  }),
  deleteTasks: (ids) => request("/tasks/bulk", { method: "DELETE", body: jsonBody({ ids }) }),
  stats: (today) => request(`/stats?${new URLSearchParams({ today })}`),
  exportData: () => request("/export"),
  importData: (data) => request("/import", { method: "POST", body: jsonBody(data) }),
};
