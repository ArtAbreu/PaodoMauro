import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { NavigationShell } from "@/components/navigation";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return <NavigationShell>{children}</NavigationShell>;
}
