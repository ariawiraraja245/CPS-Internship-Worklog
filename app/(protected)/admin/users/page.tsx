"use client";

import { useState, useEffect } from "react";

export default function UserManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdate = async (userId: string, action: string, value: string) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action, value }),
      });

      if (res.ok) {
        setMessage("Berhasil memperbarui pengguna");
        fetchUsers();
      } else {
        const data = await res.json();
        setMessage(data.message || "Gagal memperbarui");
      }
    } catch (err) {
      setMessage("Terjadi kesalahan jaringan");
    }
  };

  return (
    <div>
      <div className="header">
        <h1>Manajemen Pengguna</h1>
      </div>

      <div className="card">
        {message && (
          <div className={message.includes("Berhasil") ? "success-msg" : "error-msg"}>
            {message}
          </div>
        )}
        
        {loading ? <p>Memuat data pengguna...</p> : (
          <table>
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Aksi Persetujuan</th>
                <th>Aksi Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>{u.username}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`badge ${u.role === "ADMIN" ? "badge-info" : "badge-warning"}`}>
                      {u.role}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${u.status === "APPROVED" ? "badge-success" : u.status === "REJECTED" ? "badge-danger" : "badge-warning"}`}>
                      {u.status}
                    </span>
                  </td>
                  <td>
                    {u.status === "PENDING" && (
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button className="btn-primary" style={{ padding: "4px 8px" }} onClick={() => handleUpdate(u.id, "status", "APPROVED")}>Setujui</button>
                        <button className="btn-danger" style={{ padding: "4px 8px" }} onClick={() => handleUpdate(u.id, "status", "REJECTED")}>Tolak</button>
                      </div>
                    )}
                    {u.status === "REJECTED" && (
                      <button className="btn-primary" style={{ padding: "4px 8px" }} onClick={() => handleUpdate(u.id, "status", "APPROVED")}>Setujui Ulang</button>
                    )}
                  </td>
                  <td>
                    {u.role === "USER" && u.status === "APPROVED" && (
                      <button className="btn-secondary" style={{ padding: "4px 8px" }} onClick={() => handleUpdate(u.id, "role", "ADMIN")}>Jadikan Admin</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
