import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { sendNewUserNotification } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { username, email, password } = await req.json();

    if (!username || !email || !password) {
      return NextResponse.json({ message: "Semua field harus diisi" }, { status: 400 });
    }

    // Check existing
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }]
      }
    });

    if (existingUser) {
      return NextResponse.json({ message: "Username atau Email sudah terdaftar" }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check total users to auto-approve first admin
    const totalUsers = await prisma.user.count();
    const isFirstUser = totalUsers === 0;

    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        role: isFirstUser ? "ADMIN" : "USER",
        status: isFirstUser ? "APPROVED" : "PENDING"
      }
    });

    // Notify admins if it's a new regular user
    if (!isFirstUser) {
      const admins = await prisma.user.findMany({ where: { role: "ADMIN" } });
      const adminEmails = admins.map(a => a.email);
      await sendNewUserNotification(adminEmails, newUser.username);
    }

    return NextResponse.json({ 
      message: "Registrasi berhasil. " + (isFirstUser ? "Anda adalah Admin pertama." : "Menunggu persetujuan Admin.") 
    }, { status: 201 });

  } catch (error) {
    console.error("Error in registration:", error);
    return NextResponse.json({ message: "Terjadi kesalahan server" }, { status: 500 });
  }
}
