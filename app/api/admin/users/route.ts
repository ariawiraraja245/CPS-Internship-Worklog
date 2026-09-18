import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        status: true,
      }
    });

    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ message: "Terjadi kesalahan server" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { userId, action, value } = await req.json();

    if (!userId || !action || !value) {
      return NextResponse.json({ message: "Data tidak lengkap" }, { status: 400 });
    }

    const updateData: any = {};
    if (action === "status") {
      updateData.status = value;
    } else if (action === "role") {
      updateData.role = value;
    }

    await prisma.user.update({
      where: { id: userId },
      data: updateData
    });

    return NextResponse.json({ message: "Berhasil diperbarui" });
  } catch (error) {
    return NextResponse.json({ message: "Terjadi kesalahan server" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { username, email, password, role, status } = await req.json();

    if (!username || !email || !password) {
      return NextResponse.json({ message: "Username, Email, dan Password wajib diisi" }, { status: 400 });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email }
        ]
      }
    });

    if (existingUser) {
      return NextResponse.json({ message: "Username atau Email sudah terdaftar" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        role: role || "USER",
        status: status || "APPROVED"
      }
    });

    return NextResponse.json({ message: "Berhasil menambahkan akun", data: newUser }, { status: 201 });
  } catch (error) {
    console.error("Add user err:", error);
    return NextResponse.json({ message: "Terjadi kesalahan server saat menambahkan akun" }, { status: 500 });
  }
}
