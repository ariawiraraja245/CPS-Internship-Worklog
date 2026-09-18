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

    const { category, problem, action, result, learning, status, actionPhoto, dueDate } = await req.json();

    if (!category || !problem || !action || !result || !learning || !status) {
      return NextResponse.json({ message: "Data tidak lengkap" }, { status: 400 });
    }

    const worklog = await prisma.worklog.create({
      data: {
        userId: (session.user as any).id,
        date: new Date(),
        category,
        problem,
        action,
        result,
        learning,
        dueDate: dueDate ? new Date(dueDate) : null,
        status,
        actionPhoto
      }
    });

    return NextResponse.json({ message: "Worklog berhasil disimpan" }, { status: 201 });
  } catch (error) {
    console.error("Worklog err:", error);
    return NextResponse.json({ message: "Terjadi kesalahan server" }, { status: 500 });
  }
}

// FEATURE: Edit Worklog
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id, problem, action, result, learning, status, dueDate } = await req.json();

    if (!id || !problem || !action || !result || !learning || !status) {
      return NextResponse.json({ message: "Data tidak lengkap" }, { status: 400 });
    }

    // Check ownership or admin status
    const existing = await prisma.worklog.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ message: "Worklog tidak ditemukan" }, { status: 404 });
    }

    const isAdmin = (session.user as any).role === "ADMIN";
    if (!isAdmin && existing.userId !== (session.user as any).id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.worklog.update({
      where: { id },
      data: {
        problem,
        action,
        result,
        learning,
        dueDate: dueDate ? new Date(dueDate) : null,
        status,
      }
    });

    return NextResponse.json({ message: "Berhasil diperbarui", data: updated });
  } catch (error) {
    return NextResponse.json({ message: "Terjadi kesalahan server" }, { status: 500 });
  }
}
