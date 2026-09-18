import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { status, photoData } = await req.json();
    const userId = (session.user as any).id;

    if (status === "HADIR" && !photoData) {
      return NextResponse.json({ message: "Foto wajib disertakan jika hadir" }, { status: 400 });
    }

    // Check if already submitted today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await prisma.attendance.findFirst({
      where: {
        userId: userId,
        date: {
          gte: today,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ message: "Anda sudah melakukan absensi hari ini." }, { status: 400 });
    }

    await prisma.attendance.create({
      data: {
        userId,
        status,
        photoData,
      },
    });

    return NextResponse.json({ message: "Absensi berhasil" }, { status: 201 });
  } catch (error) {
    console.error("Attendance err:", error);
    return NextResponse.json({ message: "Terjadi kesalahan server" }, { status: 500 });
  }
}
