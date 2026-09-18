import nodemailer from "nodemailer";

// Dummy SMTP configuration using Ethereal (https://ethereal.email/)
// In a real application, replace these with real SMTP credentials (e.g. SendGrid, Gmail)
const getTransporter = async () => {
  // If no env vars provided, create a test account on the fly for development
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
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

export async function sendNewUserNotification(adminEmails: string[], newUsername: string) {
  if (adminEmails.length === 0) return;
  
  const transporter = await getTransporter();
  
  const info = await transporter.sendMail({
    from: '"LOGIS System" <noreply@logis.app>',
    to: adminEmails.join(", "),
    subject: "Notifikasi: Pendaftar Akun Baru",
    text: `Halo Admin, \n\nAda pengguna baru dengan username "${newUsername}" yang mendaftar dan menunggu persetujuan Anda.\nSilakan login ke panel Admin untuk menyetujui akun tersebut.`,
    html: `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2>Pendaftar Akun Baru</h2>
        <p>Halo Admin,</p>
        <p>Ada pengguna baru dengan username <strong>${newUsername}</strong> yang mendaftar dan menunggu persetujuan Anda.</p>
        <p>Silakan login ke panel Admin untuk menyetujui akun tersebut.</p>
      </div>
    `,
  });

  console.log("Notifikasi email terkirim: %s", info.messageId);
  // Log URL to view the ethereal dummy email
  if (info.messageId && !process.env.SMTP_USER) {
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  }
}

export async function sendWorklogReportsToAdmin(adminEmail: string, attachments: any[]) {
  const transporter = await getTransporter();
  
  const info = await transporter.sendMail({
    from: '"LOGIS System" <noreply@logis.app>',
    to: adminEmail,
    subject: "Laporan Worklog Mingguan",
    text: `Halo Admin, \n\nBerikut terlampir laporan worklog terbaru.`,
    html: `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2>Laporan Worklog Mingguan</h2>
        <p>Halo Admin,</p>
        <p>Berikut terlampir laporan worklog yang Anda minta/jadwalkan.</p>
      </div>
    `,
    attachments,
  });

  console.log("Report email terkirim: %s", info.messageId);
  if (info.messageId && !process.env.SMTP_USER) {
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  }
}

export async function sendPasswordResetEmail(email: string, resetLink: string) {
  const transporter = await getTransporter();
  
  const info = await transporter.sendMail({
    from: '"CILOK System" <noreply@logis.app>',
    to: email,
    subject: "Reset Password CILOK System",
    text: `Halo,\n\nAnda meminta reset password. Klik link berikut untuk membuat password baru:\n\n${resetLink}\n\nJika Anda tidak memintanya, abaikan email ini.`,
    html: `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2>Reset Password CILOK System</h2>
        <p>Halo,</p>
        <p>Anda meminta untuk mengatur ulang (reset) password akun Anda.</p>
        <p>Silakan klik tombol di bawah ini untuk membuat password baru:</p>
        <a href="${resetLink}" style="display:inline-block; padding:10px 20px; background-color:#007bff; color:white; text-decoration:none; border-radius:5px;">Reset Password</a>
        <br><br>
        <p>Jika Anda tidak pernah memintanya, abaikan email ini.</p>
      </div>
    `,
  });

  console.log("Reset password email terkirim: %s", info.messageId);
  if (info.messageId && !process.env.SMTP_USER) {
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  }
}
