import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PendingScreen } from "@/components/PendingScreen";
import { RevokedScreen } from "@/components/RevokedScreen";
import DashboardClient from "@/components/DashboardClient";

export const metadata = {
  title: "Dashboard | WorkSphere",
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const status = session.user.status;

  if (status === "PENDING") {
    return <PendingScreen />;
  }

  if (status === "REVOKED") {
    return <RevokedScreen />;
  }

  return <DashboardClient session={session} />;
}
