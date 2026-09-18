"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import { useRouter } from "next/navigation";

export default function AbsensiPage() {
  const router = useRouter();
  const webcamRef = useRef<Webcam>(null);
  const [photoData, setPhotoData] = useState<string | null>(null);
  const [status, setStatus] = useState("Hadir"); // Hadir or Izin
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<any[]>([]);
  const [hasAttendedToday, setHasAttendedToday] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch("/api/attendance/history");
        if (res.ok) {
          const data = await res.json();
          setHistory(data);

          // Check if already attended today
          const today = new Date().toISOString().split("T")[0];
          const todayAttendance = data.find((a: any) => new Date(a.date).toISOString().split("T")[0] === today);
          if (todayAttendance) {
            setHasAttendedToday(true);
          }
        }
      } catch (e) {
        console.error("Gagal mengambil riwayat", e);
      }
    };
    fetchHistory();
  }, []);

  // Fitur: Ambil Foto Absen (Live Camera)
  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setPhotoData(imageSrc);
    }
  }, [webcamRef]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "Hadir" && !photoData) {
      setMessage("Foto bukti kehadiran wajib diambil!");
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: status.toUpperCase(), photoData }),
      });

      if (res.ok) {
        setMessage("Berhasil melakukan absensi!");
        setHasAttendedToday(true);
        // Refresh history
        const historyRes = await fetch("/api/attendance/history");
        if (historyRes.ok) {
          setHistory(await historyRes.json());
        }
      } else {
        const data = await res.json();
        setMessage(data.message || "Gagal menyimpan absensi");
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
        <h1>Absensi Harian</h1>
      </div>

      <div className="card" style={{ maxWidth: "600px", margin: "0 auto" }}>
        {hasAttendedToday ? (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <h2 style={{ color: "#28a745", marginBottom: "16px" }}>✅ Anda sudah melakukan absensi hari ini</h2>
            <p>Terima kasih atas kehadiran Anda.</p>
          </div>
        ) : (
          <>
            {message && (
              <div className={message.includes("Berhasil") ? "success-msg" : "error-msg"}>
                {message}
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Status Kehadiran</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="Hadir">Hadir</option>
                  <option value="Izin">Izin / Sakit</option>
                </select>
              </div>

              {status === "Hadir" && (
                <div className="form-group" style={{ textAlign: "center" }}>
                  <label>Foto Bukti Kehadiran (Live Camera)</label>
                  {!photoData ? (
                    <div style={{ position: "relative", borderRadius: "12px", overflow: "hidden", border: "2px dashed #ccc", padding: "8px" }}>
                      <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        videoConstraints={{ facingMode: "user" }}
                        style={{ width: "100%", borderRadius: "8px" }}
                      />
                      <button 
                        type="button" 
                        onClick={capture}
                        className="btn-primary"
                        style={{ marginTop: "16px", width: "100%" }}
                      >
                        Ambil Foto
                      </button>
                    </div>
                  ) : (
                    <div style={{ position: "relative" }}>
                      <img src={photoData} alt="Bukti Hadir" style={{ width: "100%", borderRadius: "12px" }} />
                      <button 
                        type="button"
                        onClick={() => setPhotoData(null)}
                        className="btn-danger"
                        style={{ marginTop: "16px", width: "100%" }}
                      >
                        Ulangi Foto
                      </button>
                    </div>
                  )}
                </div>
              )}

              <button 
                type="submit" 
                className="btn-primary" 
                style={{ width: "100%", marginTop: "16px" }}
                disabled={isSubmitting || (status === "Hadir" && !photoData)}
              >
                {isSubmitting ? "Mengirim..." : "Kirim Absensi"}
              </button>
            </form>
          </>
        )}
      </div>

      <div className="card" style={{ maxWidth: "600px", margin: "24px auto 0" }}>
        <h3>Riwayat Absensi</h3>
        <table style={{ marginTop: "16px", width: "100%" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left" }}>Tanggal</th>
              <th style={{ textAlign: "left" }}>Waktu</th>
              <th style={{ textAlign: "left" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ textAlign: "center", padding: "16px" }}>Belum ada riwayat absensi.</td>
              </tr>
            ) : (
              history.map((record) => {
                const dateObj = new Date(record.date);
                return (
                  <tr key={record.id}>
                    <td>{dateObj.toLocaleDateString("id-ID")}</td>
                    <td>{dateObj.toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })}</td>
                    <td>
                      <span className={`badge ${record.status === 'HADIR' ? 'badge-success' : 'badge-warning'}`}>
                        {record.status}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
