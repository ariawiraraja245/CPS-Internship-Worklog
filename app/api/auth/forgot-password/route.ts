import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ message: "Email wajib diisi" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Return 200 even if not found to prevent email enumeration
      return NextResponse.json({ message: "Jika email terdaftar, link reset telah dikirim." });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 3600000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: token,
        resetTokenExpiry: expiry,
      }
    });

    // In production this should be the actual domain
    const resetUrl = `http://localhost:3000/reset-password?token=${token}`;
    
    await sendPasswordResetEmail(user.email, resetUrl);

    return NextResponse.json({ message: "Jika email terdaftar, link reset telah dikirim." });
  } catch (error) {
    return NextResponse.json({ message: "Terjadi kesalahan server" }, { status: 500 });
  }
}
