import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { sendWorklogReportsToAdmin } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { attachments, targetEmail } = await req.json();

    if (!attachments || attachments.length === 0) {
      return NextResponse.json({ message: "Tidak ada laporan yang dipilih" }, { status: 400 });
    }

    // Process attachments to buffer from base64
    const mailAttachments = attachments.map((att: any) => {
      const base64Data = att.data.split(';base64,').pop();
      return {
        filename: att.filename,
        content: Buffer.from(base64Data, "base64"),
        contentType: "application/pdf"
      };
    });

    await sendWorklogReportsToAdmin(targetEmail || (session.user as any).email, mailAttachments);

    return NextResponse.json({ message: "Laporan berhasil dikirim ke email." });
  } catch (error) {
    console.error("Email err:", error);
    return NextResponse.json({ message: "Terjadi kesalahan server saat mengirim email" }, { status: 500 });
  }
}
