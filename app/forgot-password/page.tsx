"use client";

import { useState } from "react";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      
      if (res.ok) {
        toast.success(data.message);
        setEmail("");
      } else {
        toast.error(data.message || "Gagal memproses permintaan");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <Toaster position="top-right" />
      <div className="card auth-card">
        <h2>Lupa Password CILOK</h2>
        <p style={{ textAlign: "center", marginBottom: "16px", color: "#666" }}>
          Masukkan email Anda untuk mendapatkan link reset password.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="email"
              placeholder="Email Anda"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-primary" style={{ width: "100%" }} disabled={loading}>
            {loading ? "Memproses..." : "Kirim Link Reset"}
          </button>
        </form>
        <div className="auth-links">
          <Link href="/login">Kembali ke halaman Login</Link>
        </div>
      </div>
    </div>
  );
}
