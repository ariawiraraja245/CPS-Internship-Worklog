"use client";

import { useState, useEffect } from "react";

export default function UserManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Add User State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("USER");
  const [newStatus, setNewStatus] = useState("APPROVED");
  const [isAdding, setIsAdding] = useState(false);

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

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    setMessage("");

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: newUsername,
          email: newEmail,
          password: newPassword,
          role: newRole,
          status: newStatus
        }),
      });

      if (res.ok) {
        setMessage("Berhasil menambahkan akun baru!");
        setShowAddModal(false);
        setNewUsername("");
        setNewEmail("");
        setNewPassword("");
        fetchUsers();
      } else {
        const data = await res.json();
        setMessage(data.message || "Gagal menambahkan akun");
      }
    } catch (err) {
      setMessage("Terjadi kesalahan saat menambah akun");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div>
      <div className="header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Manajemen Pengguna</h1>
        <button className="btn-primary" onClick={() => setShowAddModal(true)}>
          + Tambah Akun
        </button>
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

      {showAddModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100
        }}>
          <div className="card" style={{ width: "90%", maxWidth: "450px" }}>
            <h3 style={{ marginBottom: "16px", color: "var(--primary-color)" }}>Tambah Akun Baru</h3>
            <form onSubmit={handleAddUser}>
              <div className="form-group">
                <label>Username</label>
                <input type="text" value={newUsername} onChange={e => setNewUsername(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select value={newRole} onChange={e => setNewRole(e.target.value)}>
                  <option value="USER">User (Peserta)</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                  <option value="APPROVED">Disetujui (Approved)</option>
                  <option value="PENDING">Menunggu (Pending)</option>
                </select>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>
                  Batal
                </button>
                <button type="submit" className="btn-primary" disabled={isAdding}>
                  {isAdding ? "Menyimpan..." : "Simpan Akun"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
