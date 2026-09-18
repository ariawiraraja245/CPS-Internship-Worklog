"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return <div style={{ padding: "40px", textAlign: "center" }}>Memuat...</div>;
  }

  if (!session) {
    return null;
  }

  const role = (session.user as any).role;
  const username = (session.user as any).username;

  return (
    <div className="page-container">
      {/* Sidebar - Fitur Navigasi Role Based */}
      <aside className="sidebar">
        <div className="sidebar-header">CILOK System</div>
        <div style={{ padding: "16px 24px", fontSize: "14px", color: "#666" }}>
          Halo, {username} <br/>
          <span className={`badge ${role === "ADMIN" ? "badge-info" : "badge-success"}`}>
            {role}
          </span>
        </div>
        <nav className="sidebar-nav">
          <Link href="/dashboard" className={pathname === "/dashboard" ? "active" : ""}>
            Dashboard
          </Link>
          <Link href="/absensi" className={pathname.startsWith("/absensi") ? "active" : ""}>
            Absensi
          </Link>
          <Link href="/worklog/create" className={pathname === "/worklog/create" ? "active" : ""}>
            Pembuatan Worklog
          </Link>
          <Link href="/worklog/report" className={pathname === "/worklog/report" ? "active" : ""}>
            Worklog Report
          </Link>

          {role === "ADMIN" && (
            <Link href="/admin/users" className={pathname.startsWith("/admin/users") ? "active" : ""}>
              Manajemen Pengguna
            </Link>
          )}

          <button 
            className="btn-danger" 
            style={{ margin: "24px", marginTop: "auto" }}
            onClick={() => {
              sessionStorage.removeItem("cilok_tab_session");
              signOut({ callbackUrl: "/login" });
            }}
          >
            Keluar
          </button>
        </nav>
      </aside>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
