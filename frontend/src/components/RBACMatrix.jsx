import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export default function RBACMatrix() {
  const [matrix, setMatrix] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/api/roles/matrix`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`Failed to load RBAC matrix (${res.status})`);
        const data = await res.json();
        if (!cancelled) setMatrix(data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <div style={{ padding: 16 }}>Loading RBAC matrix…</div>;
  if (error) return <div style={{ padding: 16, color: "#dc2626" }}>Error: {error}</div>;
  if (!matrix || !matrix.roles?.length) return <div style={{ padding: 16 }}>No roles configured.</div>;

  return (
    <table style={{ borderCollapse: "collapse", width: "100%" }}>
      <thead>
        <tr>
          <th style={cellStyle}>Permission</th>
          {matrix.roles.map((role) => (
            <th key={role} style={cellStyle}>{role}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {matrix.permissions.map((perm) => (
          <tr key={perm}>
            <td style={cellStyle}>{perm}</td>
            {matrix.roles.map((role) => (
              <td key={role + perm} style={{ ...cellStyle, textAlign: "center" }}>
                {matrix.grants?.[role]?.includes(perm) ? "✅" : "—"}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const cellStyle = { border: "1px solid #e5e7eb", padding: "8px 12px", fontSize: 14 };