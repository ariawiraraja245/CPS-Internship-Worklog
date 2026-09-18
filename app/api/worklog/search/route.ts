import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username") || "";
    const date = searchParams.get("date") || "";
    const category = searchParams.get("category") || "";

    const role = (session.user as any).role;
    const userId = (session.user as any).id;

    let whereClause: any = {};

    if (role === "USER") {
      whereClause.userId = userId;
    } else if (username) {
      whereClause.user = { username: { contains: username } };
    }

    if (category) {
      whereClause.category = category;
    }

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      whereClause.date = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    const logs = await prisma.worklog.findMany({
      where: whereClause,
      include: {
        user: { select: { username: true } }
      },
      orderBy: { date: "desc" }
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error("Search err:", error);
    return NextResponse.json({ message: "Terjadi kesalahan server" }, { status: 500 });
  }
}
