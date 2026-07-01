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

  const products = await prisma.product.findMany();
  const purchases = await prisma.purchase.findMany({ orderBy: { createdAt: 'desc' }});

  return <AdminClient session={session} products={products} purchases={purchases} />;
}
