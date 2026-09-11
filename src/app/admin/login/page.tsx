import { prisma } from "@/lib/prisma";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" && sp.next.startsWith("/admin") ? sp.next : "";
  const users = await prisma.user.findMany({ select: { name: true }, orderBy: { createdAt: "asc" } });
  return <LoginForm next={next} users={users.map((u) => u.name)} />;
}
