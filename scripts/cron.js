const cron = require("node-cron");
const { PrismaClient } = require("@prisma/client");
const nodemailer = require("nodemailer");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const prisma = new PrismaClient();

// Setup Nodemailer
const getTransporter = async () => {
  if (!process.env.SMTP_USER) {
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const generateAndSendReport = async () => {
  try {
    console.log("Mulai memproses laporan mingguan...");

    // Ambil tanggal 7 hari yang lalu
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Ambil worklog 7 hari terakhir
    const logs = await prisma.worklog.findMany({
      where: {
        date: {
          gte: oneWeekAgo,
        },
      },
      include: {
        user: true,
      },
      orderBy: {
        date: "desc",
      },
    });

    if (logs.length === 0) {
      console.log("Tidak ada worklog dalam 7 hari terakhir. Email dibatalkan.");
      return;
    }

    // Buat PDF
    const doc = new PDFDocument();
    const pdfPath = path.join(__dirname, "Laporan_Mingguan.pdf");
    const writeStream = fs.createWriteStream(pdfPath);
    doc.pipe(writeStream);

    // Add Logo
    const logoPath = path.join(__dirname, "..", "public", "logo.png");
    if (fs.existsSync(logoPath)) {
      // Menambahkan logo di tengah atas
      doc.image(logoPath, (doc.page.width - 200) / 2, 30, { width: 200 });
      doc.moveDown(5); // Memberi jarak agar teks tidak bertumpuk dengan gambar
    } else {
      doc.moveDown(2);
    }

    doc.fontSize(20).text("Laporan Worklog Mingguan", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`Periode: ${oneWeekAgo.toLocaleDateString("id-ID")} - ${new Date().toLocaleDateString("id-ID")}`, { align: "center" });
    doc.moveDown();
    doc.moveDown();

    logs.forEach((log, index) => {
      doc.fontSize(14).text(`${index + 1}. ${log.user.username} - ${log.category}`);
      doc.fontSize(10).text(`Tanggal: ${new Date(log.date).toLocaleDateString("id-ID")}`);
      doc.text(`Status: ${log.status}`);
      doc.text(`Masalah: ${log.problem}`);
      doc.text(`Aksi: ${log.action}`);
      doc.text(`Hasil: ${log.result}`);
      doc.text(`Pelajaran: ${log.learning || "-"}`);
      doc.moveDown();
    });

    doc.end();

    writeStream.on("finish", async () => {
      // Ambil semua admin email
      const admins = await prisma.user.findMany({
        where: { role: "ADMIN", status: "APPROVED" }
      });

      if (admins.length === 0) {
        console.log("Tidak ada admin ditemukan untuk dikirimi email.");
        return;
      }

      const adminEmails = admins.map(a => a.email);
      const transporter = await getTransporter();

      const info = await transporter.sendMail({
        from: '"CILOK System" <noreply@logis.app>',
        to: adminEmails.join(", "),
        subject: "Laporan Worklog Mingguan",
        text: "Terlampir laporan worklog mingguan peserta magang.",
        attachments: [
          {
            filename: "Laporan_Mingguan.pdf",
            path: pdfPath,
            contentType: "application/pdf"
          }
        ]
      });

      console.log("Laporan mingguan terkirim:", info.messageId);
    });

  } catch (error) {
    console.error("Gagal memproses laporan mingguan:", error);
  }
};

// Jadwal: Setiap hari Rabu (3) jam 08:00
cron.schedule("0 8 * * 3", () => {
  generateAndSendReport();
});

console.log("Cron job aktif: Menunggu hari Rabu jam 08:00...");

// Untuk testing langsung, uncomment baris di bawah:
// generateAndSendReport();
