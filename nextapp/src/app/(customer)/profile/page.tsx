import { getSession } from "@/app/auth-actions";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import ProfileClient from "./ProfileClient";

const prisma = new PrismaClient();

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.id },
  });

  if (!user) redirect("/login");

  return <ProfileClient user={user} />;
}
