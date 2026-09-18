"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const CATEGORIES = [
  "IT",
  "Chemical & Laboratory",
  "Instrument & Control",
  "Mechanical",
  "Corporate & General affair",
  "Health, Safety & Environment"
];

export default function CreateWorklogPage() {
  const router = useRouter();
  const [category, setCategory] = useState("");
  const [problem, setProblem] = useState("");
  const [action, setAction] = useState("");
  const [result, setResult] = useState("");
  const [learning, setLearning] = useState("");
  const [workStatus, setWorkStatus] = useState("Proses");
  const [dueDate, setDueDate] = useState("");
  const [actionPhoto, setActionPhoto] = useState<string | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if ((workStatus === "Proses" || workStatus === "Tertunda") && !dueDate) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setDueDate(tomorrow.toISOString().split("T")[0]);
    }
  }, [workStatus]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setActionPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !problem || !action || !result || !workStatus || !learning) {
      setMessage("Harap lengkapi semua field.");
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      const res = await fetch("/api/worklog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, problem, action, result, learning, status: workStatus, actionPhoto, dueDate }),
      });

      if (res.ok) {
        setMessage("Worklog berhasil disimpan!");
        setTimeout(() => router.push("/worklog/report"), 2000);
      } else {
        const data = await res.json();
        setMessage(data.message || "Gagal menyimpan worklog");
      }
    } catch (err) {
      setMessage("Terjadi kesalahan jaringan");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="header">
        <h1>Pembuatan Worklog</h1>
      </div>

      <div className="card" style={{ maxWidth: "600px" }}>
        {message && (
          <div className={message.includes("berhasil") ? "success-msg" : "error-msg"}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Fitur: Pemilihan Bidang Kategori */}
          <div className="form-group">
            <label>Pilih Kategori Bidang</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} required>
              <option value="" disabled>-- Pilih Kategori --</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Munculkan form lanjutan HANYA jika kategori sudah dipilih */}
          {category && (
            <div style={{ marginTop: "24px", borderTop: "1px solid var(--border-color)", paddingTop: "24px" }}>
              <div className="form-group">
                <label>Masalah</label>
                <textarea 
                  rows={3} 
                  value={problem} 
                  onChange={(e) => setProblem(e.target.value)} 
                  placeholder="Deskripsikan masalah..."
                  required 
                />
              </div>

              <div className="form-group">
                <label>Aksi</label>
                <textarea 
                  rows={3} 
                  value={action} 
                  onChange={(e) => setAction(e.target.value)} 
                  placeholder="Aksi yang dilakukan..."
                  required 
                />
              </div>

              <div className="form-group">
                <label>Upload Foto Aksi (Opsional - dari Galeri)</label>
                <input type="file" accept="image/*" onChange={handleFileChange} />
                {actionPhoto && (
                  <img src={actionPhoto} alt="Preview" style={{ width: "100%", maxHeight: "300px", objectFit: "contain", marginTop: "8px", borderRadius: "8px" }} />
                )}
              </div>

              <div className="form-group">
                <label>Hasil</label>
                <textarea 
                  rows={3} 
                  value={result} 
                  onChange={(e) => setResult(e.target.value)} 
                  placeholder="Hasil yang dicapai..."
                  required 
                />
              </div>

              <div className="form-group">
                <label>Apa yang kamu pelajari dari kegiatan hari ini?</label>
                <textarea 
                  rows={3} 
                  value={learning} 
                  onChange={(e) => setLearning(e.target.value)} 
                  placeholder="Ceritakan pelajaran atau insight baru..."
                  required 
                />
              </div>

              <div className="form-group">
                <label>Status Pekerjaan</label>
                <select value={workStatus} onChange={(e) => setWorkStatus(e.target.value)} required>
                  <option value="Proses">Proses</option>
                  <option value="Menunggu Persetujuan Admin">Selesai (Kirim untuk Persetujuan)</option>
                  <option value="Tertunda">Tertunda</option>
                </select>
              </div>

              {(workStatus === "Proses" || workStatus === "Tertunda") && (
                <div className="form-group">
                  <label>Target Selesai (Tenggat Waktu)</label>
                  <input 
                    type="date" 
                    value={dueDate} 
                    onChange={e => setDueDate(e.target.value)} 
                    required 
                  />
                  <small style={{ color: "var(--secondary-color)", marginTop: "4px", display: "block" }}>
                    Tentukan tanggal target penyelesaian (Default: Besok).
                  </small>
                </div>
              )}

              <div style={{ marginTop: "32px" }}>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? "Menyimpan..." : "Simpan Worklog"}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
