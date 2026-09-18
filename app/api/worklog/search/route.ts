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
    const filterType = searchParams.get("filterType") || "all";
    const filterValue = searchParams.get("filterValue") || "";
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

    if (filterType !== "all" && filterValue) {
      if (filterType === "date") {
        const start = new Date(filterValue);
        start.setHours(0, 0, 0, 0);
        const end = new Date(filterValue);
        end.setHours(23, 59, 59, 999);
        whereClause.date = { gte: start, lte: end };
      } else if (filterType === "week") {
        const [yearStr, weekStr] = filterValue.split("-W");
        if (yearStr && weekStr) {
          const year = parseInt(yearStr);
          const week = parseInt(weekStr);
          const simple = new Date(year, 0, 1 + (week - 1) * 7);
          const dow = simple.getDay();
          const ISOweekStart = simple;
          if (dow <= 4) {
             ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
          } else {
             ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
          }
          const start = new Date(ISOweekStart);
          start.setHours(0, 0, 0, 0);
          const end = new Date(start);
          end.setDate(start.getDate() + 6);
          end.setHours(23, 59, 59, 999);
          whereClause.date = { gte: start, lte: end };
        }
      } else if (filterType === "month") {
        const [yearStr, monthStr] = filterValue.split("-");
        if (yearStr && monthStr) {
          const year = parseInt(yearStr);
          const month = parseInt(monthStr) - 1;
          const start = new Date(year, month, 1);
          const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
          whereClause.date = { gte: start, lte: end };
        }
      } else if (filterType === "year") {
        const year = parseInt(filterValue);
        if (!isNaN(year)) {
          const start = new Date(year, 0, 1);
          const end = new Date(year, 11, 31, 23, 59, 59, 999);
          whereClause.date = { gte: start, lte: end };
        }
      }
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
