import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

export type AdmissionApplicationStatus = "New" | "Reviewing" | "Accepted" | "Rejected";

export interface StoredAdmissionApplication {
  id: string;
  class_to_join: string;
  student_name: string;
  father_name: string;
  address: string;
  place: string;
  district: string;
  phone: string;
  phone_number: string;
  whatsapp: string;
  whatsapp_number: string;
  status: AdmissionApplicationStatus;
  created_at: string;
  updated_at: string;
  notes?: string;
  custom_fields?: Record<string, string>;
}

// Locate or initialize the data directory
const DATA_DIR = path.resolve(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, "admission_applications.db");
const JSON_BACKUP_PATH = path.join(DATA_DIR, "admission_applications.json");

let sqliteDb: DatabaseSync | null = null;

function getDb(): DatabaseSync {
  if (!sqliteDb) {
    sqliteDb = new DatabaseSync(DB_PATH);
    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS admission_applications (
        id TEXT PRIMARY KEY,
        class_to_join TEXT NOT NULL,
        student_name TEXT NOT NULL,
        father_name TEXT NOT NULL,
        address TEXT NOT NULL,
        place TEXT NOT NULL,
        district TEXT NOT NULL,
        phone_number TEXT NOT NULL,
        whatsapp_number TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'New',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        notes TEXT DEFAULT '',
        custom_fields TEXT DEFAULT '{}'
      );
    `);
  }
  return sqliteDb;
}

// Atomic backup write to JSON for durability and easy recovery
function syncToJsonFile(applications: StoredAdmissionApplication[]) {
  try {
    const tmpPath = `${JSON_BACKUP_PATH}.tmp.${Date.now()}`;
    fs.writeFileSync(tmpPath, JSON.stringify(applications, null, 2), "utf8");
    fs.renameSync(tmpPath, JSON_BACKUP_PATH);
  } catch (err) {
    console.error("[Admission DB] Failed to write JSON backup:", err);
  }
}

// Read from JSON backup if SQLite is empty or needs restore
function restoreFromJsonFile(): StoredAdmissionApplication[] {
  try {
    if (fs.existsSync(JSON_BACKUP_PATH)) {
      const content = fs.readFileSync(JSON_BACKUP_PATH, "utf8");
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn("[Admission DB] Could not restore from JSON backup:", err);
  }
  return [];
}

function rowToApplication(row: Record<string, unknown>): StoredAdmissionApplication {
  let customFields: Record<string, string> = {};
  if (row.custom_fields) {
    try {
      customFields =
        typeof row.custom_fields === "string"
          ? JSON.parse(row.custom_fields)
          : (row.custom_fields as Record<string, string>);
    } catch {
      customFields = {};
    }
  }

  const phone = String(row.phone_number || row.phone || "");
  const whatsapp = String(row.whatsapp_number || row.whatsapp || phone);

  return {
    id: String(row.id),
    class_to_join: String(row.class_to_join || ""),
    student_name: String(row.student_name || ""),
    father_name: String(row.father_name || ""),
    address: String(row.address || ""),
    place: String(row.place || ""),
    district: String(row.district || ""),
    phone,
    phone_number: phone,
    whatsapp,
    whatsapp_number: whatsapp,
    status: (row.status || "New") as AdmissionApplicationStatus,
    created_at: String(row.created_at || new Date().toISOString()),
    updated_at: String(row.updated_at || row.created_at || new Date().toISOString()),
    notes: String(row.notes || ""),
    custom_fields: customFields,
  };
}

function isSpamOrInvalid(app: StoredAdmissionApplication): boolean {
  const name = (app.student_name || "").toLowerCase().trim();
  const phone = (app.phone_number || app.phone || "").replace(/\D/g, "");
  const address = (app.address || "").toLowerCase().trim();

  // Flag dummy test phones like 00000000000
  if (/^0+$/.test(phone) || phone.length < 5) return true;
  // Flag gibberish dummy test addresses
  if (address === "wrlbweurylvweuy" || address === "test" || address === "asdf") return true;
  if (!name || name === "test") return true;

  return false;
}

function deduplicateApplications(apps: StoredAdmissionApplication[]): StoredAdmissionApplication[] {
  const seen = new Set<string>();
  const cleanList: StoredAdmissionApplication[] = [];

  for (const app of apps) {
    if (isSpamOrInvalid(app)) continue;

    // Deduplicate by student name + class or phone
    const cleanPhone = (app.phone_number || app.phone || "").replace(/\D/g, "");
    const key = `${app.student_name.toLowerCase().trim()}_${app.father_name.toLowerCase().trim()}_${cleanPhone}`;

    if (!seen.has(key)) {
      seen.add(key);
      cleanList.push(app);
    }
  }

  return cleanList;
}

export function getAllApplications(): StoredAdmissionApplication[] {
  try {
    const db = getDb();
    const rows = db.prepare("SELECT * FROM admission_applications ORDER BY created_at DESC").all();
    if (rows && rows.length > 0) {
      const allApps = rows.map(rowToApplication);
      const cleanApps = deduplicateApplications(allApps);

      // If dirty entries were filtered, clean SQLite database table
      if (cleanApps.length !== allApps.length) {
        try {
          const keepIds = new Set(cleanApps.map((a) => a.id));
          const toDelete = allApps.filter((a) => !keepIds.has(a.id));
          const delStmt = db.prepare("DELETE FROM admission_applications WHERE id = ?");
          for (const d of toDelete) {
            delStmt.run(d.id);
          }
        } catch (cleanErr) {
          console.warn("[Admission DB] SQLite purge error:", cleanErr);
        }
      }

      syncToJsonFile(cleanApps);
      return cleanApps;
    }
  } catch (err) {
    console.error("[Admission DB] Query error from SQLite:", err);
  }

  // Fallback to JSON file if SQLite had no rows or had an issue
  const fromJson = restoreFromJsonFile();
  const cleanJson = deduplicateApplications(fromJson);
  if (cleanJson.length > 0) {
    try {
      const db = getDb();
      for (const item of cleanJson) {
        insertRowIntoDb(db, item);
      }
    } catch (importErr) {
      console.warn("[Admission DB] Failed to re-insert JSON backup into SQLite:", importErr);
    }
  }
  syncToJsonFile(cleanJson);
  return cleanJson;
}

function insertRowIntoDb(db: DatabaseSync, app: StoredAdmissionApplication) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO admission_applications (
      id, class_to_join, student_name, father_name, address, place, district,
      phone_number, whatsapp_number, status, created_at, updated_at, notes, custom_fields
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?
    )
  `);

  stmt.run(
    app.id,
    app.class_to_join,
    app.student_name,
    app.father_name,
    app.address,
    app.place,
    app.district,
    app.phone_number || app.phone,
    app.whatsapp_number || app.whatsapp,
    app.status,
    app.created_at,
    app.updated_at,
    app.notes || "",
    JSON.stringify(app.custom_fields || {}),
  );
}

export function createApplication(input: {
  class_to_join: string;
  student_name: string;
  father_name: string;
  address: string;
  place: string;
  district: string;
  phone?: string;
  phone_number?: string;
  whatsapp?: string;
  whatsapp_number?: string;
  status?: AdmissionApplicationStatus;
  created_at?: string;
  notes?: string;
  custom_fields?: Record<string, string>;
}): StoredAdmissionApplication {
  const db = getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const phone = (input.phone_number || input.phone || "").trim();
  const whatsapp = (input.whatsapp_number || input.whatsapp || phone).trim();

  const newApp: StoredAdmissionApplication = {
    id,
    class_to_join: input.class_to_join.trim(),
    student_name: input.student_name.trim(),
    father_name: input.father_name.trim(),
    address: input.address.trim(),
    place: input.place.trim(),
    district: input.district.trim(),
    phone,
    phone_number: phone,
    whatsapp,
    whatsapp_number: whatsapp,
    status: input.status || "New",
    created_at: input.created_at || now,
    updated_at: now,
    notes: input.notes || "",
    custom_fields: input.custom_fields || {},
  };

  insertRowIntoDb(db, newApp);

  const all = getAllApplications();
  syncToJsonFile(all);

  return newApp;
}

export function updateApplication(
  id: string,
  patch: { status?: AdmissionApplicationStatus; notes?: string },
): StoredAdmissionApplication | null {
  const db = getDb();
  const now = new Date().toISOString();

  const existingRow = db.prepare("SELECT * FROM admission_applications WHERE id = ?").get(id);
  if (!existingRow) {
    return null;
  }

  const existing = rowToApplication(existingRow);
  const updated: StoredAdmissionApplication = {
    ...existing,
    ...(patch.status ? { status: patch.status } : {}),
    ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
    updated_at: now,
  };

  insertRowIntoDb(db, updated);

  const all = getAllApplications();
  syncToJsonFile(all);

  return updated;
}

export function deleteApplication(id: string): boolean {
  const db = getDb();
  const stmt = db.prepare("DELETE FROM admission_applications WHERE id = ?");
  stmt.run(id);

  const all = getAllApplications();
  syncToJsonFile(all);

  return true;
}
