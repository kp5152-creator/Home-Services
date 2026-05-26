import InspectionWorkspace from "@/components/InspectionWorkspace";
import { readDatabase } from "@/services/database";

export const dynamic = "force-dynamic";

export default async function DemoPage() {
  const database = await readDatabase();

  return <InspectionWorkspace initialDatabase={database} />;
}
