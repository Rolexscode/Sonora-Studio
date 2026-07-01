import { PrismaClient } from "@prisma/client";
import StoreClient from "@/components/StoreClient";
import { getSession } from "./auth-actions";

const prisma = new PrismaClient();

export default async function Page() {
  const session = await getSession();
  const products = await prisma.product.findMany();
  return <StoreClient initialProducts={products} session={session} />;
}
