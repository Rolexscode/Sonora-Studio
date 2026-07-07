import { getSession, logout } from "@/app/auth-actions";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import PurchasesClient from "./PurchasesClient";

const prisma = new PrismaClient();

export default async function PurchasesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const purchases = await prisma.purchase.findMany({
    where: { userId: session.id },
    orderBy: { createdAt: "desc" },
  });

  return <PurchasesClient purchases={purchases} />;
}
