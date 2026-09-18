"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "react-hot-toast";
import { logoBase64 } from "@/lib/logoBase64";

const CATEGORIES = [
  "IT",
  "Chemical & Laboratory",
  "Instrument & Control",
  "Mechanical",
  "Corporate & General affair",
  "Health, Safety & Environment"
];

export default function WorklogReportPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const isAdmin = role === "ADMIN";

  const [logs, setLogs] = useState<any[]>([]);
  const [selectedLogs, setSelectedLogs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  // Filters
  const [filterUsername, setFilterUsername] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [dateFilterType, setDateFilterType] = useState("all");
  const [dateFilterValue, setDateFilterValue] = useState("");

  // Edit Modal State
  const [editLog, setEditLog] = useState<any>(null);
  const [editProblem, setEditProblem] = useState("");
  const [editAction, setEditAction] = useState("");
  const [editResult, setEditResult] = useState("");
  const [editLearning, setEditLearning] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [confirmApproveLog, setConfirmApproveLog] = useState<any>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterUsername) params.append("username", filterUsername);
      if (filterCategory) params.append("category", filterCategory);
      if (dateFilterType !== "all") {
        params.append("filterType", dateFilterType);
        params.append("filterValue", dateFilterValue);
      }

      const res = await fetch(`/api/worklog/search?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filterUsername, filterCategory, dateFilterType, dateFilterValue]);

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedLogs);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedLogs(newSelected);
  };

  const selectAll = () => {
    if (selectedLogs.size === logs.length) {
      setSelectedLogs(new Set());
    } else {
      setSelectedLogs(new Set(logs.map((l: any) => l.id)));
    }
  };

  const generatePDF = (logId: string) => {
    const log = logs.find(l => l.id === logId);
    if (!log) return;
    
    const doc = new jsPDF();
    
    // Header Line
    doc.setFillColor(242, 101, 34); // Cirebon Power Orange
    doc.rect(0, 0, 210, 5, "F");

    try {
      doc.addImage(logoBase64, "PNG", 14, 12, 50, 20);
    } catch (e) {
      console.warn("Could not add logo", e);
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(51, 51, 51);
    doc.text("Laporan Worklog", 195, 22, { align: "right" });
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text("Cirebon Power Internship", 195, 28, { align: "right" });

    // Divider
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 35, 195, 35);

    // Metadata section
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    doc.setFont("helvetica", "bold");
    doc.text("Nama Peserta", 14, 45);
    doc.text("Tanggal", 100, 45);
    doc.text("Kategori", 14, 55);
    doc.text("Status", 100, 55);

    doc.setFont("helvetica", "normal");
    doc.text(`: ${log.user.username}`, 40, 45);
    doc.text(`: ${new Date(log.date).toLocaleDateString("id-ID")}`, 120, 45);
    doc.text(`: ${log.category}`, 40, 55);
    
    // Status Badge Color simulation
    let statusColor = [51, 51, 51];
    if (log.status === "Selesai" || log.status === "APPROVED") statusColor = [40, 167, 69];
    else if (log.status === "Tertunda" || log.status === "REJECTED") statusColor = [220, 53, 69];
    else statusColor = [255, 193, 7]; // Warning
    
    // @ts-ignore
    doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.setFont("helvetica", "bold");
    doc.text(`: ${log.status}`, 120, 55);

    doc.setTextColor(50, 50, 50); // reset

    // Table
    autoTable(doc, {
      startY: 65,
      theme: 'grid',
      headStyles: { fillColor: [242, 101, 34], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 10, cellPadding: 6 },
      columnStyles: {
        0: { cellWidth: 30, fontStyle: 'bold' },
        1: { cellWidth: 'auto' }
      },
      head: [['Field', 'Deskripsi Worklog']],
      body: [
        ['Masalah', log.problem],
        ['Aksi', log.action],
        ['Hasil', log.result],
        ['Pelajaran', log.learning || '-'],
      ],
    });

    let currentY = (doc as any).lastAutoTable.finalY + 15;
    
    if (log.actionPhoto) {
      if (currentY + 100 > 280) {
        doc.addPage();
        currentY = 20;
      }
      doc.setFont("helvetica", "bold");
      doc.text("Bukti Foto Aksi:", 14, currentY);
      try {
        doc.addImage(log.actionPhoto, "JPEG", 14, currentY + 5, 100, 100);
      } catch(e) {
        doc.setFont("helvetica", "normal");
        doc.text("(Foto tidak dapat dirender di PDF)", 14, currentY + 10);
      }
    }

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Dicetak dari Sistem CILOK - Cirebon Power | Halaman ${i} dari ${pageCount}`, 105, 290, { align: "center" });
    }

    return doc;
  };

  const handleDownloadSelected = () => {
    selectedLogs.forEach(id => {
      const doc = generatePDF(id);
      const log = logs.find(l => l.id === id);
      if (doc && log) {
        const safeCategory = log.category.replace(/[^a-zA-Z0-9]/g, '_');
        doc.save(`Worklog_${log.user.username}_${safeCategory}_${new Date(log.date).toISOString().split('T')[0]}.pdf`);
      }
    });
  };

  const handleEmailSelected = async () => {
    setLoading(true);
    try {
      const attachments = Array.from(selectedLogs).map(id => {
        const doc = generatePDF(id);
        const log = logs.find(l => l.id === id);
        if (doc && log) {
          const safeCategory = log.category.replace(/[^a-zA-Z0-9]/g, '_');
          const filename = `Worklog_${log.user.username}_${safeCategory}_${new Date(log.date).toISOString().split('T')[0]}.pdf`;
          // Output the PDF as datauri string (base64)
          const dataUri = doc.output('datauristring');
          return { filename, data: dataUri };
        }
        return null;
      }).filter(Boolean);

      const res = await fetch("/api/worklog/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attachments }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Laporan berhasil dikirim");
      } else {
        toast.error(data.message || "Gagal mengirim laporan");
      }
    } catch (e) {
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (log: any) => {
    setEditLog(log);
    setEditProblem(log.problem);
    setEditAction(log.action);
    setEditResult(log.result);
    setEditLearning(log.learning || "");
    setEditStatus(log.status);
  };

  const closeEditModal = () => {
    setEditLog(null);
  };

  const handleSaveEdit = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/worklog", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editLog.id,
          problem: editProblem,
          action: editAction,
          result: editResult,
          learning: editLearning,
          status: editStatus,
        }),
      });
      if (res.ok) {
        toast.success("Worklog berhasil diperbarui");
        closeEditModal();
        fetchLogs();
      } else {
        const data = await res.json();
        toast.error(data.message);
      }
    } catch (e) {
      toast.error("Terjadi kesalahan saat menyimpan");
    } finally {
      setIsSaving(false);
    }
  };

  const handleApproveWorklog = async (log: any) => {
    try {
      const res = await fetch("/api/worklog", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: log.id,
          problem: log.problem,
          action: log.action,
          result: log.result,
          learning: log.learning,
          status: "Selesai",
        }),
      });
      if (res.ok) {
        toast.success("Worklog disetujui (Selesai)");
        fetchLogs();
      } else {
        toast.error("Gagal menyetujui worklog");
      }
    } catch (e) {
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setConfirmApproveLog(null);
    }
  };

  return (
    <div>
      <div className="header">
        <h1>Worklog Report</h1>
      </div>

      <div className="card" style={{ marginBottom: "24px" }}>
        <h3>Filter Pencarian</h3>
        <div style={{ display: "flex", gap: "16px", marginTop: "16px", flexWrap: "wrap", alignItems: "center" }}>
          {isAdmin && (
            <input 
              type="text" 
              placeholder="Nama User" 
              value={filterUsername} 
              onChange={e => setFilterUsername(e.target.value)}
              style={{ width: "150px", marginBottom: 0 }}
            />
          )}
          <select 
            value={filterCategory} 
            onChange={e => setFilterCategory(e.target.value)}
            style={{ width: "180px", marginBottom: 0 }}
          >
            <option value="">Semua Kategori</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          
          <select 
            value={dateFilterType} 
            onChange={e => {
              setDateFilterType(e.target.value);
              setDateFilterValue("");
            }}
            style={{ width: "150px", marginBottom: 0 }}
          >
            <option value="all">Semua Waktu</option>
            <option value="date">Harian</option>
            <option value="week">Mingguan</option>
            <option value="month">Bulanan</option>
            <option value="year">Tahunan</option>
          </select>

          {dateFilterType !== "all" && (
            <input 
              type={dateFilterType === "year" ? "number" : dateFilterType}
              min={dateFilterType === "year" ? "2000" : undefined}
              max={dateFilterType === "year" ? "2100" : undefined}
              placeholder={dateFilterType === "year" ? "YYYY" : undefined}
              value={dateFilterValue} 
              onChange={e => setDateFilterValue(e.target.value)}
              style={{ width: "180px", marginBottom: 0 }}
            />
          )}
        </div>
      </div>

      {isAdmin && selectedLogs.size > 0 && (
        <div style={{ marginBottom: "16px", display: "flex", gap: "16px" }}>
          <button className="btn-secondary" onClick={handleDownloadSelected}>
            Download PDF ({selectedLogs.size})
          </button>
          <button className="btn-secondary" onClick={handleEmailSelected} disabled={loading}>
            {loading ? "Mengirim..." : `Kirim ke Email (${selectedLogs.size})`}
          </button>
        </div>
      )}

      <div className="card" style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              {isAdmin && (
                <th>
                  <input 
                    type="checkbox" 
                    checked={logs.length > 0 && selectedLogs.size === logs.length}
                    onChange={selectAll}
                  />
                </th>
              )}
              <th>Tanggal</th>
              {isAdmin && <th>Nama Peserta</th>}
              <th>Kategori</th>
              <th>Masalah</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 7 : 5} style={{ textAlign: "center" }}>Tidak ada data worklog.</td>
              </tr>
            ) : (
              logs.map(log => (
                <tr key={log.id}>
                  {isAdmin && (
                    <td>
                      <input 
                        type="checkbox" 
                        checked={selectedLogs.has(log.id)}
                        onChange={() => toggleSelect(log.id)}
                      />
                    </td>
                  )}
                  <td>{new Date(log.date).toLocaleDateString("id-ID")}</td>
                  {isAdmin && <td>{log.user.username}</td>}
                  <td>{log.category}</td>
                  <td style={{ maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {log.problem}
                  </td>
                  <td>
                    <span className={`badge ${
                      log.status === 'Selesai' ? 'badge-success' : 
                      log.status === 'Menunggu Persetujuan Admin' ? 'badge-warning' : 
                      log.status === 'Tertunda' ? 'badge-danger' : 'badge-info'
                    }`}>
                      {log.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "8px", flexDirection: "column" }}>
                      <button className="btn-secondary" style={{ padding: "6px 12px", fontSize: "12px" }} onClick={() => openEditModal(log)}>
                        Detail / Edit
                      </button>
                      
                      {isAdmin && log.status === "Menunggu Persetujuan Admin" && (
                        <button className="btn-primary" style={{ padding: "6px 12px", fontSize: "12px", backgroundColor: "#52c41a" }} onClick={() => {
                          setConfirmApproveLog(log);
                        }}>
                          Approve
                        </button>
                      )}

                      <button className="btn-primary" style={{ padding: "6px 12px", fontSize: "12px" }} onClick={() => {
                        const doc = generatePDF(log.id);
                        if (doc) {
                          const safeCategory = log.category.replace(/[^a-zA-Z0-9]/g, '_');
                          doc.save(`Worklog_${log.user?.username}_${safeCategory}_${new Date(log.date).toISOString().split('T')[0]}.pdf`);
                        }
                      }}>
                        Unduh PDF
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editLog && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
        }}>
          <div className="card" style={{ width: "90%", maxWidth: "600px", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2>Detail & Edit Worklog</h2>
              <button onClick={closeEditModal} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }}>✖</button>
            </div>
            
            <div className="form-group">
              <label>Masalah</label>
              <textarea rows={2} value={editProblem} onChange={(e) => setEditProblem(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Aksi</label>
              <textarea rows={2} value={editAction} onChange={(e) => setEditAction(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Hasil</label>
              <textarea rows={2} value={editResult} onChange={(e) => setEditResult(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Apa yang dipelajari?</label>
              <textarea rows={2} value={editLearning} onChange={(e) => setEditLearning(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                <option value="Proses">Proses</option>
                <option value="Menunggu Persetujuan Admin">Selesai (Menunggu Persetujuan)</option>
                <option value="Tertunda">Tertunda</option>
                {isAdmin && <option value="Selesai">Selesai (Disetujui)</option>}
              </select>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
              <button className="btn-secondary" onClick={closeEditModal}>Batal</button>
              <button className="btn-primary" onClick={handleSaveEdit} disabled={isSaving}>
                {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Approval */}
      {confirmApproveLog && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100
        }}>
          <div className="card" style={{ width: "90%", maxWidth: "400px", textAlign: "center" }}>
            <h3 style={{ marginBottom: "16px", color: "var(--primary-color)" }}>Konfirmasi Persetujuan</h3>
            <p style={{ marginBottom: "24px", color: "var(--text-dark)" }}>
              Apakah worklog dari <strong>{confirmApproveLog.user?.username}</strong> sudah selesai dan siap disetujui?
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
              <button className="btn-secondary" onClick={() => setConfirmApproveLog(null)}>
                Batal
              </button>
              <button className="btn-primary" style={{ backgroundColor: "#52c41a" }} onClick={() => handleApproveWorklog(confirmApproveLog)}>
                Ya, Setujui
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
