import InspectionWorkspace from "@/components/InspectionWorkspace";
import { readDatabase } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Home() {
  const database = await readDatabase();

  return <InspectionWorkspace initialDatabase={database} />;
}
