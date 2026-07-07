"use server";

import { getSession } from "@/app/auth-actions";
import { redirect } from "next/navigation";
import AdminClient from "./AdminClient";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function AdminPage() {
  const session = await getSession();

  if (!session || session.role !== "ADMIN") {
    redirect("/login");
  }

  const [products, purchases, users, categories, promotions] = await Promise.all([
    prisma.product.findMany({ include: { category: true } }),
    prisma.purchase.findMany({ include: { user: true }, orderBy: { createdAt: "desc" } }),
    prisma.user.findMany({
      include: { purchases: { select: { total: true } } },
      orderBy: { id: "desc" },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.promotion.findMany({ orderBy: { id: "desc" } }),
  ]);

  return (
    <AdminClient
      session={session}
      products={products}
      purchases={purchases}
      users={users}
      categories={categories}
      promotions={promotions}
    />
  );
}
