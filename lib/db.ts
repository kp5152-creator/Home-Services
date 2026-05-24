import { promises as fs } from "fs";
import path from "path";
import type {
  Database,
  Inspection,
  InspectionPhoto,
  MaintenanceIssue,
  MaintenanceIssuePhoto,
  MaintenancePriority,
  MaintenanceStatus,
  OwnerUpdate,
  Property,
  ScheduleTask,
  ScheduleTaskStatus,
  VendorContact
} from "@/lib/types";
import { hasSupabaseConfig, storageBucket, supabaseAdmin } from "@/lib/supabaseAdmin";

const dbPath = path.join(process.cwd(), "data", "db.json");
const inspectionUploadsRoot = path.join(process.cwd(), "public", "uploads", "inspections");
const maintenanceUploadsRoot = path.join(process.cwd(), "public", "uploads", "maintenance");

export type PhotoUpload = {
  name: string;
  type: string;
  data: string;
};

export type MaintenanceIssueUpdate = Partial<
  Pick<MaintenanceIssue, "title" | "description" | "priority" | "status" | "vendor" | "nextStep">
>;

export type ScheduleTaskUpdate = Partial<Pick<ScheduleTask, "status">>;

export async function readDatabase(): Promise<Database> {
  if (hasSupabaseConfig()) {
    return readSupabaseDatabase();
  }

  const raw = await fs.readFile(dbPath, "utf8");
  const database = JSON.parse(raw) as Database;
  return {
    properties: database.properties,
    inspections: (database.inspections ?? []).map((inspection) => ({
      ...inspection,
      photos: (inspection.photos ?? []).map((photo) => ({
        ...photo,
        url: normalizeInspectionPhotoUrl(photo.url)
      }))
    })),
    maintenanceIssues: (database.maintenanceIssues ?? []).map((issue) => ({
      ...issue,
      photos: (issue.photos ?? []).map((photo) => ({
        ...photo,
        url: normalizeMaintenancePhotoUrl(photo.url)
      }))
    })),
    vendors: database.vendors ?? [],
    scheduleTasks: database.scheduleTasks ?? [],
    ownerUpdates: database.ownerUpdates ?? []
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

export async function addMaintenanceIssue(
  issue: Omit<MaintenanceIssue, "id" | "createdAt" | "photos"> & {
    photos: PhotoUpload[] | MaintenanceIssuePhoto[];
  }
) {
  if (hasSupabaseConfig()) {
    return addSupabaseMaintenanceIssue(issue);
  }

  const database = await readDatabase();
  const issueId = `issue-${Date.now()}`;
  const photos = await saveMaintenanceIssuePhotos(issueId, issue.photos);
  const newIssue: MaintenanceIssue = {
    id: issueId,
    createdAt: new Date().toISOString(),
    ...issue,
    photos
  };

  database.maintenanceIssues = [newIssue, ...(database.maintenanceIssues ?? [])];
  await writeDatabase(database);
  return newIssue;
}

export async function addVendorContact(vendor: Omit<VendorContact, "id" | "createdAt">) {
  if (hasSupabaseConfig()) {
    return addSupabaseVendorContact(vendor);
  }

  const database = await readDatabase();
  const newVendor: VendorContact = {
    id: `vendor-${Date.now()}`,
    createdAt: new Date().toISOString(),
    ...vendor
  };

  database.vendors = [newVendor, ...(database.vendors ?? [])];
  await writeDatabase(database);
  return newVendor;
}

export async function addScheduleTask(task: Omit<ScheduleTask, "id" | "createdAt">) {
  if (hasSupabaseConfig()) {
    return addSupabaseScheduleTask(task);
  }

  const database = await readDatabase();
  const newTask: ScheduleTask = {
    id: `schedule-${Date.now()}`,
    createdAt: new Date().toISOString(),
    ...task
  };

  database.scheduleTasks = [newTask, ...(database.scheduleTasks ?? [])];
  await writeDatabase(database);
  return newTask;
}

export async function addOwnerUpdate(update: Omit<OwnerUpdate, "id" | "createdAt">) {
  if (hasSupabaseConfig()) {
    return addSupabaseOwnerUpdate(update);
  }

  const database = await readDatabase();
  const newUpdate: OwnerUpdate = {
    id: `owner-update-${Date.now()}`,
    createdAt: new Date().toISOString(),
    ...update
  };

  database.ownerUpdates = [newUpdate, ...(database.ownerUpdates ?? [])];
  await writeDatabase(database);
  return newUpdate;
}

export async function updateMaintenanceIssueStatus(issueId: string, status: MaintenanceStatus) {
  return updateMaintenanceIssue(issueId, { status });
}

export async function updateScheduleTaskStatus(taskId: string, status: ScheduleTaskStatus) {
  if (hasSupabaseConfig()) {
    return updateSupabaseScheduleTaskStatus(taskId, status);
  }

  const database = await readDatabase();
  const task = (database.scheduleTasks ?? []).find((item) => item.id === taskId);

  if (!task) {
    return null;
  }

  const updatedTask: ScheduleTask = {
    ...task,
    status
  };

  database.scheduleTasks = (database.scheduleTasks ?? []).map((item) =>
    item.id === taskId ? updatedTask : item
  );
  await writeDatabase(database);
  return updatedTask;
}

export async function updateMaintenanceIssue(issueId: string, updates: MaintenanceIssueUpdate) {
  if (hasSupabaseConfig()) {
    return updateSupabaseMaintenanceIssue(issueId, updates);
  }

  const database = await readDatabase();
  const issue = database.maintenanceIssues.find((item) => item.id === issueId);

  if (!issue) {
    return null;
  }

  const updatedIssue: MaintenanceIssue = {
    ...issue,
    ...updates
  };

  database.maintenanceIssues = database.maintenanceIssues.map((item) =>
    item.id === issueId ? updatedIssue : item
  );
  await writeDatabase(database);
  return updatedIssue;
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
    maintenanceIssues: (database.maintenanceIssues ?? []).filter((issue) => issue.propertyId !== propertyId),
    vendors: (database.vendors ?? []).filter((vendor) => vendor.propertyId !== propertyId),
    scheduleTasks: (database.scheduleTasks ?? []).filter((task) => task.propertyId !== propertyId),
    ownerUpdates: (database.ownerUpdates ?? []).filter((update) => update.propertyId !== propertyId)
  };

  await Promise.all(
    database.inspections
      .filter((inspection) => inspection.propertyId === propertyId)
      .map((inspection) => fs.rm(path.join(inspectionUploadsRoot, inspection.id), { force: true, recursive: true }))
  );
  await Promise.all(
    (database.maintenanceIssues ?? [])
      .filter((issue) => issue.propertyId === propertyId)
      .map((issue) => fs.rm(path.join(maintenanceUploadsRoot, issue.id), { force: true, recursive: true }))
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

  return readLocalPhotoAsset(inspectionUploadsRoot, inspectionId, filename);
}

export async function readMaintenancePhotoAsset(issueId: string, filename: string) {
  if (hasSupabaseConfig()) {
    const supabase = supabaseAdmin();
    const { data, error } = await supabase.storage.from(storageBucket()).download(`maintenance/${issueId}/${filename}`);

    if (error || !data) {
      return null;
    }

    const buffer = Buffer.from(await data.arrayBuffer());
    return {
      buffer,
      contentType: contentTypeForFilename(filename)
    };
  }

  return readLocalPhotoAsset(maintenanceUploadsRoot, issueId, filename);
}

async function readLocalPhotoAsset(root: string, folder: string, filename: string) {
  const photoPath = path.join(root, folder, filename);
  const resolvedPhotoPath = path.resolve(photoPath);

  if (!resolvedPhotoPath.startsWith(path.resolve(root))) {
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

async function saveInspectionPhotos(inspectionId: string, photos: PhotoUpload[] | InspectionPhoto[]) {
  return saveLocalPhotos({
    folderId: inspectionId,
    photos,
    root: inspectionUploadsRoot,
    urlPrefix: "/api/photos"
  });
}

async function saveMaintenanceIssuePhotos(issueId: string, photos: PhotoUpload[] | MaintenanceIssuePhoto[]) {
  return saveLocalPhotos({
    folderId: issueId,
    photos,
    root: maintenanceUploadsRoot,
    urlPrefix: "/api/maintenance-photos"
  });
}

async function saveLocalPhotos({
  folderId,
  photos,
  root,
  urlPrefix
}: {
  folderId: string;
  photos: PhotoUpload[] | InspectionPhoto[];
  root: string;
  urlPrefix: string;
}) {
  if (!photos.length) return [];

  const uploadDir = path.join(root, folderId);
  await fs.mkdir(uploadDir, { recursive: true });

  const savedPhotos: InspectionPhoto[] = [];

  for (const [index, photo] of photos.entries()) {
    if (!("data" in photo)) {
      savedPhotos.push(photo);
      continue;
    }

    const filename = `${index + 1}-${safePhotoBaseName(photo.name)}.jpg`;
    const filePath = path.join(uploadDir, filename);
    const base64 = photo.data.includes(",") ? photo.data.split(",").pop() ?? "" : photo.data;
    const buffer = Buffer.from(base64, "base64");

    await fs.writeFile(filePath, buffer);
    savedPhotos.push({
      id: `photo-${folderId}-${index + 1}`,
      name: photo.name,
      url: `${urlPrefix}/${folderId}/${filename}`,
      mimeType: "image/jpeg",
      size: buffer.byteLength
    });
  }

  return savedPhotos;
}

function normalizeInspectionPhotoUrl(url: string) {
  if (url.startsWith("/api/photos/")) {
    return url;
  }

  return url.replace("/uploads/inspections/", "/api/photos/");
}

function normalizeMaintenancePhotoUrl(url: string) {
  if (url.startsWith("/api/maintenance-photos/")) {
    return url;
  }

  return url.replace("/uploads/maintenance/", "/api/maintenance-photos/");
}

async function readSupabaseDatabase(): Promise<Database> {
  const supabase = supabaseAdmin();
  const [
    { data: properties, error: propertiesError },
    { data: inspections, error: inspectionsError },
    { data: maintenanceIssues, error: maintenanceIssuesError },
    { data: vendors, error: vendorsError },
    { data: scheduleTasks, error: scheduleTasksError },
    { data: ownerUpdates, error: ownerUpdatesError }
  ] = await Promise.all([
    supabase.from("properties").select("*").order("created_at", { ascending: false }),
    supabase.from("inspections").select("*, inspection_photos(*)").order("timestamp", { ascending: false }),
    supabase
      .from("maintenance_issues")
      .select("*, maintenance_issue_photos(*)")
      .order("created_at", { ascending: false }),
    supabase.from("vendors").select("*").order("created_at", { ascending: false }),
    supabase.from("schedule_tasks").select("*").order("scheduled_for", { ascending: true }),
    supabase.from("owner_updates").select("*").order("created_at", { ascending: false })
  ]);

  if (propertiesError) throw propertiesError;
  if (inspectionsError) throw inspectionsError;
  const maintenanceIssueRows = maintenanceIssuesError ? [] : (maintenanceIssues ?? []);
  const vendorRows = vendorsError ? [] : (vendors ?? []);
  const scheduleTaskRows = scheduleTasksError ? [] : (scheduleTasks ?? []);
  const ownerUpdateRows = ownerUpdatesError ? [] : (ownerUpdates ?? []);

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
      nextStep: issue.next_step ?? "",
      photos: (issue.maintenance_issue_photos ?? []).map((photo: SupabasePhotoRow) => ({
        id: photo.id,
        name: photo.name,
        url: `/api/maintenance-photos/${issue.id}/${path.basename(photo.storage_path)}`,
        storagePath: photo.storage_path,
        mimeType: photo.mime_type,
        size: photo.size
      }))
    })),
    vendors: vendorRows.map((vendor) => ({
      id: vendor.id,
      propertyId: vendor.property_id,
      createdAt: vendor.created_at,
      name: vendor.name,
      type: vendor.type,
      contactName: vendor.contact_name ?? "",
      phone: vendor.phone ?? "",
      email: vendor.email ?? "",
      notes: vendor.notes ?? ""
    })),
    scheduleTasks: scheduleTaskRows.map((task) => ({
      id: task.id,
      propertyId: task.property_id,
      createdAt: task.created_at,
      scheduledFor: task.scheduled_for,
      type: task.type,
      title: task.title,
      status: task.status,
      assignedTo: task.assigned_to ?? "",
      notes: task.notes ?? ""
    })),
    ownerUpdates: ownerUpdateRows.map((update) => ({
      id: update.id,
      propertyId: update.property_id,
      createdAt: update.created_at,
      category: update.category,
      title: update.title,
      message: update.message ?? "",
      status: update.status
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

async function addSupabaseMaintenanceIssue(
  issue: Omit<MaintenanceIssue, "id" | "createdAt" | "photos"> & {
    photos: PhotoUpload[] | MaintenanceIssuePhoto[];
  }
) {
  const supabase = supabaseAdmin();
  const issueId = `issue-${Date.now()}`;
  const photos = await saveSupabaseMaintenanceIssuePhotos(issueId, issue.photos);
  const newIssue: MaintenanceIssue = {
    id: issueId,
    createdAt: new Date().toISOString(),
    ...issue,
    photos
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

  if (photos.length) {
    const { error: photoError } = await supabase.from("maintenance_issue_photos").insert(
      photos.map((photo) => ({
        id: photo.id,
        issue_id: issueId,
        name: photo.name,
        storage_path: photo.storagePath,
        mime_type: photo.mimeType,
        size: photo.size
      }))
    );

    if (photoError) throw photoError;
  }

  return newIssue;
}

async function addSupabaseVendorContact(vendor: Omit<VendorContact, "id" | "createdAt">) {
  const supabase = supabaseAdmin();
  const newVendor: VendorContact = {
    id: `vendor-${Date.now()}`,
    createdAt: new Date().toISOString(),
    ...vendor
  };

  const { error } = await supabase.from("vendors").insert({
    id: newVendor.id,
    created_at: newVendor.createdAt,
    property_id: newVendor.propertyId,
    name: newVendor.name,
    type: newVendor.type,
    contact_name: newVendor.contactName,
    phone: newVendor.phone,
    email: newVendor.email,
    notes: newVendor.notes
  });

  if (error) throw error;
  return newVendor;
}

async function addSupabaseScheduleTask(task: Omit<ScheduleTask, "id" | "createdAt">) {
  const supabase = supabaseAdmin();
  const newTask: ScheduleTask = {
    id: `schedule-${Date.now()}`,
    createdAt: new Date().toISOString(),
    ...task
  };

  const { error } = await supabase.from("schedule_tasks").insert({
    id: newTask.id,
    created_at: newTask.createdAt,
    property_id: newTask.propertyId,
    scheduled_for: newTask.scheduledFor,
    type: newTask.type,
    title: newTask.title,
    status: newTask.status,
    assigned_to: newTask.assignedTo,
    notes: newTask.notes
  });

  if (error) throw error;
  return newTask;
}

async function addSupabaseOwnerUpdate(update: Omit<OwnerUpdate, "id" | "createdAt">) {
  const supabase = supabaseAdmin();
  const newUpdate: OwnerUpdate = {
    id: `owner-update-${Date.now()}`,
    createdAt: new Date().toISOString(),
    ...update
  };

  const { error } = await supabase.from("owner_updates").insert({
    id: newUpdate.id,
    created_at: newUpdate.createdAt,
    property_id: newUpdate.propertyId,
    category: newUpdate.category,
    title: newUpdate.title,
    message: newUpdate.message,
    status: newUpdate.status
  });

  if (error) throw error;
  return newUpdate;
}

async function updateSupabaseScheduleTaskStatus(taskId: string, status: ScheduleTaskStatus) {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("schedule_tasks")
    .update({ status })
    .eq("id", taskId)
    .select("*")
    .single();

  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    propertyId: data.property_id,
    createdAt: data.created_at,
    scheduledFor: data.scheduled_for,
    type: data.type,
    title: data.title,
    status: data.status,
    assignedTo: data.assigned_to ?? "",
    notes: data.notes ?? ""
  } satisfies ScheduleTask;
}

async function updateSupabaseMaintenanceIssue(issueId: string, updates: MaintenanceIssueUpdate) {
  const supabase = supabaseAdmin();
  const updateRow: {
    title?: string;
    description?: string;
    priority?: MaintenancePriority;
    status?: MaintenanceStatus;
    vendor?: string;
    next_step?: string;
  } = {};

  if (updates.title !== undefined) updateRow.title = updates.title;
  if (updates.description !== undefined) updateRow.description = updates.description;
  if (updates.priority !== undefined) updateRow.priority = updates.priority;
  if (updates.status !== undefined) updateRow.status = updates.status;
  if (updates.vendor !== undefined) updateRow.vendor = updates.vendor;
  if (updates.nextStep !== undefined) updateRow.next_step = updates.nextStep;

  const { data, error } = await supabase
    .from("maintenance_issues")
    .update(updateRow)
    .eq("id", issueId)
    .select("*, maintenance_issue_photos(*)")
    .single();

  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    propertyId: data.property_id,
    createdAt: data.created_at,
    title: data.title,
    description: data.description ?? "",
    priority: data.priority,
    status: data.status,
    vendor: data.vendor ?? "",
    nextStep: data.next_step ?? "",
    photos: (data.maintenance_issue_photos ?? []).map((photo: SupabasePhotoRow) => ({
      id: photo.id,
      name: photo.name,
      url: `/api/maintenance-photos/${data.id}/${path.basename(photo.storage_path)}`,
      storagePath: photo.storage_path,
      mimeType: photo.mime_type,
      size: photo.size
    }))
  } satisfies MaintenanceIssue;
}

async function saveSupabaseInspectionPhotos(inspectionId: string, photos: PhotoUpload[] | InspectionPhoto[]) {
  return saveSupabasePhotos({
    folderPath: inspectionId,
    photos,
    urlPrefix: "/api/photos"
  });
}

async function saveSupabaseMaintenanceIssuePhotos(issueId: string, photos: PhotoUpload[] | MaintenanceIssuePhoto[]) {
  return saveSupabasePhotos({
    folderPath: `maintenance/${issueId}`,
    photos,
    urlPrefix: "/api/maintenance-photos",
    urlFolderId: issueId
  });
}

async function saveSupabasePhotos({
  folderPath,
  photos,
  urlFolderId,
  urlPrefix
}: {
  folderPath: string;
  photos: PhotoUpload[] | InspectionPhoto[];
  urlFolderId?: string;
  urlPrefix: string;
}) {
  if (!photos.length) return [];

  const supabase = supabaseAdmin();
  const savedPhotos: InspectionPhoto[] = [];
  const urlId = urlFolderId ?? folderPath;

  for (const [index, photo] of photos.entries()) {
    if (!("data" in photo)) {
      savedPhotos.push(photo);
      continue;
    }

    const filename = `${index + 1}-${safePhotoBaseName(photo.name)}.jpg`;
    const storagePath = `${folderPath}/${filename}`;
    const base64 = photo.data.includes(",") ? photo.data.split(",").pop() ?? "" : photo.data;
    const buffer = Buffer.from(base64, "base64");
    const { error } = await supabase.storage.from(storageBucket()).upload(storagePath, buffer, {
      contentType: "image/jpeg",
      upsert: true
    });

    if (error) throw error;

    savedPhotos.push({
      id: `photo-${urlId}-${index + 1}`,
      name: photo.name,
      url: `${urlPrefix}/${urlId}/${filename}`,
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
  const maintenanceStoragePaths = database.maintenanceIssues
    .filter((issue) => issue.propertyId === propertyId)
    .flatMap((issue) => issue.photos.map((photo) => photo.storagePath).filter(Boolean) as string[]);

  if (storagePaths.length || maintenanceStoragePaths.length) {
    await supabase.storage.from(storageBucket()).remove([...storagePaths, ...maintenanceStoragePaths]);
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
