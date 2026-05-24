import { promises as fs } from "fs";
import path from "path";
import type { Database, Inspection, InspectionPhoto, MaintenanceIssue, Property } from "@/lib/types";
import { hasSupabaseConfig, storageBucket, supabaseAdmin } from "@/lib/supabaseAdmin";

const dbPath = path.join(process.cwd(), "data", "db.json");
const uploadsRoot = path.join(process.cwd(), "public", "uploads", "inspections");

export type PhotoUpload = {
  name: string;
  type: string;
  data: string;
};

export async function readDatabase(): Promise<Database> {
  if (hasSupabaseConfig()) {
    return readSupabaseDatabase();
  }

  const raw = await fs.readFile(dbPath, "utf8");
  const database = JSON.parse(raw) as Database;
  return {
    properties: database.properties,
    maintenanceIssues: database.maintenanceIssues ?? [],
    inspections: database.inspections.map((inspection) => ({
      ...inspection,
      photos: (inspection.photos ?? []).map((photo) => ({
        ...photo,
        url: normalizePhotoUrl(photo.url)
      }))
    }))
  };
}

async function writeDatabase(database: Database) {
  await fs.writeFile(dbPath, JSON.stringify(database, null, 2));
}

export async function addProperty(property: Omit<Property, "id" | "status">) {
  if (hasSupabaseConfig()) {
    return addSupabaseProperty(property);
  }

  const database = await readDatabase();
  const newProperty: Property = {
    id: `property-${Date.now()}`,
    status: "Active",
    ...property
  };

  database.properties.unshift(newProperty);
  await writeDatabase(database);
  return newProperty;
}

export async function addInspection(
  inspection: Omit<Inspection, "id" | "timestamp" | "photos"> & {
    photos: PhotoUpload[] | InspectionPhoto[];
  }
) {
  if (hasSupabaseConfig()) {
    return addSupabaseInspection(inspection);
  }

  const database = await readDatabase();
  const inspectionId = `inspection-${Date.now()}`;
  const photos = await saveInspectionPhotos(inspectionId, inspection.photos);
  const newInspection: Inspection = {
    id: inspectionId,
    timestamp: new Date().toISOString(),
    ...inspection,
    photos
  };

  database.inspections.unshift(newInspection);
  await writeDatabase(database);
  return newInspection;
}

export async function addMaintenanceIssue(issue: Omit<MaintenanceIssue, "id" | "createdAt">) {
  if (hasSupabaseConfig()) {
    return addSupabaseMaintenanceIssue(issue);
  }

  const database = await readDatabase();
  const newIssue: MaintenanceIssue = {
    id: `issue-${Date.now()}`,
    createdAt: new Date().toISOString(),
    ...issue
  };

  database.maintenanceIssues = [newIssue, ...(database.maintenanceIssues ?? [])];
  await writeDatabase(database);
  return newIssue;
}

async function saveInspectionPhotos(inspectionId: string, photos: PhotoUpload[] | InspectionPhoto[]) {
  if (!photos.length) return [];

  const inspectionUploadDir = path.join(uploadsRoot, inspectionId);
  await fs.mkdir(inspectionUploadDir, { recursive: true });

  const savedPhotos: InspectionPhoto[] = [];

  for (const [index, photo] of photos.entries()) {
    if (!("data" in photo)) {
      savedPhotos.push(photo);
      continue;
    }

    const safeBaseName = photo.name
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-z0-9-_]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase();
    const filename = `${index + 1}-${safeBaseName || "inspection-photo"}.jpg`;
    const filePath = path.join(inspectionUploadDir, filename);
    const base64 = photo.data.includes(",") ? photo.data.split(",").pop() ?? "" : photo.data;
    const buffer = Buffer.from(base64, "base64");

    await fs.writeFile(filePath, buffer);
    savedPhotos.push({
      id: `photo-${inspectionId}-${index + 1}`,
      name: photo.name,
      url: `/api/photos/${inspectionId}/${filename}`,
      mimeType: "image/jpeg",
      size: buffer.byteLength
    });
  }

  return savedPhotos;
}

function normalizePhotoUrl(url: string) {
  if (url.startsWith("/api/photos/")) {
    return url;
  }

  return url.replace("/uploads/inspections/", "/api/photos/");
}

export async function deleteProperty(propertyId: string) {
  if (hasSupabaseConfig()) {
    return deleteSupabaseProperty(propertyId);
  }

  const database = await readDatabase();
  const propertyExists = database.properties.some((property) => property.id === propertyId);

  if (!propertyExists) {
    return null;
  }

  const nextDatabase: Database = {
    properties: database.properties.filter((property) => property.id !== propertyId),
    inspections: database.inspections.filter((inspection) => inspection.propertyId !== propertyId),
    maintenanceIssues: (database.maintenanceIssues ?? []).filter((issue) => issue.propertyId !== propertyId)
  };

  await Promise.all(
    database.inspections
      .filter((inspection) => inspection.propertyId === propertyId)
      .map((inspection) => fs.rm(path.join(uploadsRoot, inspection.id), { force: true, recursive: true }))
  );
  await writeDatabase(nextDatabase);
  return nextDatabase;
}

export async function readPhotoAsset(inspectionId: string, filename: string) {
  if (hasSupabaseConfig()) {
    const supabase = supabaseAdmin();
    const { data, error } = await supabase.storage.from(storageBucket()).download(`${inspectionId}/${filename}`);

    if (error || !data) {
      return null;
    }

    const buffer = Buffer.from(await data.arrayBuffer());
    return {
      buffer,
      contentType: contentTypeForFilename(filename)
    };
  }

  const photoPath = path.join(uploadsRoot, inspectionId, filename);
  const resolvedPhotoPath = path.resolve(photoPath);

  if (!resolvedPhotoPath.startsWith(path.resolve(uploadsRoot))) {
    return null;
  }

  try {
    const buffer = await fs.readFile(resolvedPhotoPath);
    return {
      buffer,
      contentType: contentTypeForFilename(filename)
    };
  } catch {
    return null;
  }
}

async function readSupabaseDatabase(): Promise<Database> {
  const supabase = supabaseAdmin();
  const [
    { data: properties, error: propertiesError },
    { data: inspections, error: inspectionsError },
    { data: maintenanceIssues, error: maintenanceIssuesError }
  ] =
    await Promise.all([
      supabase.from("properties").select("*").order("created_at", { ascending: false }),
      supabase.from("inspections").select("*, inspection_photos(*)").order("timestamp", { ascending: false }),
      supabase.from("maintenance_issues").select("*").order("created_at", { ascending: false })
    ]);

  if (propertiesError) throw propertiesError;
  if (inspectionsError) throw inspectionsError;
  const maintenanceIssueRows = maintenanceIssuesError ? [] : (maintenanceIssues ?? []);

  return {
    properties: (properties ?? []).map((property) => ({
      id: property.id,
      name: property.name,
      owner: property.owner,
      address: property.address,
      phone: property.phone ?? "",
      email: property.email ?? "",
      accessNotes: property.access_notes ?? "",
      status: property.status
    })),
    inspections: (inspections ?? []).map((inspection) => ({
      id: inspection.id,
      propertyId: inspection.property_id,
      timestamp: inspection.timestamp,
      inspectorName: inspection.inspector_name,
      interiorTemperature: inspection.interior_temperature,
      checklist: inspection.checklist ?? [],
      notes: inspection.notes ?? "",
      urgent: inspection.urgent,
      photos: (inspection.inspection_photos ?? []).map((photo: SupabasePhotoRow) => ({
        id: photo.id,
        name: photo.name,
        url: `/api/photos/${inspection.id}/${path.basename(photo.storage_path)}`,
        storagePath: photo.storage_path,
        mimeType: photo.mime_type,
        size: photo.size
      }))
    })),
    maintenanceIssues: maintenanceIssueRows.map((issue) => ({
      id: issue.id,
      propertyId: issue.property_id,
      createdAt: issue.created_at,
      title: issue.title,
      description: issue.description ?? "",
      priority: issue.priority,
      status: issue.status,
      vendor: issue.vendor ?? "",
      nextStep: issue.next_step ?? ""
    }))
  };
}

async function addSupabaseProperty(property: Omit<Property, "id" | "status">) {
  const supabase = supabaseAdmin();
  const newProperty: Property = {
    id: `property-${Date.now()}`,
    status: "Active",
    ...property
  };

  const { error } = await supabase.from("properties").insert({
    id: newProperty.id,
    name: newProperty.name,
    owner: newProperty.owner,
    address: newProperty.address,
    phone: newProperty.phone,
    email: newProperty.email,
    access_notes: newProperty.accessNotes,
    status: newProperty.status
  });

  if (error) throw error;
  return newProperty;
}

async function addSupabaseInspection(
  inspection: Omit<Inspection, "id" | "timestamp" | "photos"> & {
    photos: PhotoUpload[] | InspectionPhoto[];
  }
) {
  const supabase = supabaseAdmin();
  const inspectionId = `inspection-${Date.now()}`;
  const photos = await saveSupabaseInspectionPhotos(inspectionId, inspection.photos);
  const newInspection: Inspection = {
    id: inspectionId,
    timestamp: new Date().toISOString(),
    ...inspection,
    photos
  };

  const { error: inspectionError } = await supabase.from("inspections").insert({
    id: newInspection.id,
    property_id: newInspection.propertyId,
    timestamp: newInspection.timestamp,
    inspector_name: newInspection.inspectorName,
    interior_temperature: newInspection.interiorTemperature,
    checklist: newInspection.checklist,
    notes: newInspection.notes,
    urgent: newInspection.urgent
  });

  if (inspectionError) throw inspectionError;

  if (photos.length) {
    const { error: photoError } = await supabase.from("inspection_photos").insert(
      photos.map((photo) => ({
        id: photo.id,
        inspection_id: inspectionId,
        name: photo.name,
        storage_path: photo.storagePath,
        mime_type: photo.mimeType,
        size: photo.size
      }))
    );

    if (photoError) throw photoError;
  }

  return newInspection;
}

async function addSupabaseMaintenanceIssue(issue: Omit<MaintenanceIssue, "id" | "createdAt">) {
  const supabase = supabaseAdmin();
  const newIssue: MaintenanceIssue = {
    id: `issue-${Date.now()}`,
    createdAt: new Date().toISOString(),
    ...issue
  };

  const { error } = await supabase.from("maintenance_issues").insert({
    id: newIssue.id,
    property_id: newIssue.propertyId,
    created_at: newIssue.createdAt,
    title: newIssue.title,
    description: newIssue.description,
    priority: newIssue.priority,
    status: newIssue.status,
    vendor: newIssue.vendor,
    next_step: newIssue.nextStep
  });

  if (error) throw error;
  return newIssue;
}

async function saveSupabaseInspectionPhotos(inspectionId: string, photos: PhotoUpload[] | InspectionPhoto[]) {
  if (!photos.length) return [];

  const supabase = supabaseAdmin();
  const savedPhotos: InspectionPhoto[] = [];

  for (const [index, photo] of photos.entries()) {
    if (!("data" in photo)) {
      savedPhotos.push(photo);
      continue;
    }

    const filename = `${index + 1}-${safePhotoBaseName(photo.name)}.jpg`;
    const storagePath = `${inspectionId}/${filename}`;
    const base64 = photo.data.includes(",") ? photo.data.split(",").pop() ?? "" : photo.data;
    const buffer = Buffer.from(base64, "base64");
    const { error } = await supabase.storage.from(storageBucket()).upload(storagePath, buffer, {
      contentType: "image/jpeg",
      upsert: true
    });

    if (error) throw error;

    savedPhotos.push({
      id: `photo-${inspectionId}-${index + 1}`,
      name: photo.name,
      url: `/api/photos/${inspectionId}/${filename}`,
      storagePath,
      mimeType: "image/jpeg",
      size: buffer.byteLength
    });
  }

  return savedPhotos;
}

async function deleteSupabaseProperty(propertyId: string) {
  const database = await readSupabaseDatabase();
  const propertyExists = database.properties.some((property) => property.id === propertyId);

  if (!propertyExists) {
    return null;
  }

  const supabase = supabaseAdmin();
  const storagePaths = database.inspections
    .filter((inspection) => inspection.propertyId === propertyId)
    .flatMap((inspection) => inspection.photos.map((photo) => photo.storagePath).filter(Boolean) as string[]);

  if (storagePaths.length) {
    await supabase.storage.from(storageBucket()).remove(storagePaths);
  }

  const { error } = await supabase.from("properties").delete().eq("id", propertyId);
  if (error) throw error;

  return readSupabaseDatabase();
}

function safePhotoBaseName(name: string) {
  return (
    name
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-z0-9-_]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase() || "inspection-photo"
  );
}

function contentTypeForFilename(filename: string) {
  const extension = path.extname(filename).toLowerCase();
  if (extension === ".png") return "image/png";
  if (extension === ".webp") return "image/webp";
  return "image/jpeg";
}

type SupabasePhotoRow = {
  id: string;
  name: string;
  storage_path: string;
  mime_type: string;
  size: number;
};
