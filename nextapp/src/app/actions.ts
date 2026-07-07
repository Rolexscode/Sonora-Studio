"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

export async function addProduct(formData: FormData) {
  const name = formData.get("name") as string;
  const categoryId = parseInt(formData.get("categoryId") as string);
  const price = parseFloat(formData.get("price") as string);
  const rating = parseFloat(formData.get("rating") as string);
  const desc = formData.get("desc") as string;
  const image = (formData.get("image") as string) || "/assets/images/hero_bg_1782346378898.png";
  const inStock = formData.get("inStock") === "true";
  const stock = parseInt(formData.get("stock") as string) || 0;
  const isNew = formData.get("isNew") === "true";
  const specsRaw = formData.get("specs") as string;
  const specs = specsRaw || JSON.stringify({ "Nuevo": "Sí" });

  await prisma.product.create({
    data: { name, categoryId, price, rating, desc, inStock, stock, isNew, specs, image },
  });

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function updateProduct(id: number, formData: FormData) {
  const name = formData.get("name") as string;
  const categoryId = parseInt(formData.get("categoryId") as string);
  const price = parseFloat(formData.get("price") as string);
  const rating = parseFloat(formData.get("rating") as string);
  const desc = formData.get("desc") as string;
  const image = formData.get("image") as string;
  const inStock = formData.get("inStock") === "true";
  const stock = parseInt(formData.get("stock") as string) || 0;
  const isNew = formData.get("isNew") === "true";
  const specsRaw = formData.get("specs") as string;
  const specs = specsRaw || JSON.stringify({});

  await prisma.product.update({
    where: { id },
    data: { name, categoryId, price, rating, desc, inStock, stock, isNew, specs, image },
  });

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function deleteProduct(id: number) {
  await prisma.product.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function createPurchase(
  userId: number,
  items: { id: number; name: string; price: number; quantity: number }[],
  total: number
) {
  await prisma.purchase.create({
    data: { userId, total, items: JSON.stringify(items) },
  });

  for (const item of items) {
    const product = await prisma.product.findUnique({ where: { id: item.id } });
    if (product) {
      const newStock = Math.max(0, product.stock - item.quantity);
      await prisma.product.update({
        where: { id: item.id },
        data: { stock: newStock, inStock: newStock > 0 && product.inStock },
      });
    }
  }
  revalidatePath("/purchases");
  revalidatePath("/admin");
}

export async function updateUserRole(userId: number, role: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { role },
  });
  revalidatePath("/admin");
}

export async function addCategory(name: string) {
  await prisma.category.create({ data: { name } });
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function updateCategory(id: number, name: string) {
  await prisma.category.update({ where: { id }, data: { name } });
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function deleteCategory(id: number) {
  await prisma.category.delete({ where: { id } });
  revalidatePath("/admin");
  revalidatePath("/");
}
