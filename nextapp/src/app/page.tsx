import { PrismaClient } from "@prisma/client";
import StoreClient from "@/components/StoreClient";
import { getSession } from "./auth-actions";

const prisma = new PrismaClient();

export default async function Page() {
  const session = await getSession();
  const [products, categories] = await Promise.all([
    prisma.product.findMany({ include: { category: true } }),
    prisma.category.findMany({ orderBy: { name: "asc" } })
  ]);
  return <StoreClient initialProducts={products} categories={categories} session={session} />;
}
