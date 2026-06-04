import InspectionWorkspace from "@/components/InspectionWorkspace";
import type { AppRole } from "@/components/InspectionWorkspace";
import { readDatabase } from "@/services/database";
import type { Database } from "@/utils/types";

export const dynamic = "force-dynamic";

const emptyDatabase: Database = {
  properties: [],
  inspections: [],
  maintenanceIssues: [],
  vendors: [],
  scheduleTasks: [],
  ownerUpdates: []
};

function resolveInitialDemoRole(params: { demo?: string; role?: string } | undefined): AppRole | undefined {
  const demo = params?.demo?.toLowerCase();
  const role = params?.role?.toLowerCase();

  if (demo !== "true" && demo !== "admin" && demo !== "inspector" && demo !== "homeowner") {
    return undefined;
  }

  if (role === "inspector" || demo === "inspector") return "Inspector";
  if (role === "homeowner" || demo === "homeowner") return "Homeowner";

  return "Admin";
}

function resolveInitialRole(params: { demo?: string; role?: string } | undefined): AppRole | undefined {
  const demo = params?.demo?.toLowerCase();

  if (demo) return undefined;

  return undefined;
}

export default async function DemoPage({
  searchParams
}: {
  searchParams?: Promise<{ demo?: string; role?: string }>;
}) {
  const database = await readAppDatabase();
  const params = await searchParams;
  const initialDemoRole = resolveInitialDemoRole(params);
  const initialRole = resolveInitialRole(params);

  return <InspectionWorkspace initialDatabase={database} initialDemoRole={initialDemoRole} initialRole={initialRole} />;
}

async function readAppDatabase() {
  try {
    return await readDatabase();
  } catch (error) {
    console.error("EstateIQ app database load failed.", error);
    return emptyDatabase;
  }
}
