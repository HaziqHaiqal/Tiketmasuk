import OrganiserDashboard from "@/components/OrganiserDashboard";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function OrganiserPage() {
  const { userId } = await auth();
  if (!userId) redirect("/");

  return (
    <div className="min-h-screen bg-gray-50">
      <OrganiserDashboard />
    </div>
  );
}
