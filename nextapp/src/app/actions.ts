"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

export async function addProduct(formData: FormData) {
  const name = formData.get("name") as string;
  const category = formData.get("category") as string;
  const price = parseFloat(formData.get("price") as string);
  const rating = parseFloat(formData.get("rating") as string);
  const desc = formData.get("desc") as string;

  await prisma.product.create({
    data: {
      name,
      category,
      price,
      rating,
      desc,
      inStock: true,
      isNew: true,
      specs: JSON.stringify({ "Nuevo": "Sí" }),
      image: "/assets/images/hero_bg_1782346378898.png"
    }
  });

  revalidatePath("/");
}

export async function createPurchase(userId: number, items: { id: number, name: string, price: number, quantity: number }[], total: number) {
  await prisma.purchase.create({
    data: {
      userId,
      total,
      items: JSON.stringify(items),
    }
  });
  revalidatePath("/purchases");
  revalidatePath("/admin");
}
export async function deleteProduct(id: number) {
  await prisma.product.delete({
    where: { id }
  });
  revalidatePath("/");
  revalidatePath("/admin");
}
