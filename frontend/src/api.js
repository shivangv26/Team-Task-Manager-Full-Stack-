const BASE = "/api";

function getToken() {
  return localStorage.getItem("token");
}

async function request(method, path, body) {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export const api = {
  // Auth
  signup: (body) => request("POST", "/auth/signup", body),
  login: (body) => request("POST", "/auth/login", body),
  me: () => request("GET", "/auth/me"),
  updateMe: (body) => request("PUT", "/auth/me", body),

  // Projects
  getProjects: () => request("GET", "/projects"),
  createProject: (body) => request("POST", "/projects", body),
  getProject: (id) => request("GET", `/projects/${id}`),
  updateProject: (id, body) => request("PUT", `/projects/${id}`, body),
  deleteProject: (id) => request("DELETE", `/projects/${id}`),
  addMember: (id, body) => request("POST", `/projects/${id}/members`, body),
  removeMember: (id, userId) => request("DELETE", `/projects/${id}/members/${userId}`),

  // Tasks
  getTasks: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request("GET", `/tasks${q ? `?${q}` : ""}`);
  },
  createTask: (body) => request("POST", "/tasks", body),
  getTask: (id) => request("GET", `/tasks/${id}`),
  updateTask: (id, body) => request("PUT", `/tasks/${id}`, body),
  deleteTask: (id) => request("DELETE", `/tasks/${id}`),
  getDashboard: () => request("GET", "/tasks/dashboard/summary"),

  // Users
  getUsers: (q) => request("GET", `/users${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  updateUserRole: (id, role) => request("PUT", `/users/${id}/role`, { role }),
  deleteUser: (id) => request("DELETE", `/users/${id}`),
};
