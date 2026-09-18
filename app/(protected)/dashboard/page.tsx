import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect("/login");
  }

  const role = (session.user as any).role;
  const userId = (session.user as any).id;

  // Fitur: Ringkasan jumlah absensi dan worklog - Global(Admin) / Personal(User)
  let stats = { attendances: 0, worklogs: 0, users: 0 };

  if (role === "ADMIN") {
    stats.attendances = await prisma.attendance.count();
    stats.worklogs = await prisma.worklog.count();
    stats.users = await prisma.user.count({ where: { role: "USER" } });
  } else {
    stats.attendances = await prisma.attendance.count({ where: { userId } });
    stats.worklogs = await prisma.worklog.count({ where: { userId } });
  }

  return (
    <div>
      <div className="header">
        <h1>Dashboard</h1>
      </div>

      <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
        <div className="card" style={{ flex: "1", minWidth: "250px", borderTop: "4px solid var(--primary-color)" }}>
          <h3>Total Absensi</h3>
          <p style={{ fontSize: "36px", fontWeight: "bold", margin: "16px 0", color: "var(--primary-color)" }}>
            {stats.attendances}
          </p>
          <p style={{ fontSize: "14px", color: "#666" }}>
            {role === "ADMIN" ? "Semua Peserta" : "Bulan ini"}
          </p>
        </div>
        
        <div className="card" style={{ flex: "1", minWidth: "250px", borderTop: "4px solid var(--success)" }}>
          <h3>Total Worklog</h3>
          <p style={{ fontSize: "36px", fontWeight: "bold", margin: "16px 0", color: "var(--success)" }}>
            {stats.worklogs}
          </p>
          <p style={{ fontSize: "14px", color: "#666" }}>
            {role === "ADMIN" ? "Semua Laporan" : "Terkumpul"}
          </p>
        </div>

        {role === "ADMIN" && (
          <div className="card" style={{ flex: "1", minWidth: "250px", borderTop: "4px solid var(--warning)" }}>
            <h3>Total Peserta Magang</h3>
            <p style={{ fontSize: "36px", fontWeight: "bold", margin: "16px 0", color: "var(--warning)" }}>
              {stats.users}
            </p>
            <p style={{ fontSize: "14px", color: "#666" }}>
              Aktif & Menunggu Persetujuan
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
