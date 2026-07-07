import { PrismaClient } from "@prisma/client";
import StoreClient from "@/components/StoreClient";
import { getSession } from "./auth-actions";

const prisma = new PrismaClient();

export default async function Page() {
  const session = await getSession();
  const now = new Date();
  
  const [products, categories, activePromotions] = await Promise.all([
    prisma.product.findMany({ include: { category: true } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.promotion.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now }
      }
    })
  ]);
  
  return <StoreClient initialProducts={products} categories={categories} session={session} activePromotions={activePromotions} />;
}
