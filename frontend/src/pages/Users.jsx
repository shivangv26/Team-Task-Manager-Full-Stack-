import { useState, useEffect } from "react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Users() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (user?.role !== "admin") { navigate("/dashboard"); return; }
    api.getUsers().then(d => setUsers(d.users)).finally(() => setLoading(false));
  }, []);

  const filteredUsers = search
    ? users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))
    : users;

  const handleRoleChange = async (id, role) => {
    await api.updateUserRole(id, role);
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u));
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this user and all their data?")) return;
    await api.deleteUser(id);
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  return (
    <div style={{ padding: "28px 32px" }} className="fade-in">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 26, letterSpacing: "-.02em" }}>
            User Management
          </h1>
          <p style={{ color: "var(--text2)", fontSize: 14, marginTop: 2 }}>{users.length} registered users</p>
        </div>
        <span className="badge badge-progress" style={{ fontSize: 12 }}>Admin only</span>
      </div>

      <div style={{ marginBottom: 18 }}>
        <input className="input" style={{ maxWidth: 320 }} placeholder="Search by name or email..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
          <div className="spinner" style={{ width: 28, height: 28 }} />
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["User", "Email", "Role", "Joined", "Actions"].map(h => (
                  <th key={h} style={{
                    padding: "12px 16px", textAlign: "left",
                    fontSize: 11, fontWeight: 600, color: "var(--text2)",
                    textTransform: "uppercase", letterSpacing: ".05em",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u, i) => (
                <tr key={u.id} style={{
                  borderBottom: i < filteredUsers.length - 1 ? "1px solid var(--border)" : "none",
                  transition: "background .15s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--surface2)"}
                onMouseLeave={e => e.currentTarget.style.background = ""}>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: "50%",
                        background: u.role === "admin" ? "var(--accent)" : "var(--surface2)",
                        color: u.role === "admin" ? "#000" : "var(--text)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontWeight: 700, fontSize: 13, border: "1px solid var(--border2)",
                      }}>{u.name[0]}</div>
                      <span style={{ fontWeight: 600 }}>{u.name}</span>
                      {u.id === user?.id && (
                        <span className="badge badge-todo" style={{ fontSize: 10 }}>you</span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px", color: "var(--text2)", fontFamily: "var(--font-mono)", fontSize: 13 }}>{u.email}</td>
                  <td style={{ padding: "12px 16px" }}>
                    {u.id !== user?.id ? (
                      <select
                        value={u.role}
                        onChange={e => handleRoleChange(u.id, e.target.value)}
                        style={{
                          background: "var(--surface2)", border: "1px solid var(--border2)",
                          borderRadius: "var(--radius)", padding: "4px 8px",
                          color: u.role === "admin" ? "var(--accent)" : "var(--text)",
                          fontSize: 12, fontFamily: "var(--font-mono)", cursor: "pointer",
                        }}>
                        <option value="member">member</option>
                        <option value="admin">admin</option>
                      </select>
                    ) : (
                      <span className="badge badge-progress">{u.role}</span>
                    )}
                  </td>
                  <td style={{ padding: "12px 16px", color: "var(--text2)", fontSize: 13, fontFamily: "var(--font-mono)" }}>
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    {u.id !== user?.id && (
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u.id)}>
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredUsers.length === 0 && (
            <div className="empty-state" style={{ padding: 40 }}>
              <p>No users found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
